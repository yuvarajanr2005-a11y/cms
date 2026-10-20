import { Complaint } from "../models/Complaint.js";
import { User } from "../models/User.js";
import { STATUSES, ROLES } from "../utils/constants.js";

/**
 * 1. Average resolution time per department using aggregation pipeline
 */
export const getResolutionTimeByDepartment = async () => {
  const pipeline = [
    {
      $match: {
        status: STATUSES.CLOSED,
        "resolution.resolvedAt": { $exists: true, $ne: null }
      }
    },
    {
      $project: {
        department: 1,
        resolutionMinutes: {
          $divide: [
            { $subtract: ["$resolution.resolvedAt", "$createdAt"] },
            1000 * 60 // convert ms to minutes
          ]
        }
      }
    },
    {
      $group: {
        _id: "$department",
        avgResolutionMinutes: { $avg: "$resolutionMinutes" },
        minResolutionMinutes: { $min: "$resolutionMinutes" },
        maxResolutionMinutes: { $max: "$resolutionMinutes" },
        totalResolved: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "departments",
        localField: "_id",
        foreignField: "_id",
        as: "departmentInfo"
      }
    },
    {
      $unwind: {
        path: "$departmentInfo",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 1,
        departmentName: { $ifNull: ["$departmentInfo.name", "General / Unassigned"] },
        departmentCode: { $ifNull: ["$departmentInfo.code", "GEN"] },
        avgResolutionMinutes: { $round: ["$avgResolutionMinutes", 1] },
        avgResolutionHours: { $round: [{ $divide: ["$avgResolutionMinutes", 60] }, 1] },
        minResolutionMinutes: { $round: ["$minResolutionMinutes", 0] },
        maxResolutionMinutes: { $round: ["$maxResolutionMinutes", 0] },
        totalResolved: 1
      }
    },
    { $sort: { avgResolutionMinutes: 1 } }
  ];

  return Complaint.aggregate(pipeline);
};

/**
 * 2. Campus location heatmap (complaint density by block, floor, and room)
 */
export const getLocationHeatmap = async () => {
  const pipeline = [
    {
      $group: {
        _id: {
          block: "$location.block",
          floor: "$location.floor",
          room: "$location.room"
        },
        totalComplaints: { $sum: 1 },
        activeComplaints: {
          $sum: {
            $cond: [{ $in: ["$status", [STATUSES.SUBMITTED, STATUSES.ASSIGNED, STATUSES.IN_PROGRESS, STATUSES.ESCALATED]] }, 1, 0]
          }
        },
        closedComplaints: {
          $sum: {
            $cond: [{ $eq: ["$status", STATUSES.CLOSED] }, 1, 0]
          }
        },
        emergencyCount: {
          $sum: {
            $cond: [{ $eq: ["$priority", "emergency"] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        block: "$_id.block",
        floor: "$_id.floor",
        room: "$_id.room",
        fullPath: { $concat: ["$_id.block", " > ", "$_id.floor", " > ", "$_id.room"] },
        totalComplaints: 1,
        activeComplaints: 1,
        closedComplaints: 1,
        emergencyCount: 1
      }
    },
    { $sort: { totalComplaints: -1 } },
    { $limit: 25 }
  ];

  return Complaint.aggregate(pipeline);
};

/**
 * 3. Staff performance scorecards
 * (resolved count, avg resolution time, SLA compliance %, reopen rate, avg rating)
 */
export const getStaffPerformanceScorecards = async () => {
  const staffMembers = await User.find({
    role: ROLES.STAFF,
    isActive: true
  })
    .populate("department", "name code")
    .select("name email staffType department performance")
    .lean();

  const scorecards = await Promise.all(
    staffMembers.map(async (st) => {
      // Find all tickets assigned to this staff member
      const assignedTickets = await Complaint.find({ assignedTo: st._id }).lean();

      const totalAssigned = assignedTickets.length;
      const totalResolved = assignedTickets.filter(
        (t) => t.status === STATUSES.CLOSED || t.status === STATUSES.PENDING_VERIFICATION
      ).length;

      // Calculate SLA compliance (tickets resolved on or before sla.dueAt)
      let resolvedOnTime = 0;
      assignedTickets.forEach((t) => {
        if (t.resolution?.resolvedAt && t.sla?.dueAt) {
          if (new Date(t.resolution.resolvedAt).getTime() <= new Date(t.sla.dueAt).getTime()) {
            resolvedOnTime++;
          }
        }
      });

      const slaComplianceRate = totalResolved > 0
        ? Math.round((resolvedOnTime / totalResolved) * 100)
        : 100;

      const reopenCount = st.performance?.reopenedCount || 0;
      const reopenRate = (totalResolved + reopenCount) > 0
        ? Math.round((reopenCount / (totalResolved + reopenCount)) * 100)
        : 0;

      const ratingCount = st.performance?.ratingCount || 0;
      const avgRating = ratingCount > 0
        ? Math.round(((st.performance?.totalRatingSum || 0) / ratingCount) * 10) / 10
        : 5.0;

      return {
        _id: st._id,
        name: st.name,
        email: st.email,
        staffType: st.staffType,
        department: st.department ? { name: st.department.name, code: st.department.code } : null,
        totalAssigned,
        totalResolved,
        avgResolutionMinutes: st.performance?.avgResolutionMinutes || 0,
        avgResolutionHours: Math.round(((st.performance?.avgResolutionMinutes || 0) / 60) * 10) / 10,
        slaComplianceRate,
        reopenRate,
        avgRating,
        ratingCount
      };
    })
  );

  return scorecards.sort((a, b) => b.totalResolved - a.totalResolved);
};

/**
 * 4. System Overview Metrics and Trends
 */
export const getSystemOverviewMetrics = async () => {
  const [
    totalComplaints,
    statusCounts,
    categoryCounts,
    breachedCount,
    escalatedCount,
    recentTrend
  ] = await Promise.all([
    Complaint.countDocuments(),
    Complaint.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),
    Complaint.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Complaint.countDocuments({ "sla.breached": true }),
    Complaint.countDocuments({ status: STATUSES.ESCALATED }),
    Complaint.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          closed: {
            $sum: { $cond: [{ $eq: ["$status", STATUSES.CLOSED] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  const statusMap = {};
  statusCounts.forEach((s) => {
    statusMap[s._id] = s.count;
  });

  const breachRate = totalComplaints > 0
    ? Math.round((breachedCount / totalComplaints) * 100)
    : 0;

  return {
    totalComplaints,
    statusMap,
    categoryDistribution: categoryCounts.map((c) => ({ category: c._id, count: c.count })),
    breachedCount,
    breachRate,
    escalatedCount,
    dailyTrends: recentTrend.map((t) => ({ date: t._id, registered: t.count, closed: t.closed }))
  };
};
