import { Complaint } from "../models/Complaint.js";
import { User } from "../models/User.js";
import { STATUSES, AUDIT_ACTIONS, ROLES } from "../utils/constants.js";
import { createAuditLog } from "./audit.service.js";
import {
  notifyComplaintEscalated,
  notifyComplaintStatusUpdated
} from "./notification.service.js";

/**
 * Escalates a complaint due to SLA breach or unassigned timeout
 * Level 1: Escalated to Department Head
 * Level 2+: Escalated to Chief Warden / Admin
 */
export const escalateComplaint = async (complaintId, reason = "SLA Breach") => {
  const complaint = await Complaint.findById(complaintId).populate("department");
  if (!complaint) return null;

  // Do not escalate closed or pending verification complaints
  if ([STATUSES.CLOSED, STATUSES.PENDING_VERIFICATION].includes(complaint.status)) {
    return null;
  }

  const currentLevel = complaint.sla.escalationLevel || 0;
  const newLevel = currentLevel + 1;

  // Determine escalation contact based on level
  let contactUser = null;
  const is3DayBreach = reason.includes("3-Day") || reason.includes("72-Hour");

  if (newLevel >= 3 || is3DayBreach) {
    // Level 3+: Escalated directly to NAAC Higher Oversight Committee
    contactUser = await User.findOne({ role: ROLES.NAAC, isActive: true });
    if (!contactUser) {
      contactUser = await User.findOne({ role: ROLES.ADMIN, isActive: true });
    }
  } else if (newLevel === 1 && complaint.department?.head) {
    contactUser = await User.findById(complaint.department.head);
  } else if (complaint.department?.escalationContact) {
    contactUser = await User.findById(complaint.department.escalationContact);
  } else {
    // Fallback to primary admin
    contactUser = await User.findOne({ role: ROLES.ADMIN, isActive: true });
  }

  // Atomically update complaint status and escalation level
  const updatedComplaint = await Complaint.findOneAndUpdate(
    {
      _id: complaintId,
      "sla.escalationLevel": currentLevel // Concurrency guard
    },
    {
      $set: {
        status: STATUSES.ESCALATED,
        "sla.breached": true,
        "sla.escalatedAt": new Date(),
        "sla.escalationLevel": Math.max(newLevel, is3DayBreach ? 3 : newLevel),
        ...(is3DayBreach || newLevel >= 3
          ? {
              "naacReview.isSevere": true,
              "naacReview.requiresInspection": true,
              "naacReview.breach3Days": true,
              "naacReview.inspectionStatus": "pending_inspection",
              "naacReview.verifiedSeverity": "Statutory 3-Day Inaction Breach - Non-Compliance with NAAC Criterion 5.1.4"
            }
          : {})
      },
      $push: {
        statusHistory: {
          status: STATUSES.ESCALATED,
          at: new Date(),
          note: is3DayBreach || newLevel >= 3
            ? `🚨 CRITICAL: Escalated to NAAC Higher Accreditation Committee due to > 3 Days (72 Hours) complete inaction. Action against College / Department pending.`
            : `Auto-escalated to Level ${newLevel}. Reason: ${reason}`
        }
      }
    },
    { new: true }
  ).populate("department createdBy assignedTo");


  if (!updatedComplaint) {
    return null; // Concurrently updated by another process
  }

  // Record system audit log
  await createAuditLog({
    action: AUDIT_ACTIONS.COMPLAINT_ESCALATED,
    entityType: "Complaint",
    entityId: updatedComplaint._id,
    performedBySystem: true,
    metadata: {
      ticketId: updatedComplaint.ticketId,
      escalationLevel: newLevel,
      reason,
      notifiedUserId: contactUser?._id
    }
  });

  // Real-time notifications and email dispatch
  await notifyComplaintEscalated(updatedComplaint, reason, contactUser);
  await notifyComplaintStatusUpdated(updatedComplaint, `Ticket escalated to Level ${newLevel}`);

  return updatedComplaint;
};
