
// Get next scheduled date based on frequency
export const getNextScheduledDate = (settings: EmailSettings): Date | null => {
  if (!settings.enabled || !settings.email) {
    return null;
  }
  
  const now = new Date();
  const lastSent = settings.lastSent || now;
  const nextDate = new Date(lastSent);
  
  switch (settings.frequency) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "biweekly":
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }
  
  // If a delivery time is specified, set the hours and minutes
  if (settings.deliveryTime) {
    const [hours, minutes] = settings.deliveryTime.split(':').map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      nextDate.setHours(hours, minutes, 0, 0);
    }
  }
  
  return nextDate;
};
