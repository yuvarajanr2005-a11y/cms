import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { verifyAccessToken, ACCESS_COOKIE_NAME } from "./config/jwt.js";
import { User } from "./models/User.js";
import { setIO } from "./services/notification.service.js";
import { startCronJobs, stopCronJobs } from "./services/cron.service.js";
import { seedIfEmpty } from "./seed.js";

const server = http.createServer(app);

// Socket.io Server Setup with CORS
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (
        !origin ||
        origin === env.CLIENT_URL ||
        origin === "http://localhost:5173" ||
        origin === "http://127.0.0.1:5173" ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".onrender.com")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// Pass IO instance to notification service
setIO(io);

// Socket.io Authentication Handshake Middleware
io.use(async (socket, next) => {
  try {
    let token = null;

    // 1. Try reading cookie from handshake headers
    const rawCookieHeader = socket.handshake.headers.cookie;
    if (rawCookieHeader) {
      const cookies = Object.fromEntries(
        rawCookieHeader.split("; ").map((c) => c.split("="))
      );
      if (cookies[ACCESS_COOKIE_NAME]) {
        token = decodeURIComponent(cookies[ACCESS_COOKIE_NAME]);
      }
    }

    // 2. Try auth token in handshake auth object
    if (!token && socket.handshake.auth?.token) {
      token = socket.handshake.auth.token;
    }

    // 3. Try Authorization header
    if (!token && socket.handshake.headers.authorization?.startsWith("Bearer ")) {
      token = socket.handshake.headers.authorization.split(" ")[1];
    }

    if (!token) {
      // Allow unauthenticated connection for public feed broadcasts if desired, or reject
      return next();
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select("name email role department isActive");

    if (user && user.isActive) {
      socket.user = user;
    }

    next();
  } catch (_err) {
    // If token invalid, proceed without authenticated socket.user
    next();
  }
});

// Socket Connection & Room Subscriptions
io.on("connection", (socket) => {
  if (socket.user) {
    const userId = socket.user._id.toString();
    const role = socket.user.role;
    const deptId = socket.user.department ? socket.user.department.toString() : null;

    // Join personal user room
    socket.join(`user:${userId}`);

    // Join role-based room (role:student, role:staff, role:admin)
    socket.join(`role:${role}`);

    // Join department room if applicable
    if (deptId) {
      socket.join(`department:${deptId}`);
    }

    console.log(`🔌 Socket connected: User ${socket.user.name} (${role}) [Socket: ${socket.id}]`);
  } else {
    console.log(`🔌 Socket connected: Anonymous guest [Socket: ${socket.id}]`);
  }

  socket.on("disconnect", () => {
    // Rooms cleaned up automatically by socket.io
  });
});

// Start Server after connecting to MongoDB
const startServer = async () => {
  await connectDB();
  await seedIfEmpty();

  // Start SLA & Escalation Cron Tasks
  startCronJobs();

  server.listen(env.PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Smart College Complaint Management System Server`);
    console.log(`📡 HTTP Server running on http://localhost:${env.PORT}`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
    console.log(`=======================================================`);
  });
};

// Graceful Shutdown
const handleGracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);

  // Stop cron jobs
  stopCronJobs();

  // Close HTTP server & sockets
  server.close(async () => {
    console.log("🔒 HTTP server and Socket.io closed.");
    await disconnectDB();
    console.log("👋 Graceful shutdown complete. Exiting process.");
    process.exit(0);
  });

  // Force exit after 10s if stuck
  setTimeout(() => {
    console.error("⚠️ Forcefully shutting down due to timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => handleGracefulShutdown("SIGTERM"));
process.on("SIGINT", () => handleGracefulShutdown("SIGINT"));

startServer().catch((err) => {
  console.error("❌ Fatal startup error:", err);
  process.exit(1);
});
