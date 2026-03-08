export const dateKeyFromRaw = (raw) => {
  if (!raw || typeof raw !== "string") return null;

  // Handles YYYY-MM-DD
  const ymdMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    return Number(`${ymdMatch[1]}${ymdMatch[2]}${ymdMatch[3]}`);
  }

  // Handles other date formats
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return null;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return Number(`${y}${m}${d}`);
};

export const getIssueDateKeys = (issue) => {
  const keys = [dateKeyFromRaw(issue?.meeting_date || "")].filter(Boolean);
  return [...new Set(keys)];
};

export const getIssueDateKey = (issue) => {
  const keys = getIssueDateKeys(issue);
  return keys.length > 0 ? Math.max(...keys) : null;
};

export const toDDMMYYYY = (dt) => {
  const day = String(dt.getDate()).padStart(2, "0");
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const year = dt.getFullYear();
  return `${day}-${month}-${year}`;
};

export const parseDDMMYYYYToKey = (value) => {
  if (!value || typeof value !== "string") return null;
  const [dd, mm, yyyy] = value.split("-");
  if (!dd || !mm || !yyyy) return null;
  return Number(`${yyyy}${mm.padStart(2, "0")}${dd.padStart(2, "0")}`);
};

export const parseDeadline = (value) => {
  if (!value || typeof value !== "string") return Number.MAX_SAFE_INTEGER;
  const [dd, mm, yyyy] = value.split("-");
  if (!dd || !mm || !yyyy) return Number.MAX_SAFE_INTEGER;
  // Convert dd-mm-yyyy to yyyymmdd for numeric sorting
  return Number(`${yyyy}${mm.padStart(2, "0")}${dd.padStart(2, "0")}`);
};

export const priorityRank = (value) => {
  const p = String(value || "").toLowerCase();
  if (p === "high") return 0;
  if (p === "medium") return 1;
  if (p === "low") return 2;
  return 3;
};
