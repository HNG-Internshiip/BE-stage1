/**
 * Derives age_group from a numeric age.
 * 0–12   → child
 * 13–19  → teenager
 * 20–59  → adult
 * 60+    → senior
 */
export function getAgeGroup(age) {
  if (age <= 12)  return "child";
  if (age <= 19)  return "teenager";
  if (age <= 59)  return "adult";
  return "senior";
}