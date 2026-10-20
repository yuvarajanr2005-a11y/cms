export const ROLES = {
  STUDENT: "student",
  STAFF: "staff",
  ADMIN: "admin"
};

export const STAFF_TYPES = {
  MAINTENANCE: "maintenance",
  DEPARTMENT_HEAD: "department_head"
};

export const CATEGORIES = [
  "electrical",
  "leakage",
  "wifi",
  "furniture",
  "painting",
  "plumbing",
  "cleaning",
  "other"
];

export const PRIORITIES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  EMERGENCY: "emergency"
};

export const STATUSES = {
  SUBMITTED: "submitted",
  ASSIGNED: "assigned",
  IN_PROGRESS: "in_progress",
  PENDING_VERIFICATION: "pending_verification",
  CLOSED: "closed",
  REOPENED: "reopened",
  ESCALATED: "escalated"
};

// Allowed state transitions map
export const ALLOWED_STATUS_TRANSITIONS = {
  [STATUSES.SUBMITTED]: [STATUSES.ASSIGNED, STATUSES.ESCALATED, STATUSES.CLOSED],
  [STATUSES.ASSIGNED]: [STATUSES.IN_PROGRESS, STATUSES.ESCALATED, STATUSES.CLOSED],
  [STATUSES.IN_PROGRESS]: [STATUSES.PENDING_VERIFICATION, STATUSES.ESCALATED, STATUSES.CLOSED],
  [STATUSES.PENDING_VERIFICATION]: [STATUSES.CLOSED, STATUSES.REOPENED],
  [STATUSES.REOPENED]: [STATUSES.ASSIGNED, STATUSES.IN_PROGRESS, STATUSES.ESCALATED, STATUSES.CLOSED],
  [STATUSES.ESCALATED]: [STATUSES.ASSIGNED, STATUSES.IN_PROGRESS, STATUSES.PENDING_VERIFICATION, STATUSES.CLOSED],
  [STATUSES.CLOSED]: [STATUSES.REOPENED] // Only through explicit reopen within 48h
};

// SLA durations in hours
export const SLA_HOURS = {
  [PRIORITIES.EMERGENCY]: 6,
  [PRIORITIES.HIGH]: 24,
  [PRIORITIES.MEDIUM]: 24,
  [PRIORITIES.LOW]: 72
};

// Base weight by category
export const CATEGORY_BASE_WEIGHTS = {
  electrical: 30,
  leakage: 30,
  wifi: 20,
  furniture: 15,
  plumbing: 25,
  painting: 10,
  cleaning: 15,
  other: 10
};

export const VERIFICATION_METHODS = {
  OTP: "otp",
  CONFIRMATION: "confirmation",
  AUTO_CLOSED: "auto_closed"
};

export const AUDIT_ACTIONS = {
  USER_REGISTER: "USER_REGISTER",
  USER_LOGIN: "USER_LOGIN",
  USER_LOCKED: "USER_LOCKED",
  PASSWORD_CHANGE: "PASSWORD_CHANGE",
  COMPLAINT_CREATED: "COMPLAINT_CREATED",
  COMPLAINT_STATUS_UPDATED: "COMPLAINT_STATUS_UPDATED",
  COMPLAINT_UPVOTED: "COMPLAINT_UPVOTED",
  COMPLAINT_ASSIGNED: "COMPLAINT_ASSIGNED",
  COMPLAINT_RESOLVED: "COMPLAINT_RESOLVED",
  COMPLAINT_VERIFIED: "COMPLAINT_VERIFIED",
  COMPLAINT_REOPENED: "COMPLAINT_REOPENED",
  COMPLAINT_ESCALATED: "COMPLAINT_ESCALATED",
  COMPLAINT_AUTO_CLOSED: "COMPLAINT_AUTO_CLOSED",
  IDENTITY_REVEALED: "IDENTITY_REVEALED",
  DEPARTMENT_CREATED: "DEPARTMENT_CREATED",
  DEPARTMENT_UPDATED: "DEPARTMENT_UPDATED",
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED"
};

// Cascading Campus Locations Definition
export const CAMPUS_LOCATIONS = [
  {
    block: "Hostel Block A (Boys)",
    floors: [
      { floor: "Ground Floor", rooms: ["Room G-01", "Room G-02", "Common Hall", "Washroom East", "Mess Area"] },
      { floor: "1st Floor", rooms: ["Room 101", "Room 102", "Room 103", "Washroom North", "Study Room"] },
      { floor: "2nd Floor", rooms: ["Room 201", "Room 202", "Room 203", "Washroom South"] },
      { floor: "3rd Floor", rooms: ["Room 301", "Room 302", "Room 303", "Terrace Entry"] }
    ]
  },
  {
    block: "Hostel Block B (Girls)",
    floors: [
      { floor: "Ground Floor", rooms: ["Room G-01", "Room G-02", "Recreation Hall", "Dining Area"] },
      { floor: "1st Floor", rooms: ["Room 101", "Room 102", "Room 103", "Reading Room"] },
      { floor: "2nd Floor", rooms: ["Room 201", "Room 202", "Room 203", "Balcony Lounge"] }
    ]
  },
  {
    block: "Academic Block 1",
    floors: [
      { floor: "Ground Floor", rooms: ["Seminar Hall 1", "Auditorium", "Faculty Lounge", "Reception"] },
      { floor: "1st Floor", rooms: ["Classroom 101", "Classroom 102", "Computer Lab A", "Dean Office"] },
      { floor: "2nd Floor", rooms: ["Classroom 201", "Classroom 202", "IoT Lab", "Staff Room"] },
      { floor: "3rd Floor", rooms: ["Conference Room", "Server Room", "Robotics Lab"] }
    ]
  },
  {
    block: "Science & Technology Complex",
    floors: [
      { floor: "Ground Floor", rooms: ["Physics Lab", "Chemistry Lab", "Material Science Lab"] },
      { floor: "1st Floor", rooms: ["Hardware Lab", "Network Lab", "Lecture Hall A"] },
      { floor: "2nd Floor", rooms: ["AI/ML Research Lab", "Faculty Cabins", "Tutorial Room 1"] }
    ]
  },
  {
    block: "Central Library",
    floors: [
      { floor: "Ground Floor", rooms: ["Circulation Desk", "Periodicals Section", "E-Library Section"] },
      { floor: "1st Floor", rooms: ["Reference Section", "Quiet Study Zone", "Group Discussion Room"] }
    ]
  }
];
