import cron from "node-cron";
import { Complaint } from "../models/Complaint.js";
import { User } from "../models/User.js";
import { STATUSES, VERIFICATION_METHODS, AUDIT_ACTIONS, ROLES } from "../utils/constants.js";
import { escalateComplaint } from "./escalation.service.js";
import { createAuditLog } from "./audit.service.js";
import { notifyComplaintStatusUpdated, notifyComplaintAssigned } from "./notification.service.js";

let cronJob = null;
let isJobRunning = false;

/**
 * Task A: Check unassigned tickets exceeding 25% of their SLA timeline
 */
const processUnassignedTickets = async () => {
  const now = new Date();
  const unassignedTickets = await Complaint.find({
    status: STATUSES.SUBMITTED,
    assignedTo: null
  }).populate("department");

  for (const complaint of unassignedTickets) {
    try {
      const elapsedHours = (now.getTime() - new Date(complaint.createdAt).getTime()) / (1000 * 60 * 60);
      const gracePeriodHours = (complaint.sla.hours || 24) * 0.25;

      if (elapsedHours >= gracePeriodHours) {
        // Attempt auto-assignment to staff in department with fewest active tickets
        const staffList = await User.find({
          role: ROLES.STAFF,
          department: complaint.department?._id,
          isActive: true
        });

        if (staffList.length > 0) {
          // Find staff with least active assignments
          const staffWithLoads = await Promise.all(
            staffList.map(async (st) => {
              const activeCount = await Complaint.countDocuments({
                assignedTo: st._id,
                status: { $in: [STATUSES.ASSIGNED, STATUSES.IN_PROGRESS] }
              });
              return { staff: st, activeCount };
            })
          );

          staffWithLoads.sort((a, b) => a.activeCount - b.activeCount);
          const chosenStaff = staffWithLoads[0].staff;

          const updated = await Complaint.findOneAndUpdate(
            { _id: complaint._id, status: STATUSES.SUBMITTED, assignedTo: null },
            {
              $set: {
                assignedTo: chosenStaff._id,
                assignedAt: now,
                status: STATUSES.ASSIGNED
              },
              $push: {
                statusHistory: {
                  status: STATUSES.ASSIGNED,
                  at: now,
                  note: `Auto-assigned to ${chosenStaff.name} (exceeded 25% SLA unassigned threshold)`
                }
              }
            },
            { new: true }
          ).populate("department createdBy assignedTo");

          if (updated) {
            await createAuditLog({
              action: AUDIT_ACTIONS.COMPLAINT_ASSIGNED,
              entityType: "Complaint",
              entityId: updated._id,
              performedBySystem: true,
              metadata: { assignedTo: chosenStaff._id, autoAssigned: true }
            });
            await notifyComplaintAssigned(updated, chosenStaff);
          }
        } else {
          // No staff available - escalate to Department Head
          await escalateComplaint(complaint._id, "Unassigned ticket exceeded 25% SLA threshold");
        }
      }
    } catch (err) {
      console.error(`Error processing unassigned ticket ${complaint._id}:`, err.message);
    }
  }
};

/**
 * Task B: SLA Breached Tickets Detection & Escalation
 */
const processSlaBreaches = async () => {
  const now = new Date();

  // Find tickets past dueAt that are active and have not been escalated recently
  const breachedTickets = await Complaint.find({
    status: { $nin: [STATUSES.CLOSED, STATUSES.PENDING_VERIFICATION] },
    "sla.dueAt": { $lte: now }
  });

  for (const ticket of breachedTickets) {
    try {
      // If already at level 2 or escalated in last 6 hours, avoid rapid duplicate loop
      const lastEscalated = ticket.sla.escalatedAt ? new Date(ticket.sla.escalatedAt).getTime() : 0;
      const hoursSinceEscalation = (now.getTime() - lastEscalated) / (1000 * 60 * 60);

      if (!ticket.sla.escalatedAt || (ticket.sla.escalationLevel < 2 && hoursSinceEscalation >= 6)) {
        await escalateComplaint(ticket._id, "SLA Resolution Deadline Breached");
      }
    } catch (err) {
      console.error(`Error processing SLA breach for ticket ${ticket._id}:`, err.message);
    }
  }
};

/**
 * Task C: Auto-Close Stale Pending Verification Tickets after 48 hours
 */
const processStalePendingVerifications = async () => {
  const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const staleTickets = await Complaint.find({
    status: STATUSES.PENDING_VERIFICATION,
    "resolution.resolvedAt": { $lte: cutoffTime }
  });

  for (const ticket of staleTickets) {
    try {
      const updated = await Complaint.findOneAndUpdate(
        {
          _id: ticket._id,
          status: STATUSES.PENDING_VERIFICATION
        },
        {
          $set: {
            status: STATUSES.CLOSED,
            "resolution.verifiedAt": new Date(),
            "resolution.verificationMethod": VERIFICATION_METHODS.AUTO_CLOSED
          },
          $push: {
            statusHistory: {
              status: STATUSES.CLOSED,
              at: new Date(),
              note: "Auto-closed after 48 hours without student dispute."
            }
          }
        },
        { new: true }
      ).populate("createdBy assignedTo");

      if (updated) {
        // Update staff resolution stats
        if (updated.assignedTo) {
          await User.findByIdAndUpdate(updated.assignedTo._id || updated.assignedTo, {
            $inc: { "performance.resolvedCount": 1 }
          });
        }

        await createAuditLog({
          action: AUDIT_ACTIONS.COMPLAINT_AUTO_CLOSED,
          entityType: "Complaint",
          entityId: updated._id,
          performedBySystem: true,
          metadata: { ticketId: updated.ticketId }
        });

        await notifyComplaintStatusUpdated(updated, "Auto-closed after 48 hours");
      }
    } catch (err) {
      console.error(`Error auto-closing ticket ${ticket._id}:`, err.message);
    }
  }
};

/**
 * Master cron runner executed every 5 minutes
 */
const executeCronCycle = async () => {
  if (isJobRunning) {
    console.log("⏱️ Previous cron cycle still running, skipping overlap.");
    return;
  }

  isJobRunning = true;
  try {
    await processUnassignedTickets();
    await processSlaBreaches();
    await processStalePendingVerifications();
  } catch (err) {
    console.error("❌ Cron cycle error:", err.message);
  } finally {
    isJobRunning = false;
  }
};

/**
 * Initializes SLA and Escalation Cron Job (runs every 5 minutes)
 */
export const startCronJobs = () => {
  if (cronJob) return;

  // Run every 5 minutes: "*/5 * * * *"
  cronJob = cron.schedule("*/5 * * * *", executeCronCycle);
  console.log("⏰ SLA & Escalation Cron job scheduled (running every 5 minutes).");
};

/**
 * Stops cron jobs cleanly on server shutdown
 */
export const stopCronJobs = () => {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log("🛑 Cron jobs stopped gracefully.");
  }
};
