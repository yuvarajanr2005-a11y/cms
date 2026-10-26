import { connectDB, disconnectDB } from "./config/db.js";
import { User } from "./models/User.js";
import { Department } from "./models/Department.js";
import { Complaint, Counter } from "./models/Complaint.js";
import { AuditLog } from "./models/AuditLog.js";
import {
  ROLES,
  STAFF_TYPES,
  PRIORITIES,
  STATUSES,
  VERIFICATION_METHODS,
  AUDIT_ACTIONS
} from "./utils/constants.js";
import { calculateSlaDueAt } from "./services/sla.service.js";
import { hashOtp } from "./utils/generateOtp.js";

export const seedDatabase = async ({ isCli = true } = {}) => {
  try {
    console.log("🌱 Starting Database Seeding...");
    if (isCli) {
      await connectDB();
    }

    // Clear existing collections
    console.log("🧹 Clearing old seed data...");
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Complaint.deleteMany({}),
      Counter.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    // 1. Create Chief Warden (Escalation Contact)
    const chiefWarden = await User.create({
      name: "Dr. Arthur Pendelton (Chief Warden)",
      email: "chief.warden@college.edu",
      password: "Warden@Password123",
      role: ROLES.STAFF,
      staffType: STAFF_TYPES.DEPARTMENT_HEAD,
      phone: "+91 9876543210"
    });

    // 2. Create Admin
    const admin = await User.create({
      name: "System Administrator",
      email: "admin@college.edu",
      password: "Admin@Password123",
      role: ROLES.ADMIN,
      phone: "+91 9876500000"
    });

    // 2b. Create NAAC Quality Committee Officer
    const naacOfficer = await User.create({
      name: "Dr. K. Radhakrishnan (NAAC Peer Reviewer)",
      email: "naac.officer@college.edu",
      password: "Naac@Password123",
      role: ROLES.NAAC,
      phone: "+91 9876599999"
    });

    // 3. Create Departments
    const elecDept = await Department.create({
      name: "Electrical Maintenance & Power",
      code: "ELEC",
      categoriesHandled: ["electrical"],
      escalationContact: chiefWarden._id
    });

    const plumbDept = await Department.create({
      name: "Plumbing & Water Infrastructure",
      code: "PLUMB",
      categoriesHandled: ["plumbing", "leakage"],
      escalationContact: chiefWarden._id
    });

    const itDept = await Department.create({
      name: "Campus IT & Network Systems",
      code: "ITNET",
      categoriesHandled: ["wifi"],
      escalationContact: chiefWarden._id
    });

    const civilDept = await Department.create({
      name: "Civil Works & Facilities",
      code: "CIVIL",
      categoriesHandled: ["furniture", "painting", "cleaning", "other"],
      escalationContact: chiefWarden._id
    });

    const antiRagDept = await Department.create({
      name: "Anti-Ragging, Safety & Discipline Cell",
      code: "ANTIRAG",
      categoriesHandled: ["ragging", "harassment", "misuse"],
      escalationContact: chiefWarden._id
    });

    const messDept = await Department.create({
      name: "Hostel Food Quality & Canteen Hygiene Cell",
      code: "MESS",
      categoriesHandled: ["food_mess", "hostel"],
      escalationContact: chiefWarden._id
    });

    const acadDept = await Department.create({
      name: "Academic Affairs & Central Library Cell",
      code: "ACAD",
      categoriesHandled: ["academic", "library"],
      escalationContact: chiefWarden._id
    });

    const transDept = await Department.create({
      name: "Campus Transport & Sports Logistics",
      code: "TRANS",
      categoriesHandled: ["transport", "sports"],
      escalationContact: chiefWarden._id
    });

    // 4. Create Staff Members
    const elecHead = await User.create({
      name: "Prof. Vikram Sarabhai",
      email: "elec.head@college.edu",
      password: "Staff@Password123",
      role: ROLES.STAFF,
      staffType: STAFF_TYPES.DEPARTMENT_HEAD,
      department: elecDept._id,
      phone: "+91 9876511111"
    });

    const elecStaff = await User.create({
      name: "Rajesh Kumar (Electrician)",
      email: "elec.tech@college.edu",
      password: "Staff@Password123",
      role: ROLES.STAFF,
      staffType: STAFF_TYPES.MAINTENANCE,
      department: elecDept._id,
      phone: "+91 9876511112",
      performance: {
        resolvedCount: 14,
        avgResolutionMinutes: 45,
        reopenedCount: 1,
        totalRatingSum: 66,
        ratingCount: 14
      }
    });

    const plumbStaff = await User.create({
      name: "Manoj Singh (Plumber)",
      email: "plumb.tech@college.edu",
      password: "Staff@Password123",
      role: ROLES.STAFF,
      staffType: STAFF_TYPES.MAINTENANCE,
      department: plumbDept._id,
      phone: "+91 9876522222",
      performance: {
        resolvedCount: 9,
        avgResolutionMinutes: 60,
        reopenedCount: 0,
        totalRatingSum: 42,
        ratingCount: 9
      }
    });

    const itStaff = await User.create({
      name: "Ananya Iyer (Network Engineer)",
      email: "it.tech@college.edu",
      password: "Staff@Password123",
      role: ROLES.STAFF,
      staffType: STAFF_TYPES.MAINTENANCE,
      department: itDept._id,
      phone: "+91 9876533333",
      performance: {
        resolvedCount: 22,
        avgResolutionMinutes: 30,
        reopenedCount: 1,
        totalRatingSum: 104,
        ratingCount: 22
      }
    });

    const civilStaff = await User.create({
      name: "Suresh Patil (Civil & Facilities)",
      email: "civil.tech@college.edu",
      password: "Staff@Password123",
      role: ROLES.STAFF,
      staffType: STAFF_TYPES.MAINTENANCE,
      department: civilDept._id,
      phone: "+91 9876544444",
      performance: {
        resolvedCount: 11,
        avgResolutionMinutes: 40,
        reopenedCount: 0,
        totalRatingSum: 50,
        ratingCount: 11
      }
    });

    const antiRagHead = await User.create({
      name: "Prof. Meenakshi Sundaram (Anti-Ragging Squad Head)",
      email: "antirag.head@college.edu",
      password: "Staff@Password123",
      role: ROLES.STAFF,
      staffType: STAFF_TYPES.DEPARTMENT_HEAD,
      department: antiRagDept._id,
      phone: "+91 9876555551"
    });

    const messStaff = await User.create({
      name: "K. Narayanan (Hostel & Mess Warden)",
      email: "mess.head@college.edu",
      password: "Staff@Password123",
      role: ROLES.STAFF,
      staffType: STAFF_TYPES.MAINTENANCE,
      department: messDept._id,
      phone: "+91 9876555552",
      performance: {
        resolvedCount: 8,
        avgResolutionMinutes: 35,
        reopenedCount: 0,
        totalRatingSum: 38,
        ratingCount: 8
      }
    });

    // Associate department heads and staff
    elecDept.head = elecHead._id;
    elecDept.staff = [elecStaff._id];
    await elecDept.save();

    plumbDept.staff = [plumbStaff._id];
    await plumbDept.save();

    itDept.staff = [itStaff._id];
    await itDept.save();

    civilDept.staff = [civilStaff._id];
    await civilDept.save();

    antiRagDept.head = antiRagHead._id;
    antiRagDept.staff = [antiRagHead._id];
    await antiRagDept.save();

    messDept.head = messStaff._id;
    messDept.staff = [messStaff._id];
    await messDept.save();

    acadDept.head = chiefWarden._id;
    acadDept.staff = [chiefWarden._id];
    await acadDept.save();

    transDept.head = civilStaff._id;
    transDept.staff = [civilStaff._id];
    await transDept.save();

    // 5. Create Students
    const studentAlex = await User.create({
      name: "Alex Johnson",
      email: "alex.student@college.edu",
      password: "Student@Password123",
      role: ROLES.STUDENT,
      phone: "+91 9876544441"
    });

    const studentPriya = await User.create({
      name: "Priya Sharma",
      email: "priya.student@college.edu",
      password: "Student@Password123",
      role: ROLES.STUDENT,
      phone: "+91 9876544442"
    });

    const studentRahul = await User.create({
      name: "Rahul Verma (Mechanical)",
      email: "rahul.student@college.edu",
      password: "Student@Password123",
      role: ROLES.STUDENT,
      phone: "+91 9876544443"
    });

    const studentSneha = await User.create({
      name: "Sneha Patel (Civil Eng)",
      email: "sneha.student@college.edu",
      password: "Student@Password123",
      role: ROLES.STUDENT,
      phone: "+91 9876544444"
    });

    // 6. Create Sample Complaints
    const { dueAt: dueAt1, hours: h1 } = calculateSlaDueAt(PRIORITIES.HIGH);
    const complaint1 = await Complaint.create({
      title: "AC Sparking and Tripping MCB Switch",
      description: "The room air conditioner produces visible sparks upon switching on and trips the floor MCB immediately.",
      category: "electrical",
      department: elecDept._id,
      priority: PRIORITIES.HIGH,
      priorityScore: 55,
      status: STATUSES.IN_PROGRESS,
      location: {
        block: "Hostel Block A (Boys)",
        floor: "2nd Floor",
        room: "Room 201",
        fullPath: "Hostel Block A (Boys) > 2nd Floor > Room 201"
      },
      attachments: [
        {
          url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600",
          publicId: "seed/ac_spark"
        }
      ],
      createdBy: studentAlex._id,
      isAnonymous: false,
      assignedTo: elecStaff._id,
      assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      upvotes: [studentPriya._id, studentRahul._id],
      upvoteCount: 2,
      sla: {
        dueAt: dueAt1,
        hours: h1,
        breached: false,
        escalationLevel: 0
      },
      naacReview: {
        isSevere: true,
        requiresInspection: true,
        inspectionStatus: "pending_inspection",
        verifiedSeverity: "Severe Hazard"
      },
      statusHistory: [
        {
          status: STATUSES.SUBMITTED,
          changedBy: studentAlex._id,
          at: new Date(Date.now() - 4 * 60 * 60 * 1000),
          note: "Submitted by student"
        },
        {
          status: STATUSES.ASSIGNED,
          changedBy: admin._id,
          at: new Date(Date.now() - 2 * 60 * 60 * 1000),
          note: `Assigned to ${elecStaff.name}`
        },
        {
          status: STATUSES.IN_PROGRESS,
          changedBy: elecStaff._id,
          at: new Date(Date.now() - 1 * 60 * 60 * 1000),
          note: "Inspecting breaker and wiring harness"
        }
      ]
    });

    const { dueAt: dueAt2, hours: h2 } = calculateSlaDueAt(PRIORITIES.EMERGENCY, new Date(Date.now() - 10 * 60 * 60 * 1000));
    const complaint2 = await Complaint.create({
      title: "Main Water Pipe Burst Flooding Corridor",
      description: "Severe overhead water pipe burst in the south washroom corridor causing ceiling seepage into rooms below.",
      category: "leakage",
      department: plumbDept._id,
      priority: PRIORITIES.EMERGENCY,
      priorityScore: 90,
      status: STATUSES.ESCALATED,
      location: {
        block: "Hostel Block A (Boys)",
        floor: "2nd Floor",
        room: "Washroom South",
        fullPath: "Hostel Block A (Boys) > 2nd Floor > Washroom South"
      },
      createdBy: studentRahul._id,
      isAnonymous: true,
      assignedTo: plumbStaff._id,
      assignedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      upvotes: [studentAlex._id, studentPriya._id],
      upvoteCount: 7,
      sla: {
        dueAt: dueAt2,
        hours: h2,
        breached: true,
        escalatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        escalationLevel: 1
      },
      statusHistory: [
        {
          status: STATUSES.SUBMITTED,
          changedBy: studentRahul._id,
          at: new Date(Date.now() - 10 * 60 * 60 * 1000),
          note: "Anonymous student report"
        },
        {
          status: STATUSES.ESCALATED,
          at: new Date(Date.now() - 2 * 60 * 60 * 1000),
          note: "Auto-escalated to Department Head due to SLA breach"
        }
      ],
      naacReview: {
        isSevere: true,
        requiresInspection: true,
        inspectionStatus: "pending_inspection",
        verifiedSeverity: "Critical Hazard - Water Inundation"
      }
    });

    // 2c. NAAC Severe Complaint - On-site Inspection Visit Conducted, Awaiting Action Confirmation
    const complaintSevereInspected = await Complaint.create({
      title: "Main Power Distribution Panel Sparking Hazard in Lab 304",
      description: "Main 3-phase electrical panel outside Server Lab 3 has loose terminals, heavy burning odor, and repeated sparks endangering 60+ students.",
      category: "electrical",
      department: elecDept._id,
      priority: PRIORITIES.EMERGENCY,
      priorityScore: 85,
      status: STATUSES.IN_PROGRESS,
      location: {
        block: "Academic Block 1",
        floor: "3rd Floor",
        room: "Room 301",
        fullPath: "Academic Block 1 > 3rd Floor > Room 301"
      },
      attachments: [
        {
          url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600",
          publicId: "seed/panel_hazard"
        }
      ],
      createdBy: studentAlex._id,
      isAnonymous: false,
      assignedTo: elecStaff._id,
      assignedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      upvotes: [studentPriya._id, studentRahul._id, studentSneha._id],
      upvoteCount: 3,
      sla: {
        dueAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
        hours: 6,
        breached: false,
        escalationLevel: 0
      },
      naacReview: {
        isSevere: true,
        requiresInspection: true,
        inspectionStatus: "inspected",
        inspectedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        inspectedBy: naacOfficer._id,
        inspectorName: "Dr. K. Radhakrishnan",
        inspectorDesignation: "NAAC Peer Team Head / Institutional Accreditation Officer",
        inspectionFindings: "Physical inspection conducted at Computer Lab 301. Live copper busbars exposed without insulated safety barrier. Fire extinguisher expired. Severe risk to students. Immediate executive action required.",
        verifiedSeverity: "Critical Infrastructure Failure",
        directiveSlaHours: 4
      },
      statusHistory: [
        {
          status: STATUSES.SUBMITTED,
          changedBy: studentAlex._id,
          at: new Date(Date.now() - 3 * 60 * 60 * 1000),
          note: "Submitted by student - Emergency safety hazard."
        },
        {
          status: STATUSES.ASSIGNED,
          changedBy: null,
          at: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
          note: `Auto-routed & assigned to technician Rajesh Kumar (Electrical Maintenance & Power)`
        },
        {
          status: STATUSES.IN_PROGRESS,
          changedBy: naacOfficer._id,
          at: new Date(Date.now() - 1 * 60 * 60 * 1000),
          note: `NAAC On-site Inspection completed by Dr. K. Radhakrishnan (NAAC Peer Team Head). Verified as Critical Infrastructure Failure.`
        }
      ]
    });

    // 2d. NAAC Severe Complaint - Action Taken & Confirmed with Official Confirmation Slip
    const complaintActionConfirmed = await Complaint.create({
      title: "Drinking Water Pipeline Contamination in Hostel Block B",
      description: "Turbid water observed in 1st floor water coolers with foul sulfur odor. Immediate safety violation affecting residential students.",
      category: "plumbing",
      department: plumbDept._id,
      priority: PRIORITIES.EMERGENCY,
      priorityScore: 92,
      status: STATUSES.IN_PROGRESS,
      location: {
        block: "Hostel Block B (Girls)",
        floor: "1st Floor",
        room: "Washroom North",
        fullPath: "Hostel Block B (Girls) > 1st Floor > Washroom North"
      },
      attachments: [
        {
          url: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600",
          publicId: "seed/water_pipeline"
        }
      ],
      createdBy: studentPriya._id,
      isAnonymous: false,
      assignedTo: plumbStaff._id,
      assignedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      upvotes: [studentAlex._id, studentRahul._id],
      upvoteCount: 2,
      sla: {
        dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        hours: 6,
        breached: false,
        escalationLevel: 0
      },
      naacReview: {
        isSevere: true,
        requiresInspection: true,
        inspectionStatus: "action_confirmed",
        inspectedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        inspectedBy: naacOfficer._id,
        inspectorName: "Dr. K. Radhakrishnan",
        inspectorDesignation: "NAAC Peer Team Head",
        inspectionFindings: "Inspected water filtration unit. Biofilm accumulation and backflow noticed. Station requires immediate chemical sanitization and membrane replacement.",
        verifiedSeverity: "Severe Hazard",
        actionType: "Emergency Budget Sanction & Alternative Drinking Water Deployed",
        actionDetails: "Station shut down immediately. Sanctioned Rs. 45,000 for RO membrane replacement and chemical flush. 200L packaged mineral water dispensers deployed on each floor for student safety.",
        actionConfirmedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        actionConfirmedBy: naacOfficer._id,
        actionConfirmationSlipId: "NAAC-ACT-2026-7821",
        complianceGrade: "A+",
        directiveSlaHours: 4
      },
      statusHistory: [
        {
          status: STATUSES.SUBMITTED,
          changedBy: studentPriya._id,
          at: new Date(Date.now() - 5 * 60 * 60 * 1000),
          note: "Submitted by student - Health hazard"
        },
        {
          status: STATUSES.IN_PROGRESS,
          changedBy: naacOfficer._id,
          at: new Date(Date.now() - 2 * 60 * 60 * 1000),
          note: "NAAC Official Action Confirmed: [Emergency Budget Sanction & Alternative Drinking Water Deployed]. Slip ID: NAAC-ACT-2026-7821"
        }
      ]
    });

    // 2e. Anti-Ragging Emergency Grievance (Strict Zero Tolerance)
    const complaintRagging = await Complaint.create({
      title: "Senior Students Forcing Freshers to Attend Midnight Sessions in Hostel Block A",
      description: "A group of 3rd year students entered 1st year fresher rooms (Room 101 & 102) past 11 PM, verbally abusing freshers, forcing humiliating acts, and issuing physical threats. Emergency intervention requested under Supreme Court / UGC Anti-Ragging Mandate.",
      category: "ragging",
      department: antiRagDept._id,
      priority: PRIORITIES.EMERGENCY,
      priorityScore: 98,
      status: STATUSES.IN_PROGRESS,
      location: {
        block: "Hostel Block A (Boys)",
        floor: "1st Floor",
        room: "Room 101",
        fullPath: "Hostel Block A (Boys) > 1st Floor > Room 101"
      },
      attachments: [
        {
          url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600",
          publicId: "seed/ragging_hall"
        }
      ],
      createdBy: studentRahul._id,
      isAnonymous: true,
      assignedTo: antiRagHead._id,
      assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      upvotes: [studentAlex._id, studentPriya._id, studentSneha._id],
      upvoteCount: 8,
      sla: {
        dueAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
        hours: 6,
        breached: false,
        escalationLevel: 0
      },
      naacReview: {
        isSevere: true,
        requiresInspection: true,
        inspectionStatus: "inspected",
        inspectedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        inspectedBy: naacOfficer._id,
        inspectorName: "Dr. K. Radhakrishnan",
        inspectorDesignation: "NAAC Peer Team Head / Anti-Ragging External Monitor",
        inspectionFindings: "Emergency on-site visit conducted at Hostel Block A with Chief Warden. Interviewed freshers and recorded hostel biometric entry logs. Identified 4 senior students. Zero-tolerance statutory action recommended.",
        verifiedSeverity: "Critical Anti-Ragging Violation",
        directiveSlaHours: 2
      },
      statusHistory: [
        {
          status: STATUSES.SUBMITTED,
          changedBy: studentRahul._id,
          at: new Date(Date.now() - 2 * 60 * 60 * 1000),
          note: "🚨 Emergency Anti-Ragging ticket filed anonymously."
        },
        {
          status: STATUSES.ASSIGNED,
          changedBy: null,
          at: new Date(Date.now() - 1.8 * 60 * 60 * 1000),
          note: `Assigned immediately to Anti-Ragging Squad Head Prof. Meenakshi Sundaram.`
        },
        {
          status: STATUSES.IN_PROGRESS,
          changedBy: naacOfficer._id,
          at: new Date(Date.now() - 1 * 60 * 60 * 1000),
          note: `NAAC Committee & Anti-Ragging Cell On-Site Visit completed. Severity set to Critical Anti-Ragging Violation.`
        }
      ]
    });

    // 2f. Misuse of College Laboratory & Assets
    const complaintMisuse = await Complaint.create({
      title: "Unauthorized Misuse & Vandalism of Advanced Computing Cluster in Lab 304",
      description: "High-performance GPU workstations in Server Lab 304 are being misused after hours for unauthorized commercial rendering and crypto mining. Cooling ducts dismantled and equipment overheated beyond safe operating temperatures.",
      category: "misuse",
      department: antiRagDept._id,
      priority: PRIORITIES.HIGH,
      priorityScore: 78,
      status: STATUSES.IN_PROGRESS,
      location: {
        block: "Academic Block 1",
        floor: "3rd Floor",
        room: "Computer Lab A",
        fullPath: "Academic Block 1 > 3rd Floor > Computer Lab A"
      },
      attachments: [
        {
          url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600",
          publicId: "seed/gpu_cluster"
        }
      ],
      createdBy: studentAlex._id,
      isAnonymous: false,
      assignedTo: antiRagHead._id,
      assignedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      upvotes: [studentRahul._id],
      upvoteCount: 3,
      sla: {
        dueAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        hours: 24,
        breached: false,
        escalationLevel: 0
      },
      naacReview: {
        isSevere: true,
        requiresInspection: true,
        inspectionStatus: "action_confirmed",
        inspectedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        inspectedBy: naacOfficer._id,
        inspectorName: "Dr. K. Radhakrishnan",
        inspectorDesignation: "NAAC Institutional Reviewer",
        inspectionFindings: "Hardware diagnostics revealed 3 GPU nodes operating at 94°C with non-academic background tasks. Lab entry logs cross-referenced with security cameras.",
        verifiedSeverity: "Campus Property & Resource Misuse",
        actionType: "Access Revocation, Hardware Audit & Biometric Lab Security Sanction",
        actionDetails: "Immediate deauthorization of flagged student IDs. System re-imaged with restricted OS profiles. Sanctioned installation of RFID biometric lock on Lab 304.",
        actionConfirmedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        actionConfirmedBy: naacOfficer._id,
        actionConfirmationSlipId: "NAAC-ACT-2026-9042",
        complianceGrade: "A+",
        directiveSlaHours: 4
      },
      statusHistory: [
        {
          status: STATUSES.SUBMITTED,
          changedBy: studentAlex._id,
          at: new Date(Date.now() - 4 * 60 * 60 * 1000),
          note: "Submitted by student"
        },
        {
          status: STATUSES.IN_PROGRESS,
          changedBy: naacOfficer._id,
          at: new Date(Date.now() - 1 * 60 * 60 * 1000),
          note: "NAAC Action Confirmed: [Access Revocation, Hardware Audit & Biometric Lab Security Sanction]. Slip ID: NAAC-ACT-2026-9042"
        }
      ]
    });

    // 2g. Hostel Mess & Food Quality Grievance
    const complaintFoodMess = await Complaint.create({
      title: "Contaminated Drinking Water & Undercooked Food in Central Hostel Mess",
      description: "Severe hygiene issue in Central Mess Hall 2: Insects found in vegetable curry and rice was half-cooked. Over 15 hostel students reported food poisoning symptoms. Urgent kitchen inspection needed.",
      category: "food_mess",
      department: messDept._id,
      priority: PRIORITIES.HIGH,
      priorityScore: 72,
      status: STATUSES.IN_PROGRESS,
      location: {
        block: "Hostel Block A (Boys)",
        floor: "Ground Floor",
        room: "Mess Area",
        fullPath: "Hostel Block A (Boys) > Ground Floor > Mess Area"
      },
      attachments: [
        {
          url: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600",
          publicId: "seed/mess_hygiene"
        }
      ],
      createdBy: studentRahul._id,
      isAnonymous: false,
      assignedTo: messStaff._id,
      assignedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      upvotes: [studentAlex._id, studentPriya._id, studentSneha._id],
      upvoteCount: 6,
      sla: {
        dueAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
        hours: 24,
        breached: false,
        escalationLevel: 0
      },
      naacReview: {
        isSevere: true,
        requiresInspection: true,
        inspectionStatus: "pending_inspection",
        verifiedSeverity: "Severe Hazard"
      },
      statusHistory: [
        {
          status: STATUSES.SUBMITTED,
          changedBy: studentRahul._id,
          at: new Date(Date.now() - 6 * 60 * 60 * 1000),
          note: "Submitted by hostel resident"
        }
      ]
    });

    // 2h. Harassment & Campus Women Safety Grievance
    const complaintHarassment = await Complaint.create({
      title: "Extinguished Floodlights and Harassment Incidents on East Campus Pedestrian Walkway",
      description: "The 350-meter pathway between the Library and Girls Hostel has had completely non-functional lighting for 4 days. Unidentified outsiders have been spotted loitering and catcalling female students. Immediate security deployment and light restoration required.",
      category: "harassment",
      department: antiRagDept._id,
      priority: PRIORITIES.EMERGENCY,
      priorityScore: 95,
      status: STATUSES.IN_PROGRESS,
      location: {
        block: "Hostel Block B (Girls)",
        floor: "Ground Floor",
        room: "Common Hall",
        fullPath: "Hostel Block B (Girls) > Ground Floor > Common Hall"
      },
      attachments: [
        {
          url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600",
          publicId: "seed/dark_walkway"
        }
      ],
      createdBy: studentSneha._id,
      isAnonymous: false,
      assignedTo: antiRagHead._id,
      assignedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      upvotes: [studentPriya._id, studentAlex._id],
      upvoteCount: 5,
      sla: {
        dueAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
        hours: 6,
        breached: false,
        escalationLevel: 0
      },
      naacReview: {
        isSevere: true,
        requiresInspection: true,
        inspectionStatus: "inspected",
        inspectedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        inspectedBy: naacOfficer._id,
        inspectorName: "Dr. K. Radhakrishnan",
        inspectorDesignation: "NAAC Peer Team Head",
        inspectionFindings: "Night-time walk audit conducted along East Campus walkway with Security Chief. 6 solar floodlight panels found disconnected. Poses severe threat to student safety. Security patrol post mandated immediately.",
        verifiedSeverity: "Zero Tolerance Critical Safety",
        directiveSlaHours: 4
      },
      statusHistory: [
        {
          status: STATUSES.SUBMITTED,
          changedBy: studentSneha._id,
          at: new Date(Date.now() - 3 * 60 * 60 * 1000),
          note: "Emergency women safety grievance filed."
        }
      ]
    });

    // 2i. Academic / Laboratory Equipment Breakdown
    const complaintAcademic = await Complaint.create({
      title: "Faulty Digital Storage Oscilloscopes & Burned DC Power Supplies in VLSI Lab",
      description: "Benches 4 through 8 in Electronics Lab 202 have non-responsive digital oscilloscopes and blown fuses in power supply units. End-semester practical examinations commence on Monday.",
      category: "academic",
      department: acadDept._id,
      priority: PRIORITIES.HIGH,
      priorityScore: 68,
      status: STATUSES.ASSIGNED,
      location: {
        block: "Academic Block 1",
        floor: "2nd Floor",
        room: "Room 201",
        fullPath: "Academic Block 1 > 2nd Floor > Room 201"
      },
      attachments: [
        {
          url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600",
          publicId: "seed/vlsi_lab"
        }
      ],
      createdBy: studentPriya._id,
      isAnonymous: false,
      assignedTo: elecStaff._id,
      assignedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      upvotes: [studentAlex._id],
      upvoteCount: 2,
      sla: {
        dueAt: new Date(Date.now() + 18 * 60 * 60 * 1000),
        hours: 24,
        breached: false,
        escalationLevel: 0
      },
      statusHistory: [
        {
          status: STATUSES.SUBMITTED,
          changedBy: studentPriya._id,
          at: new Date(Date.now() - 4 * 60 * 60 * 1000),
          note: "Submitted by ECE student"
        }
      ]
    });

    const rawDemoOtp = "4321";
    const { dueAt: dueAt3, hours: h3 } = calculateSlaDueAt(PRIORITIES.HIGH);
    const complaint3 = await Complaint.create({
      title: "High Latency & DNS Dropouts on Campus Access Point",
      description: "WiFi router in Computer Lab A intermittently drops packets and fails DNS lookups during lab practicals.",
      category: "wifi",
      department: itDept._id,
      priority: PRIORITIES.HIGH,
      priorityScore: 40,
      status: STATUSES.PENDING_VERIFICATION,
      location: {
        block: "Academic Block 1",
        floor: "1st Floor",
        room: "Computer Lab A",
        fullPath: "Academic Block 1 > 1st Floor > Computer Lab A"
      },
      createdBy: studentPriya._id,
      isAnonymous: false,
      assignedTo: itStaff._id,
      assignedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      upvotes: [studentAlex._id],
      upvoteCount: 1,
      sla: {
        dueAt: dueAt3,
        hours: h3,
        breached: false,
        escalationLevel: 0
      },
      resolution: {
        proofPhoto: {
          url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600",
          publicId: "seed/wifi_rack_fixed"
        },
        notes: "Replaced faulty PoE injector on Cisco Catalyst switch and updated AP firmware to v12.4.",
        resolvedBy: itStaff._id,
        resolvedAt: new Date(Date.now() - 30 * 60 * 1000),
        otpHash: hashOtp(rawDemoOtp),
        otpExpiresAt: new Date(Date.now() + 47 * 60 * 60 * 1000),
        otpAttempts: 0
      },
      statusHistory: [
        {
          status: STATUSES.SUBMITTED,
          changedBy: studentPriya._id,
          at: new Date(Date.now() - 6 * 60 * 60 * 1000)
        },
        {
          status: STATUSES.IN_PROGRESS,
          changedBy: itStaff._id,
          at: new Date(Date.now() - 3 * 60 * 60 * 1000)
        },
        {
          status: STATUSES.PENDING_VERIFICATION,
          changedBy: itStaff._id,
          at: new Date(Date.now() - 30 * 60 * 1000),
          note: "Work completed with photo proof. OTP dispatched."
        }
      ]
    });

    const { dueAt: dueAt4, hours: h4 } = calculateSlaDueAt(PRIORITIES.LOW, new Date(Date.now() - 48 * 60 * 60 * 1000));
    await Complaint.create({
      title: "Broken Reading Desk Hinge in Study Room",
      description: "The foldout desk hinge in Quiet Study Zone is broken, making it unsteady for laptops.",
      category: "furniture",
      department: civilDept._id,
      priority: PRIORITIES.LOW,
      priorityScore: 20,
      status: STATUSES.CLOSED,
      location: {
        block: "Central Library",
        floor: "1st Floor",
        room: "Quiet Study Zone",
        fullPath: "Central Library > 1st Floor > Quiet Study Zone"
      },
      createdBy: studentAlex._id,
      isAnonymous: false,
      assignedTo: admin._id,
      assignedAt: new Date(Date.now() - 40 * 60 * 60 * 1000),
      upvotes: [],
      upvoteCount: 0,
      sla: {
        dueAt: dueAt4,
        hours: h4,
        breached: false,
        escalationLevel: 0
      },
      resolution: {
        proofPhoto: {
          url: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600",
          publicId: "seed/desk_repaired"
        },
        notes: "Replaced heavy-duty zinc brackets and lubricated hinges.",
        resolvedBy: admin._id,
        resolvedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
        verifiedAt: new Date(Date.now() - 19 * 60 * 60 * 1000),
        verificationMethod: VERIFICATION_METHODS.CONFIRMATION,
        rating: 5,
        feedback: "Super quick repair! Sturdy and works like new."
      },
      statusHistory: [
        {
          status: STATUSES.CLOSED,
          changedBy: studentAlex._id,
          at: new Date(Date.now() - 19 * 60 * 60 * 1000),
          note: "Confirmed and rated 5 stars by student"
        }
      ]
    });

    await AuditLog.create([
      {
        action: AUDIT_ACTIONS.USER_REGISTER,
        entityType: "User",
        entityId: studentAlex._id,
        performedBy: studentAlex._id,
        metadata: { email: studentAlex.email }
      },
      {
        action: AUDIT_ACTIONS.COMPLAINT_CREATED,
        entityType: "Complaint",
        entityId: complaint1._id,
        performedBy: studentAlex._id,
        metadata: { ticketId: complaint1.ticketId, priority: complaint1.priority }
      },
      {
        action: AUDIT_ACTIONS.COMPLAINT_ESCALATED,
        entityType: "Complaint",
        entityId: complaint2._id,
        performedBySystem: true,
        metadata: { ticketId: complaint2.ticketId, level: 1, reason: "SLA Due Date Exceeded" }
      }
    ]);

    console.log("=================================================================");
    console.log("✅ Database Seeding Completed Successfully!");
    console.log("=================================================================");
    console.log("📋 Demo Credentials:");
    console.log("1. Admin:                               admin@college.edu / Admin@Password123");
    console.log("2. NAAC Quality Reviewer:               naac.officer@college.edu / Naac@Password123");
    console.log("3. Staff - Maintenance Electrician:     elec.tech@college.edu / Staff@Password123");
    console.log("4. Staff - Maintenance Plumber:         plumb.tech@college.edu / Staff@Password123");
    console.log("5. Staff - Department Head:             elec.head@college.edu / Staff@Password123");
    console.log("6. Staff - Chief Warden:                chief.warden@college.edu / Warden@Password123");
    console.log("7. Student 1 (CSE):                     alex.student@college.edu / Student@Password123");
    console.log(`8. Student 2 (ECE):                     priya.student@college.edu / Student@Password123 (Ticket: ${complaint3.ticketId}, OTP: 4321)`);
    console.log("9. Student 3 (Mechanical):              rahul.student@college.edu / Student@Password123");
    console.log("10. Student 4 (Civil Eng):              sneha.student@college.edu / Student@Password123");
    console.log("=================================================================");

    if (isCli) {
      await disconnectDB();
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    if (isCli) {
      process.exit(1);
    }
  }
};

export const seedIfEmpty = async () => {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log("⚡ Database is empty. Auto-seeding initial demo departments, users & tickets...");
    await seedDatabase({ isCli: false });
  }
};

// Check if running directly via CLI
if (process.argv[1] && process.argv[1].endsWith("seed.js")) {
  seedDatabase({ isCli: true });
}

