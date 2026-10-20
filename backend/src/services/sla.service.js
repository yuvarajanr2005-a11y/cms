import { SLA_HOURS, PRIORITIES } from "../utils/constants.js";

/**
 * Calculates SLA due date based on priority
 * @param {string} priority 
 * @param {Date} baseDate 
 * @returns {{ dueAt: Date, hours: number }}
 */
export const calculateSlaDueAt = (priority, baseDate = new Date()) => {
  const hours = SLA_HOURS[priority] || SLA_HOURS[PRIORITIES.LOW];
  const dueAt = new Date(new Date(baseDate).getTime() + hours * 60 * 60 * 1000);
  return { dueAt, hours };
};

/**
 * Recomputes SLA due date when priority changes.
 * CRITICAL RULE: Never extends an existing deadline, only shortens it if the new priority dictates an earlier time.
 * 
 * @param {Date} currentDueAt 
 * @param {string} newPriority 
 * @param {Date} createdAt 
 * @returns {{ dueAt: Date, hours: number, shortened: boolean }}
 */
export const recomputeSlaOnPriorityChange = (currentDueAt, newPriority, createdAt = new Date()) => {
  const { dueAt: newCalculatedDueAt, hours } = calculateSlaDueAt(newPriority, createdAt);

  const existingTime = new Date(currentDueAt).getTime();
  const calculatedTime = new Date(newCalculatedDueAt).getTime();

  // If new deadline is earlier than current dueAt, shorten it
  if (calculatedTime < existingTime) {
    return {
      dueAt: newCalculatedDueAt,
      hours,
      shortened: true
    };
  }

  // Otherwise maintain existing deadline (never extend)
  return {
    dueAt: currentDueAt,
    hours: SLA_HOURS[newPriority] || hours,
    shortened: false
  };
};

/**
 * Checks if a ticket has breached its SLA
 * @param {Date} dueAt 
 * @returns {boolean}
 */
export const checkSlaBreach = (dueAt) => {
  if (!dueAt) return false;
  return Date.now() > new Date(dueAt).getTime();
};
