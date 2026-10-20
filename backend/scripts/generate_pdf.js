import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(__dirname, "../../SmartCMS_Project_Summary.pdf");
const doc = new PDFDocument({
  size: "A4",
  margins: { top: 40, bottom: 45, left: 45, right: 45 },
  bufferPages: true
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Color Palette
const PRIMARY = "#1E3A8A";    // Deep Navy
const SECONDARY = "#0284C7";  // Sky Blue
const ACCENT = "#0D9488";     // Teal
const TEXT_DARK = "#1E293B";  // Slate 800
const TEXT_MUTED = "#64748B"; // Slate 500
const BG_LIGHT = "#F8FAFC";   // Slate 50
const BORDER = "#E2E8F0";     // Slate 200
const SUCCESS = "#16A34A";    // Emerald
const WARNING = "#D97706";    // Amber
const DANGER = "#DC2626";     // Rose/Red

const pageWidth = 595.28 - 90; // A4 width minus left/right margins (505.28)

// Helper: Section Header
function drawSectionHeader(title, icon = "") {
  // Check if we need a new page
  if (doc.y > 680) {
    doc.addPage();
  } else {
    doc.moveDown(0.8);
  }

  const startY = doc.y;
  doc.rect(45, startY, 4, 18).fill(SECONDARY);
  doc.fillColor(PRIMARY).fontSize(14).font("Helvetica-Bold")
     .text(`  ${icon} ${title}`, 52, startY + 2);
  doc.moveDown(0.5);
}

// Helper: Card box
function drawCard(title, description, color = SECONDARY, height = 55) {
  if (doc.y + height > 740) doc.addPage();
  const y = doc.y;
  doc.roundedRect(45, y, pageWidth, height, 6).fillAndStroke(BG_LIGHT, BORDER);
  doc.rect(45, y, 4, height).fill(color);
  doc.fillColor(color).fontSize(10.5).font("Helvetica-Bold").text(title, 58, y + 8);
  doc.fillColor(TEXT_DARK).fontSize(9).font("Helvetica").text(description, 58, y + 23, { width: pageWidth - 25, lineGap: 2 });
  doc.y = y + height + 6;
}

// Helper: Bullet point
function drawBullet(title, text) {
  if (doc.y > 730) doc.addPage();
  const currentY = doc.y;
  doc.circle(52, currentY + 5, 2.5).fill(SECONDARY);
  doc.fillColor(TEXT_DARK).font("Helvetica-Bold").fontSize(9.5).text(`  ${title}: `, 58, currentY, { continued: true });
  doc.font("Helvetica").fillColor("#334155").text(text, { lineGap: 2 });
  doc.moveDown(0.3);
}

// Helper: Key-Value line
function drawTable(headers, rows, colWidths) {
  if (doc.y + 30 + rows.length * 20 > 740) doc.addPage();
  const startX = 45;
  let startY = doc.y;

  // Header row
  doc.rect(startX, startY, pageWidth, 22).fill("#E2E8F0");
  let curX = startX + 8;
  headers.forEach((h, i) => {
    doc.fillColor(PRIMARY).fontSize(9).font("Helvetica-Bold").text(h, curX, startY + 6, { width: colWidths[i] });
    curX += colWidths[i];
  });

  startY += 22;
  rows.forEach((row, rIndex) => {
    const rowBg = rIndex % 2 === 0 ? "#FFFFFF" : "#F8FAFC";
    doc.rect(startX, startY, pageWidth, 20).fill(rowBg);
    doc.rect(startX, startY, pageWidth, 20).stroke(BORDER);
    curX = startX + 8;
    row.forEach((cell, cIndex) => {
      doc.fillColor(TEXT_DARK).fontSize(8.5).font(cIndex === 0 ? "Helvetica-Bold" : "Helvetica")
         .text(cell, curX, startY + 5, { width: colWidths[cIndex] - 6 });
      curX += colWidths[cIndex];
    });
    startY += 20;
  });
  doc.y = startY + 10;
}

// ==================== COVER / HEADER ====================
doc.rect(45, 40, pageWidth, 85).fill(PRIMARY);
doc.fillColor("#FFFFFF").fontSize(20).font("Helvetica-Bold")
   .text("Smart College Complaint Management", 60, 55);
doc.fillColor("#93C5FD").fontSize(11).font("Helvetica")
   .text("SmartCMS - Full Project Summary & Easy Explanation Guide", 60, 80);

doc.rect(420, 52, 115, 22).fill("#1E40AF");
doc.fillColor("#FFFFFF").fontSize(8.5).font("Helvetica-Bold")
   .text("STUDENT-FRIENDLY GUIDE", 425, 58, { align: "center", width: 105 });

doc.y = 140;

// ==================== 1. WHAT IS THIS PROJECT? ====================
drawSectionHeader("1. What is this Project? (The Big Idea)");
doc.fillColor(TEXT_DARK).fontSize(9.5).font("Helvetica").text(
  "SmartCMS is an easy-to-use college complaint website built for students, teachers, repair workers, and college leaders. " +
  "In many colleges, when a fan stops working or a water tap breaks, students have to write on paper forms or run around offices. " +
  "Complaints get forgotten, delayed, or marked 'fixed' even when nothing was done.\n\n" +
  "SmartCMS fixes all of this. It turns complaint tracking into a clear, fast, and transparent digital process right from your phone or laptop.",
  45, doc.y, { width: pageWidth, lineGap: 3 }
);

drawCard(
  "Core Purpose in One Sentence",
  "A smart online complaint portal where students report problems, repair staff must prove their work with a photo and a secret code, and college supervisors get alerted if work is not done on time.",
  ACCENT,
  46
);

// ==================== 2. THE 4 ROLES ====================
drawSectionHeader("2. Who Uses This System? (The 4 Roles)");

drawTable(
  ["User Role", "Real Person", "What They Can Do in SmartCMS"],
  [
    ["Student", "Any college student", "Post issues, click 'Me Too', track timer, verify repair with OTP, give star rating."],
    ["Staff (Worker)", "Electrician, Plumber, etc.", "See assigned work, start jobs, upload photo proof of fixed item, request OTP."],
    ["Dept Head / Warden", "Professors & Supervisors", "Watch over department tickets, receive auto-escalated issues when workers delay."],
    ["Administrator", "Principal / System Admin", "Create departments, manage all user accounts, view live charts, inspect audit history."]
  ],
  [110, 120, 275]
);

// ==================== 3. TOP FEATURES EXPLAINED SIMPLY ====================
drawSectionHeader("3. The Most Important Features (Explained in Simple Words)");

drawBullet(
  "1. 'Me Too' Button (No Duplicate Complaints)",
  "If 5 students have broken fans in the same classroom, they don't need to post 5 separate complaints. They simply click 'Me Too' on the first one! This increases the complaint's urgency score automatically."
);

drawBullet(
  "2. Mandatory Photo Proof",
  "Repair staff cannot just press 'Done' and walk away. They must take a picture of the repaired item and upload it as real proof before the ticket can move forward."
);

drawBullet(
  "3. 4-Digit Secret OTP Verification",
  "When the technician finishes, the student gets a private 4-digit code (OTP) on their screen and email. The repair is only closed when the student confirms with their code or leaves a 1 to 5 star review."
);

drawBullet(
  "4. Automatic Timer (SLA)",
  "Every complaint gets an official countdown clock: Emergency (6 hours), High/Medium (24 hours), Low (72 hours). Everyone can see how much time is left."
);

drawBullet(
  "5. Automatic Robot Escalation (Background Worker)",
  "Every 5 minutes, an automatic computer task checks all tickets. If a worker is taking too long or an issue is unassigned, it automatically assigns a free worker and sends an alert to the Department Head!"
);

drawBullet(
  "6. Anonymous Option",
  "Students can check 'Submit Anonymously' for sensitive grievances. Their name and email are kept hidden from public feeds and technician views."
);

drawBullet(
  "7. Live Real-Time Updates",
  "Thanks to WebSocket technology, status changes, new upvotes, and alerts appear instantly on your screen without having to refresh the browser."
);

// ==================== 4. HOW A TICKET TRAVELS ====================
drawSectionHeader("4. Step-by-Step: The Life of a Complaint");

const steps = [
  ["Step 1: Student Files Complaint", "Student enters title, room location, category (e.g., Electrical), and priority. An official Ticket ID like CMP-2026-000001 is created."],
  ["Step 2: Auto or Manual Assignment", "The system or Department Head assigns the job to an available technician in that department."],
  ["Step 3: Work in Progress", "The technician marks the ticket 'In Progress' and goes to the room to fix the problem."],
  ["Step 4: Photo Proof Uploaded", "The technician uploads a photo of the completed repair. The status changes to 'Pending Verification'."],
  ["Step 5: Student Verification & Rating", "The student checks the repair, enters their 4-digit OTP, and gives a 1 to 5 star rating. The ticket is officially 'Closed'!"]
];

drawTable(["Lifecycle Step", "What Happens"], steps, [160, 345]);

// ==================== 5. TECH STACK IN PLAIN WORDS ====================
drawSectionHeader("5. Technology Used (Explained for Beginners)");

drawBullet("Frontend Folder (frontend/)", "React 18, Vite, and TailwindCSS. Modern, clean dark/light look, smooth buttons, and interactive cards.");
drawBullet("Backend Folder (backend/)", "Node.js and Express 4. Handles user logins, password security, API requests, and email notifications.");
drawBullet("Database (The Memory)", "MongoDB with Mongoose. Saves all students, tickets, proof photos, and activity history.");
drawBullet("Zero-Friction Fallback", "If MongoDB is not installed locally, the system automatically turns on an in-memory database and loads demo accounts instantly!");
drawBullet("Instant Messenger", "Socket.io. Sends live alerts and updates directly to user screens like a chat app.");
drawBullet("Background Clock", "Node-Cron. Runs every 5 minutes in the background to enforce deadlines and auto-escalate delayed issues.");

// ==================== 6. PRE-CONFIGURED DEMO ACCOUNTS ====================
drawSectionHeader("6. Ready-to-Use Demo Accounts");

drawTable(
  ["Role", "Email Address", "Password", "Notes"],
  [
    ["Admin", "admin@college.edu", "Admin@Password123", "Full power, view analytics & audit logs"],
    ["Chief Warden", "chief.warden@college.edu", "Warden@Password123", "Supervisor for major escalations"],
    ["Dept Head", "elec.head@college.edu", "Staff@Password123", "Electrical Department Head"],
    ["Technician", "elec.tech@college.edu", "Staff@Password123", "Electrician maintenance worker"],
    ["Student 1", "alex.student@college.edu", "Student@Password123", "Standard student account"],
    ["Student 2", "priya.student@college.edu", "Student@Password123", "Has sample ticket with OTP: 4321"]
  ],
  [95, 155, 125, 130]
);

drawCard(
  "1-Click Login Tip",
  "On the login page (http://localhost:5173/login), you do not need to type passwords manually. Simply click any of the 1-Click Demo Buttons at the bottom to test each role instantly!",
  PRIMARY,
  42
);

// ==================== FOOTERS & PAGE NUMBERS ====================
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);

  // Top header line on subsequent pages
  if (i > range.start) {
    doc.fillColor(TEXT_MUTED).fontSize(7.5).font("Helvetica")
       .text("Smart College Complaint Management System (SmartCMS) — Project Summary", 45, 20);
    doc.moveTo(45, 30).lineTo(550, 30).stroke(BORDER);
  }

  // Bottom footer line
  doc.moveTo(45, 800).lineTo(550, 800).stroke(BORDER);
  doc.fillColor(TEXT_MUTED).fontSize(8).font("Helvetica")
     .text("SmartCMS Project Documentation • Simple English Summary", 45, 808);
  doc.text(`Page ${i + 1} of ${range.count}`, 500, 808, { align: "right" });
}

doc.end();

writeStream.on("finish", () => {
  console.log("PDF generated successfully at:", outputPath);
});
writeStream.on("error", (err) => {
  console.error("PDF generation failed:", err);
});
