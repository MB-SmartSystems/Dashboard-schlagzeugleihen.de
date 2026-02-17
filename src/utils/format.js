export const formatDate = (iso) => {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatEuro = (v) =>
  (parseFloat(v) || 0).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";

export const daysUntil = (iso) =>
  !iso ? Infinity : Math.ceil((new Date(iso) - new Date()) / 864e5);

export const progressPercent = (start, end) => {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const n = Date.now();
  if (n >= e) return 100;
  if (n <= s) return 0;
  return Math.round(((n - s) / (e - s)) * 100);
};

export const selectValue = (field) => field?.value || "–";

export const lookupValue = (field) => field?.[0]?.value || null;

export const linkId = (field) => field?.[0]?.id || null;

export const normalizeWhatsApp = (raw) => {
  if (!raw) return "";
  let num = raw.replace(/[\s\-\(\)\/]/g, "");
  if (num.startsWith("+")) num = num.slice(1);
  if (num.startsWith("0")) num = "49" + num.slice(1);
  return num;
};
