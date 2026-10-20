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
      name: "Rahul Verma",
      email: "rahul.student@college.edu",
      password: "Student@Password123",
      role: ROLES.STUDENT,
      phone: "+91 9876544443"
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
    console.log("2. Staff - Maintenance Electrician:     elec.tech@college.edu / Staff@Password123");
    console.log("3. Staff - Maintenance Civil:           civil.tech@college.edu / Staff@Password123");
    console.log("4. Staff - Department Head:             elec.head@college.edu / Staff@Password123");
    console.log("5. Staff - Chief Warden:                chief.warden@college.edu / Warden@Password123");
    console.log("6. Student 1:                           alex.student@college.edu / Student@Password123");
    console.log(`7. Student 2 (Pending Verification):    priya.student@college.edu / Student@Password123 (Ticket: ${complaint3.ticketId}, OTP: 4321)`);
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

