// Kids sign-ups are open to children aged KIDS_MIN_AGE to KIDS_MAX_AGE (inclusive).
export const KIDS_MIN_AGE = 8;
export const KIDS_MAX_AGE = 12;
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Age in whole years today, from a YYYY-MM-DD date of birth; null when incomplete or invalid.
export function ageFrom(dob: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dob || ''));
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const check = new Date(y, mo - 1, d);
  if (check.getMonth() !== mo - 1 || check.getDate() !== d) return null;
  const now = new Date();
  return now.getFullYear() - y - (now.getMonth() + 1 < mo || (now.getMonth() + 1 === mo && now.getDate() < d) ? 1 : 0);
}

export const isKidsAgeAllowed = (age: number | null) => age != null && age >= KIDS_MIN_AGE && age <= KIDS_MAX_AGE;
