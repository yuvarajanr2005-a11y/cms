import { CATEGORY_BASE_WEIGHTS, PRIORITIES } from "./constants.js";

const PRIORITY_RANK = {
  [PRIORITIES.LOW]: 1,
  [PRIORITIES.MEDIUM]: 2,
  [PRIORITIES.HIGH]: 3,
  [PRIORITIES.EMERGENCY]: 4
};

/**
 * Calculates priority score and determines if priority needs a bump
 * priorityScore = baseCategoryWeight + upvoteCount * weight + age factor
 * 
 * Thresholds:
 * - 5+ upvotes or score >= 50: medium
 * - 10+ upvotes or score >= 80: high
 * - 20+ upvotes or score >= 120: emergency
 * 
 * Never downgrades priority.
 */
export const calculatePriorityAndScore = ({
  category,
  upvoteCount = 0,
  createdAt = new Date(),
  currentPriority = PRIORITIES.LOW
}) => {
  const baseCategoryWeight = CATEGORY_BASE_WEIGHTS[category] || 10;
  const upvoteWeight = upvoteCount * 5;
  
  // Age factor: 0.5 points per hour since creation (capped at 48 hours / 24 points)
  const ageInHours = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60));
  const ageFactor = Math.min(24, Math.floor(ageInHours * 0.5));

  const priorityScore = baseCategoryWeight + upvoteWeight + ageFactor;

  // Determine potential priority from thresholds
  let derivedPriority = PRIORITIES.LOW;
  if (upvoteCount >= 20 || priorityScore >= 120) {
    derivedPriority = PRIORITIES.EMERGENCY;
  } else if (upvoteCount >= 10 || priorityScore >= 80) {
    derivedPriority = PRIORITIES.HIGH;
  } else if (upvoteCount >= 5 || priorityScore >= 50) {
    derivedPriority = PRIORITIES.MEDIUM;
  }

  // Ensure priority only escalates / bumps, never downgrades automatically
  const currentRank = PRIORITY_RANK[currentPriority] || 1;
  const derivedRank = PRIORITY_RANK[derivedPriority] || 1;

  const finalPriority = derivedRank > currentRank ? derivedPriority : currentPriority;
  const hasPriorityChanged = finalPriority !== currentPriority;

  return {
    priorityScore,
    priority: finalPriority,
    hasPriorityChanged
  };
};
