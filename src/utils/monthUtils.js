const monthKeyPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

export function getCurrentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getPreviousMonthKey(date = new Date()) {
  const previousMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return getCurrentMonthKey(previousMonth);
}

export function isValidMonthFormat(monthStr) {
  return typeof monthStr === "string" && monthKeyPattern.test(monthStr);
}

export function isMonthInActiveWindow(monthKey, date = new Date()) {
  return (
    isValidMonthFormat(monthKey) &&
    (monthKey === getCurrentMonthKey(date) ||
      monthKey === getPreviousMonthKey(date))
  );
}
