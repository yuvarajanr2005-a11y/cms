import { sendEmail } from "../config/mailer.js";

let io = null;

export const setIO = (socketServerInstance) => {
  io = socketServerInstance;
};

export const getIO = () => io;

/**
 * Helper to emit event to a specific user room
 */
export const emitToUser = (userId, event, payload) => {
  if (io && userId) {
    io.to(`user:${userId.toString()}`).emit(event, payload);
  }
};

/**
 * Helper to emit event to all users with a specific role
 */
export const emitToRole = (role, event, payload) => {
  if (io && role) {
    io.to(`role:${role}`).emit(event, payload);
  }
};

/**
 * Helper to emit event to a department room
 */
export const emitToDepartment = (departmentId, event, payload) => {
  if (io && departmentId) {
    io.to(`department:${departmentId.toString()}`).emit(event, payload);
  }
};

/**
 * Helper to broadcast globally
 */
export const emitGlobal = (event, payload) => {
  if (io) {
    io.emit(event, payload);
  }
};

/**
 * Notification on complaint creation
 */
export const notifyComplaintCreated = async (complaint) => {
  const safeData = complaint.toPublicJSON ? complaint.toPublicJSON() : complaint;
  emitToRole("admin", "complaint:created", safeData);
  emitToRole("staff", "complaint:created", safeData);
  emitGlobal("complaint:created", safeData);
  if (complaint.department) {
    const deptId = complaint.department?._id || complaint.department;
    emitToDepartment(deptId, "complaint:created", safeData);
  }
  emitGlobal("notification:new", {
    type: "complaint:created",
    title: "New Complaint Registered",
    message: `Ticket ${complaint.ticketId}: ${complaint.title} in ${complaint.location?.block || "Campus"}`,
    ticketId: complaint.ticketId
  });
};

/**
 * Notification on status change
 */
export const notifyComplaintStatusUpdated = async (complaint, note = "") => {
  const safeData = complaint.toPublicJSON ? complaint.toPublicJSON() : complaint;
  
  // Student who filed the ticket
  if (complaint.createdBy) {
    const creatorId = complaint.createdBy._id || complaint.createdBy;
    emitToUser(creatorId, "complaint:status_updated", safeData);
    emitToUser(creatorId, "notification:new", {
      type: "complaint:status_updated",
      title: "Complaint Status Update",
      message: `Your ticket ${complaint.ticketId} status has changed to "${complaint.status}". ${note ? `Note: ${note}` : ""}`,
      ticketId: complaint.ticketId
    });
  }

  // Admin, Staff & Department
  emitToRole("admin", "complaint:status_updated", safeData);
  emitToRole("staff", "complaint:status_updated", safeData);
  emitGlobal("complaint:status_updated", safeData);
  if (complaint.department) {
    const deptId = complaint.department?._id || complaint.department;
    emitToDepartment(deptId, "complaint:status_updated", safeData);
  }
};

/**
 * Notification on upvote and auto-priority escalation
 */
export const notifyComplaintUpvoted = async (complaint, priorityChanged = false) => {
  emitGlobal("complaint:upvoted", {
    _id: complaint._id,
    ticketId: complaint.ticketId,
    upvoteCount: complaint.upvoteCount,
    priority: complaint.priority,
    priorityScore: complaint.priorityScore,
    slaDueAt: complaint.sla?.dueAt,
    priorityChanged
  });

  if (priorityChanged) {
    emitToRole("admin", "notification:new", {
      type: "complaint:priority_bumped",
      title: "Ticket Priority Escalated by Upvotes",
      message: `Ticket ${complaint.ticketId} priority bumped to "${complaint.priority}" due to ${complaint.upvoteCount} upvotes.`,
      ticketId: complaint.ticketId
    });
  }
};

/**
 * Notification on staff assignment
 */
export const notifyComplaintAssigned = async (complaint, staffUser) => {
  const safeData = complaint.toPublicJSON ? complaint.toPublicJSON() : complaint;

  emitToRole("admin", "complaint:assigned", safeData);
  emitToRole("staff", "complaint:assigned", safeData);
  emitGlobal("complaint:assigned", safeData);

  if (staffUser?._id) {
    emitToUser(staffUser._id, "complaint:assigned", safeData);
    emitToUser(staffUser._id, "notification:new", {
      type: "complaint:assigned",
      title: "New Ticket Assigned to You",
      message: `You have been assigned ticket ${complaint.ticketId}: "${complaint.title}". SLA Due: ${new Date(complaint.sla.dueAt).toLocaleString()}`,
      ticketId: complaint.ticketId
    });

    if (staffUser.email) {
      await sendEmail({
        to: staffUser.email,
        subject: `[Assigned] Ticket ${complaint.ticketId}: ${complaint.title}`,
        html: `
          <h3>New Complaint Assignment</h3>
          <p>Hello <b>${staffUser.name}</b>,</p>
          <p>You have been assigned the following complaint:</p>
          <ul>
            <li><b>Ticket ID:</b> ${complaint.ticketId}</li>
            <li><b>Title:</b> ${complaint.title}</li>
            <li><b>Location:</b> ${complaint.location.fullPath}</li>
            <li><b>Priority:</b> ${complaint.priority.toUpperCase()}</li>
            <li><b>SLA Due:</b> ${new Date(complaint.sla.dueAt).toUTCString()}</li>
          </ul>
        `
      });
    }
  }

  // Notify student
  if (complaint.createdBy) {
    const creatorId = complaint.createdBy._id || complaint.createdBy;
    emitToUser(creatorId, "complaint:assigned", safeData);
  }
};

/**
 * Notification on ticket resolution (sends OTP email to student)
 */
export const notifyComplaintResolved = async (complaint, studentUser, rawOtp) => {
  const safeData = complaint.toPublicJSON ? complaint.toPublicJSON() : complaint;

  if (studentUser?._id) {
    emitToUser(studentUser._id, "complaint:resolved", safeData);
    emitToUser(studentUser._id, "notification:new", {
      type: "complaint:resolved",
      title: "Work Completed - Verification Required",
      message: `Staff has completed work on ${complaint.ticketId}. Please review the proof photo and verify closure using your 4-digit OTP or rating.`,
      ticketId: complaint.ticketId
    });

    if (studentUser.email && rawOtp) {
      await sendEmail({
        to: studentUser.email,
        subject: `[Action Required] Resolution Verification OTP for ${complaint.ticketId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #1e3a8a;">Resolution Proof Submitted</h2>
            <p>Dear <b>${studentUser.name}</b>,</p>
            <p>Staff has marked your complaint <b>${complaint.ticketId}</b> (${complaint.title}) as resolved.</p>
            <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 14px; color: #64748b; display: block;">Your 4-Digit Verification OTP:</span>
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0284c7;">${rawOtp}</span>
              <p style="font-size: 12px; color: #94a3b8; margin-top: 8px;">Valid for 48 hours. Never share this code with unauthorized persons.</p>
            </div>
            <p>You can also log into your Student Portal to view the uploaded proof of work photo, confirm resolution, or reopen if unsatisfied.</p>
          </div>
        `
      });
    }
  }

  emitToRole("admin", "complaint:resolved", safeData);
};

/**
 * Notification on SLA escalation
 */
export const notifyComplaintEscalated = async (complaint, reason, contactUser = null) => {
  const safeData = complaint.toPublicJSON ? complaint.toPublicJSON() : complaint;

  emitToRole("admin", "complaint:escalated", { complaint: safeData, reason });
  emitGlobal("notification:new", {
    type: "complaint:escalated",
    title: "⚠️ Complaint SLA Escalated",
    message: `Ticket ${complaint.ticketId} has breached SLA and has been escalated to Level ${complaint.sla.escalationLevel}.`,
    ticketId: complaint.ticketId
  });

  if (contactUser?.email) {
    await sendEmail({
      to: contactUser.email,
      subject: `🚨 [ESCALATION LEVEL ${complaint.sla.escalationLevel}] Ticket ${complaint.ticketId} SLA Breached`,
      html: `
        <h3>High Priority SLA Escalation Alert</h3>
        <p>Dear <b>${contactUser.name}</b>,</p>
        <p>Ticket <b>${complaint.ticketId}</b> has breached its SLA timeline and requires immediate intervention.</p>
        <ul>
          <li><b>Title:</b> ${complaint.title}</li>
          <li><b>Location:</b> ${complaint.location.fullPath}</li>
          <li><b>Current Status:</b> ${complaint.status}</li>
          <li><b>Priority:</b> ${complaint.priority}</li>
          <li><b>SLA Due Time:</b> ${new Date(complaint.sla.dueAt).toUTCString()}</li>
          <li><b>Escalation Reason:</b> ${reason}</li>
        </ul>
      `
    });
  }
};

/**
 * Notification on ticket reopening
 */
export const notifyComplaintReopened = async (complaint, reason) => {
  const safeData = complaint.toPublicJSON ? complaint.toPublicJSON() : complaint;

  if (complaint.assignedTo) {
    emitToUser(complaint.assignedTo, "complaint:reopened", safeData);
    emitToUser(complaint.assignedTo, "notification:new", {
      type: "complaint:reopened",
      title: "Ticket Reopened by Student",
      message: `Ticket ${complaint.ticketId} was reopened. Reason: "${reason}". Please investigate immediately.`,
      ticketId: complaint.ticketId
    });
  }

  emitToRole("admin", "complaint:reopened", safeData);
};
