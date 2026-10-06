// Mock API backed by localStorage. Replace each function body with a fetch() call to your backend.
// Two roles: "employee" and "admin". Accounts are capped at MAX_USERS.
const KEY = "att.v3";
const pad = (n) => String(n).padStart(2, "0");
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const stamp = () => { const d = new Date(); return `${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
const wait = (v) => new Promise((r) => setTimeout(() => r(v), 220));
const save = (s) => (localStorage.setItem(KEY, JSON.stringify(s)), s);
const hhmm = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const isWeekend = (dt) => [0, 6].includes(dt.getDay());
const strip = ({ pw, ...u }) => u;

export const MAX_USERS = 10;
export const DEPTS = ["Engineering", "Design", "Sales", "Support", "Operations"];
export const SHIFT = { start: "09:00", end: "18:00", lateAfter: "09:15" };
export const STATUS_LABEL = { present: "Present", late: "Late", absent: "Absent", half: "Half-day", leave: "On leave", missing: "Missing checkout", weekend: "Weekend", none: "Not in yet" };
const LEAVE_TOTAL = { Casual: 12, Sick: 8, Earned: 15 };
export const LEAVE_TYPES = Object.keys(LEAVE_TOTAL);
export const minutesBetween = (a, b) => Math.max(0, Math.round((new Date(b) - new Date(a)) / 60000));
export const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "--";
export const fmtHMS = (sec) => `${pad(Math.floor(sec / 3600))}:${pad(Math.floor((sec % 3600) / 60))}:${pad(sec % 60)}`;
export const fmtHours = (m) => `${Math.floor(m / 60)}h ${pad(m % 60)}m`;

const mk = (id, name, dept, role = "employee", pw = "demo123", email) => ({ id, name, dept, role, pw, active: true, email: (email || `${name.split(" ")[0].toLowerCase()}@example.com`).toLowerCase() });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERS = [mk("ADM001", "Meera Raghavan", "Operations", "admin", "admin123"), mk("EMP001", "Arun Kumar", "Engineering"), mk("EMP002", "Priya Nair", "Design"),
  mk("EMP003", "Karthik Raj", "Engineering"), mk("EMP004", "Divya Lakshmi", "Sales"), mk("EMP005", "Naveen Prakash", "Support"),
  mk("EMP006", "Sanjay Mohan", "Sales"), mk("EMP007", "Anitha Selvam", "Design"), mk("EMP008", "Vikram Raj", "Operations")];

function seed() {
  const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes(), records = {};
  USERS.filter((u) => u.role === "employee").forEach((u, ui) => {
    const rec = (records[u.id] = {});
    for (let i = 100; i >= 0; i--) {
      const dt = addDays(now, -i); if (isWeekend(dt)) continue;
      const k = ymd(dt), r = (ui * 131 + i * 17) % 100;
      if (i === 0) {
        if (u.id === "EMP001") continue;
        const inM = 530 + ((ui * 7) % 50), outM = 1065 + ((ui * 13) % 50);
        if (nowMin < inM) continue;
        rec[k] = { checkIn: `${k}T${hhmm(inM)}:00` }; if (nowMin > outM) rec[k].checkOut = `${k}T${hhmm(outM)}:00`; continue;
      }
      if (r < 4) continue;
      const late = r < 20, inM = late ? 575 + (r % 25) : 530 + (r % 25), outM = r % 37 === 0 ? 785 : 1060 + ((r * 7) % 65);
      rec[k] = { checkIn: `${k}T${hhmm(inM)}:00`, checkOut: `${k}T${hhmm(outM)}:00` };
    }
  });
  let d = addDays(now, -1); while (isWeekend(d)) d = addDays(d, -1);
  const c = stamp(), f = (n) => ymd(addDays(now, n));
  const requests = [
    { id: 1, userId: "EMP002", kind: "leave", type: "Casual", from: f(3), to: f(4), days: 2, reason: "Family function", status: "Pending", createdAt: c },
    { id: 2, userId: "EMP003", kind: "leave", type: "Sick", from: f(1), to: f(1), days: 1, reason: "Doctor appointment", status: "Pending", createdAt: c },
    { id: 3, userId: "EMP005", kind: "correction", date: ymd(d), checkIn: "09:05", checkOut: "18:00", reason: "Forgot to check out", status: "Pending", createdAt: c },
    { id: 4, userId: "EMP004", kind: "leave", type: "Earned", from: f(10), to: f(12), days: 3, reason: "Trip", status: "Approved", createdAt: c },
  ];
  return save({ session: null, users: USERS, records, requests });
}
const load = () => { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s) return s; } catch {} return seed(); };

function dayStatus(s, uid, dt) {
  const k = ymd(dt), today = ymd(new Date());
  if (isWeekend(dt)) return "weekend";
  if (s.requests.some((r) => r.userId === uid && r.kind === "leave" && r.status === "Approved" && k >= r.from && k <= r.to)) return "leave";
  const rec = s.records[uid]?.[k];
  if (rec) {
    if (!rec.checkOut && k < today) return "missing";
    if (rec.checkOut && minutesBetween(rec.checkIn, rec.checkOut) < 270) return "half";
    return rec.checkIn.slice(11, 16) > SHIFT.lateAfter ? "late" : "present";
  }
  return k < today ? "absent" : "none";
}
const names = (s) => Object.fromEntries(s.users.map((u) => [u.id, u]));
const reqTitle = (r) => (r.kind === "leave" ? `${r.type} leave requested` : "Correction requested");

export const api = {
  me() { const s = load(), u = s.users.find((x) => x.id === s.session && x.active); return u ? strip(u) : null; },
  async login(id, pw) {
    await wait(); const s = load(), key = id.trim().toLowerCase();
    const u = s.users.find((x) => x.id.toLowerCase() === key || x.email === key);
    if (!u || u.pw !== pw) throw new Error("Employee ID or password is incorrect.");
    if (!u.active) throw new Error("This account is disabled. Contact your admin.");
    s.session = u.id; save(s); return strip(u);
  },
  async loginWithEmail(email) {
    await wait(); const s = load(), u = s.users.find((x) => x.email === email.trim().toLowerCase());
    if (!u) throw new Error(`${email} is not registered. Ask your admin to add this email.`);
    if (!u.active) throw new Error("This account is disabled. Contact your admin.");
    s.session = u.id; save(s); return strip(u);
  },
  async setUser(u) { await wait(); const s = load(), x = s.users.find((y) => y.id === u.id && y.active); if (!x) throw new Error("Account not found."); s.session = x.id; save(s); return strip(x); },
  logout() { const s = load(); s.session = null; save(s); },

  /* ---------- Employee ---------- */
  async today() { await wait(); const s = load(); return s.records[s.session]?.[ymd(new Date())] || null; },
  async checkIn() {
    await wait(); const s = load(), k = ymd(new Date()), r = (s.records[s.session] ??= {});
    if (r[k]) throw new Error("You have already checked in today.");
    r[k] = { checkIn: stamp() }; save(s); return r[k];
  },
  async checkOut() {
    await wait(); const s = load(), k = ymd(new Date()), r = (s.records[s.session] ??= {});
    if (!r[k]) throw new Error("Check in before checking out.");
    r[k].checkOut = stamp(); save(s); return r[k];
  },
  async month(y, m) {
    await wait(); const s = load(), uid = s.session, days = [];
    for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++) {
      const dt = new Date(y, m, d), k = ymd(dt), rec = s.records[uid]?.[k];
      days.push({ date: k, day: d, weekday: dt.getDay(), status: dayStatus(s, uid, dt), ...rec, workedMinutes: rec?.checkOut ? minutesBetween(rec.checkIn, rec.checkOut) : 0,
        pending: s.requests.some((r) => r.userId === uid && r.kind === "correction" && r.date === k && r.status === "Pending") });
    }
    return days;
  },
  async heatmap(weeks = 16) {
    await wait(); const s = load(), end = new Date(), start = addDays(end, -end.getDay() - (weeks - 1) * 7);
    return Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, d) => {
      const dt = addDays(start, w * 7 + d); return { date: ymd(dt), status: dt > end ? "none" : dayStatus(s, s.session, dt) };
    }));
  },
  async activity() {
    await wait(); const s = load(), ev = [];
    Object.entries(s.records[s.session] || {}).forEach(([k, r]) => {
      ev.push({ id: k + "i", at: r.checkIn, title: "Checked in", kind: "in" });
      if (r.checkOut) ev.push({ id: k + "o", at: r.checkOut, title: "Checked out", kind: "out" });
    });
    s.requests.filter((r) => r.userId === s.session).forEach((r) => ev.push({ id: "r" + r.id, at: r.createdAt, kind: "req", status: r.status, title: reqTitle(r) }));
    return ev.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
  },
  async balance() {
    await wait(); const s = load(), used = {};
    s.requests.filter((r) => r.userId === s.session && r.kind === "leave" && !["Rejected", "Withdrawn"].includes(r.status)).forEach((r) => (used[r.type] = (used[r.type] || 0) + r.days));
    return LEAVE_TYPES.map((t) => ({ type: t, total: LEAVE_TOTAL[t], used: used[t] || 0, left: LEAVE_TOTAL[t] - (used[t] || 0) }));
  },
  async requests() { await wait(); const s = load(); return s.requests.filter((r) => r.userId === s.session).reverse(); },
  async applyLeave({ type, from, to, half, reason }) {
    await wait(); const s = load(), days = half ? 0.5 : Math.round((new Date(to) - new Date(from)) / 86400000) + 1;
    s.requests.push({ id: Date.now(), userId: s.session, kind: "leave", type, from, to, half, days, reason, status: "Pending", createdAt: stamp() }); save(s);
  },
  async correction({ date, checkIn, checkOut, reason }) {
    await wait(); const s = load();
    s.requests.push({ id: Date.now(), userId: s.session, kind: "correction", date, checkIn, checkOut, reason, status: "Pending", createdAt: stamp() }); save(s);
  },
  async withdraw(id) {
    await wait(); const s = load(), r = s.requests.find((x) => x.id === id && x.userId === s.session);
    if (r?.status === "Pending") r.status = "Withdrawn"; save(s);
  },
  async notifications() {
    await wait(); const s = load(), n = names(s), admin = n[s.session]?.role === "admin";
    const list = admin ? s.requests.filter((r) => r.status === "Pending").map((r) => ({ id: r.id, title: `${n[r.userId]?.name}: ${reqTitle(r)}`, sub: "Waiting for approval" }))
      : s.requests.filter((r) => r.userId === s.session).slice(-5).reverse().map((r) => ({ id: r.id, title: reqTitle(r), sub: r.status }));
    return { list, count: s.requests.filter((r) => (admin ? r.status === "Pending" : r.userId === s.session && r.status === "Pending")).length };
  },

  /* ---------- Admin ---------- */
  async users() { await wait(); return load().users.map(strip); },
  async addUser({ name, dept, role, email }) {
    await wait(); const s = load(); email = (email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) throw new Error("Enter a valid email address.");
    if (s.users.some((u) => u.email === email)) throw new Error("This email is already used by another account.");
    if (s.users.length >= MAX_USERS) throw new Error(`User limit reached (${MAX_USERS} accounts).`);
    const p = role === "admin" ? "ADM" : "EMP"; let n = s.users.filter((u) => u.id.startsWith(p)).length + 1;
    while (s.users.some((u) => u.id === p + String(n).padStart(3, "0"))) n++;
    const u = mk(p + String(n).padStart(3, "0"), name.trim(), dept, role, role === "admin" ? "admin123" : "demo123", email);
    s.users.push(u); save(s); return u;
  },
  async updateUser(id, { name, dept, email }) {
    await wait(); const s = load(), u = s.users.find((x) => x.id === id); email = email.trim().toLowerCase();
    if (!u) throw new Error("User not found.");
    if (!EMAIL_RE.test(email)) throw new Error("Enter a valid email address.");
    if (s.users.some((x) => x.id !== id && x.email === email)) throw new Error("This email is already used by another account.");
    Object.assign(u, { name: name.trim(), dept, email }); save(s); return strip(u);
  },
  async setActive(id, active) {
    await wait(); const s = load(), u = s.users.find((x) => x.id === id);
    if (!u || u.id === s.session) throw new Error("You cannot disable your own account.");
    u.active = active; save(s);
  },
  async adminToday() {
    await wait(); const s = load(), k = ymd(new Date()), now = new Date();
    return s.users.filter((u) => u.role === "employee" && u.active).map((u) => {
      const rec = s.records[u.id]?.[k], st = dayStatus(s, u.id, now);
      return { user: strip(u), rec, status: st, working: !!rec && !rec.checkOut, workedMinutes: rec ? minutesBetween(rec.checkIn, rec.checkOut || new Date()) : 0 };
    });
  },
  async report({ from, to, uid = "all", dept = "All" }) {
    await wait(); const s = load(), today = ymd(new Date()), start = new Date(from + "T00:00:00"), rows = [];
    const end = new Date(Math.min(new Date(to + "T00:00:00"), addDays(start, 92)));
    const users = s.users.filter((u) => u.role === "employee" && (uid === "all" || u.id === uid) && (dept === "All" || u.dept === dept));
    for (let d = end; d >= start; d = addDays(d, -1)) {
      const k = ymd(d); if (k > today || isWeekend(d)) continue;
      users.forEach((u) => { const rec = s.records[u.id]?.[k];
        rows.push({ date: k, user: { id: u.id, name: u.name, dept: u.dept }, status: dayStatus(s, u.id, d), checkIn: rec?.checkIn, checkOut: rec?.checkOut,
          workedMinutes: rec?.checkOut ? minutesBetween(rec.checkIn, rec.checkOut) : 0 }); });
    }
    return rows;
  },
  async approvals() {
    await wait(); const s = load(), n = names(s);
    return s.requests.map((r) => ({ ...r, user: strip(n[r.userId] || { name: "Unknown", dept: "-" }) })).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
  },
  async decide(id, approve) {
    await wait(); const s = load(), r = s.requests.find((x) => x.id === id);
    if (!r || r.status !== "Pending") throw new Error("This request was already handled.");
    r.status = approve ? "Approved" : "Rejected"; r.decidedAt = stamp();
    if (approve && r.kind === "correction") (s.records[r.userId] ??= {})[r.date] = { checkIn: `${r.date}T${r.checkIn}:00`, checkOut: `${r.date}T${r.checkOut}:00` };
    save(s);
  },
};
