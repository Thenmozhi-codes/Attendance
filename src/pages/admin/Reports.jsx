import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Clock, Download, FileX, Timer, UserX } from "lucide-react";
import { DEPTS, api, fmtHours, fmtTime, ymd } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { Avatar, Btn, Card, Chip, Empty, Field, Kpi, PageHeader, Segmented, Skeleton } from "../../components/ui";

const range = (p) => { const t = new Date(), f = new Date(t); if (p === "Last 7 days") f.setDate(t.getDate() - 6); else if (p === "This month") f.setDate(1); return [ymd(f), ymd(t)]; };
const label = (d) => new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

function DayBars({ rows }) {
  const by = useMemo(() => { const m = new Map(); rows.forEach((r) => m.set(r.date, (m.get(r.date) || 0) + (["present", "late", "half"].includes(r.status) ? 1 : 0))); return [...m].reverse(); }, [rows]);
  const max = Math.max(1, ...by.map(([, v]) => v));
  if (by.length < 2) return null;
  return (
    <Card>
      <h2 className="mb-4 font-bold">Employees present per day</h2>
      <div className="overflow-x-auto"><div className="flex h-40 min-w-max items-end gap-2">
        {by.map(([d, v], i) => (
          <div key={d} className="flex w-9 flex-col items-center gap-1.5" title={`${label(d)}: ${v}`}>
            <span className="text-[11px] font-semibold text-mute">{v}</span>
            <motion.div initial={{ height: 0 }} animate={{ height: `${(v / max) * 100}px` }} transition={{ delay: i * 0.02, duration: 0.5 }} className="w-full rounded-t-md" style={{ background: "linear-gradient(var(--brand),var(--brand-2))" }} />
            <span className="text-[10px] text-mute">{new Date(d).getDate()}</span>
          </div>))}
      </div></div>
    </Card>
  );
}

export default function Reports() {
  const toast = useToast(), [preset, setPreset] = useState("This month"), [[from, to], setR] = useState(range("This month"));
  const [uid, setUid] = useState("all"), [dept, setDept] = useState("All"), [status, setStatus] = useState("All"), [users, setUsers] = useState([]);
  const [rows, setRows] = useState(null), [limit, setLimit] = useState(40);
  useEffect(() => { api.users().then((u) => setUsers(u.filter((x) => x.role === "employee"))); }, []);
  useEffect(() => { setRows(null); setLimit(40); api.report({ from, to, uid, dept }).then(setRows); }, [from, to, uid, dept]);
  const pick = (p) => { setPreset(p); setR(range(p)); };
  const shown = useMemo(() => rows?.filter((r) => status === "All" || (status === "Late" ? r.status === "late" : status === "Absent" ? ["absent", "missing"].includes(r.status) : status === "Present" ? ["present", "late", "half"].includes(r.status) : r.status === "leave")) ?? [], [rows, status]);
  const worked = shown.filter((r) => r.workedMinutes);
  const avg = worked.length ? Math.round(worked.reduce((a, r) => a + r.workedMinutes, 0) / worked.length) : 0;

  const exportCsv = () => {
    const head = ["Date", "Employee ID", "Employee", "Department", "Status", "Check in", "Check out", "Hours"];
    const csv = [head, ...shown.map((r) => [r.date, r.user.id, r.user.name, r.user.dept, r.status, fmtTime(r.checkIn), fmtTime(r.checkOut), fmtHours(r.workedMinutes)])].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    Object.assign(document.createElement("a"), { href: url, download: `attendance-report-${from}-to-${to}.csv` }).click(); URL.revokeObjectURL(url);
    toast.success("Report exported", `${shown.length} rows saved as CSV.`);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Check-in / check-out report" subtitle="Filter by date, employee and status, then export." actions={<Btn icon={Download} disabled={!shown.length} onClick={exportCsv}>Export CSV</Btn>} />
      <Card className="space-y-4">
        <Segmented label="Period" value={preset} onChange={pick} options={["Today", "Last 7 days", "This month"]} className="max-w-full overflow-x-auto" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Field label="From"><input type="date" max={to} className="field" value={from} onChange={(e) => { setPreset("Custom"); setR([e.target.value, to]); }} /></Field>
          <Field label="To"><input type="date" min={from} max={ymd(new Date())} className="field" value={to} onChange={(e) => { setPreset("Custom"); setR([from, e.target.value]); }} /></Field>
          <Field label="Employee"><select className="field" value={uid} onChange={(e) => setUid(e.target.value)}><option value="all">All employees</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
          <Field label="Department"><select className="field" value={dept} onChange={(e) => setDept(e.target.value)}>{["All", ...DEPTS].map((d) => <option key={d}>{d}</option>)}</select></Field>
        </div>
        <Segmented label="Status" value={status} onChange={setStatus} options={["All", "Present", "Late", "Absent", "Leave"]} className="max-w-full overflow-x-auto" />
      </Card>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={BarChart3} label="Records" value={shown.length} />
        <Kpi icon={Timer} label="Avg hours / day" value={Math.floor(avg / 60)} suffix={`h ${String(avg % 60).padStart(2, "0")}m`} tone="var(--brand-2)" />
        <Kpi icon={Clock} label="Late arrivals" value={shown.filter((r) => r.status === "late").length} tone="var(--warn)" />
        <Kpi icon={UserX} label="Absences" value={shown.filter((r) => ["absent", "missing"].includes(r.status)).length} tone="var(--bad)" />
      </div>
      {rows && <DayBars rows={rows} />}

      {!rows ? <Skeleton className="h-80" /> : shown.length === 0 ? <Empty icon={FileX} title="No records found" hint="Try a wider date range or clear the filters." /> : (
        <Card className="overflow-hidden !p-0">
          <table className="hidden w-full text-sm md:table">
            <thead className="border-b border-line text-left text-xs text-mute"><tr>{["Date", "Employee", "Department", "Check in", "Check out", "Hours", "Status"].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody>{shown.slice(0, limit).map((r) => (
              <tr key={r.date + r.user.id} className="border-b border-line/60 last:border-0 hover:bg-line/30">
                <td className="px-5 py-3 font-semibold">{label(r.date)}</td>
                <td className="px-5"><div className="flex items-center gap-2.5"><Avatar name={r.user.name} size="size-8" />{r.user.name}</div></td>
                <td className="px-5 text-mute">{r.user.dept}</td><td className="px-5 tabular-nums">{fmtTime(r.checkIn)}</td><td className="px-5 tabular-nums">{fmtTime(r.checkOut)}</td>
                <td className="px-5 tabular-nums">{r.checkIn ? fmtHours(r.workedMinutes) : "--"}</td><td className="px-5"><Chip k={r.status} /></td>
              </tr>))}</tbody>
          </table>
          <ul className="divide-y divide-line md:hidden">{shown.slice(0, limit).map((r) => (
            <li key={r.date + r.user.id} className="flex items-center gap-3 p-4"><Avatar name={r.user.name} />
              <div className="min-w-0 flex-1"><p className="truncate font-semibold">{r.user.name}</p><p className="text-xs text-mute">{label(r.date)} · {fmtTime(r.checkIn)} – {fmtTime(r.checkOut)}</p></div><Chip k={r.status} /></li>))}</ul>
          {shown.length > limit && <div className="border-t border-line p-4 text-center"><Btn v="secondary" onClick={() => setLimit(limit + 40)}>Show more ({shown.length - limit} left)</Btn></div>}
        </Card>)}
    </div>
  );
}
