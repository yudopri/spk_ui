/**
 * Helper format tanggal yang aman terhadap nilai null/undefined/format non-ISO dari API.
 * Mengembalikan fallback ("-") alih-alih "Invalid Date".
 */

const isValidDate = (d: Date) => !isNaN(d.getTime());

const parse = (value: unknown): Date | null => {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return isValidDate(d) ? d : null;
};

export const formatDateSafe = (value: unknown, fallback = "-"): string => {
  const d = parse(value);
  return d ? d.toLocaleDateString("id-ID") : fallback;
};

export const formatDateTimeSafe = (value: unknown, fallback = "-"): string => {
  const d = parse(value);
  return d ? d.toLocaleString("id-ID") : fallback;
};

export const formatDateLongSafe = (value: unknown, fallback = "-"): string => {
  const d = parse(value);
  return d ? d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : fallback;
};
