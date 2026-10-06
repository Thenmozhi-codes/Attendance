import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, Download, PenLine, Rows3, SearchX } from "lucide-react";
import { api, fmtHours, fmtTime } from "../lib/api";
import { useToast } from "../lib/toast";
import { Btn, Card, Chip, Empty, Field, PageHeader, Segmented, Sheet, Skeleton, TONE, Tooltip, cx } from "../components/ui";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FILTERS = ["All", "Present", "Late", "Absent", "Leave"];
const match = (f, s) => f === "All" || (f === "Present" && s === "present") || (f === "Late" && ["late", "half"].includes(s)) || (f === "Absent" && ["absent", "missing"].includes(s)) || (f === "Leave" && s === "leave");

export default function History() {
  const toast = useToast(), now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [days, setDays] = useState(null), [view, setView] = useState("calendar"), [filter, setFilter] = useState("All"), [sel, setSel] = useState(null);
  const load = () => { setDays(null); api.month(ym.y, ym.m).then(setDays); };
  useEffect(load, [ym]);
  const shift = (n) => { const d = new Date(ym.y, ym.m + n, 1); setYm({ y: d.getFullYear(), m: d.getMonth() }); };
  const rows = useMemo(() => days?.filter((d) => !["none", "weekend"].includes(d.status) && match(filter, d.status)).reverse() ?? [], [days, filter]);
  const worked = days?.filter((d) => d.workedMinutes) ?? [];
  const avg = worked.length ? Math.round(worked.reduce((a, d) => a + d.workedMinutes, 0) / worked.length) : 0;

  const exportCsv = () => {
    const csv = [["Date", "Status", "Check in", "Check out", "Hours"], ...days.map((d) => [d.date, d.status, fmtTime(d.checkIn), fmtTime(d.checkOut), fmtHours(d.workedMinutes)])].map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    Object.assign(document.createElement("a"), { href: url, download: `attendance-${ym.y}-${ym.m + 1}.csv` }).click(); URL.revokeObjectURL(url);
    toast.success("Export ready", "Your CSV has been downloaded.");
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Attendance history" subtitle="Review every day, hour and status." actions={<Btn v="secondary" icon={Download} disabled={!days} onClick={exportCsv}>Export CSV</Btn>} />
      <Card className="flex flex-wrap items-center gap-3 !p-3">
        <div className="flex items-center gap-1">
          <Btn v="ghost" className="!px-2.5" aria-label="Previous month" onClick={() => shift(-1)}><ChevronLeft size={18} /></Btn>
          <input type="month" aria-label="Choose month" className="field !w-44 text-center font-semibold" value={`${ym.y}-${String(ym.m + 1).padStart(2, "0")}`}
            onChange={(e) => e.target.value && setYm({ y: +e.target.value.slice(0, 4), m: +e.target.value.slice(5) - 1 })} />
          <Btn v="ghost" className="!px-2.5" aria-label="Next month" onClick={() => shift(1)}><ChevronRight size={18} /></Btn>
        </div>
        <Segmented label="Status filter" value={filter} onChange={setFilter} options={FILTERS} className="max-w-full overflow-x-auto" />
        <Segmented className="ml-auto" label="View" value={view} onChange={setView} options={[{ value: "calendar", label: "Calendar", icon: <CalendarDays size={15} /> }, { value: "table", label: "Table", icon: <Rows3 size={15} /> }]} />
      </Card>
      <p className="text-sm text-mute">{worked.length} days worked · average {fmtHours(avg)} per day</p>

      {!days ? <Skeleton className="h-96" /> : view === "calendar" ? (
        <Card className="!p-3 sm:!p-5">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {DOW.map((d) => <div key={d} className="pb-1 text-center text-xs font-semibold text-mute">{d}</div>)}
            {Array.from({ length: days[0].weekday }).map((_, i) => <div key={"b" + i} />)}
            {days.map((d) => {
              const [c, Icon] = TONE[d.status], dim = d.status !== "none" && !match(filter, d.status);
              return (
                <Tooltip key={d.date} text={d.status === "none" ? "Upcoming" : `${d.status} · ${fmtTime(d.checkIn)} – ${fmtTime(d.checkOut)}`}>
                  <button onClick={() => d.status !== "none" && setSel(d)} aria-label={`${d.date}, ${d.status}`}
                    className={cx("lift flex aspect-square w-full flex-col items-center justify-center gap-0.5 rounded-xl border text-sm font-bold", dim && "opacity-25")}
                    style={{ background: `color-mix(in srgb, ${c} ${d.status === "none" || d.status === "weekend" ? 6 : 15}%, transparent)`, borderColor: `color-mix(in srgb, ${c} 30%, transparent)` }}>
                    {d.day}{d.status !== "none" && <Icon size={12} strokeWidth={3} style={{ color: c }} />}
                  </button>
                </Tooltip>);
            })}
          </div>
        </Card>
      ) : rows.length === 0 ? <Empty icon={SearchX} title="No matching days" hint="Try another status filter or a different month." action={<Btn v="secondary" onClick={() => setFilter("All")}>Clear filter</Btn>} /> : (
        <Card className="overflow-hidden !p-0">
          <table className="hidden w-full text-sm md:table">
            <thead className="border-b border-line text-left text-xs text-mute"><tr>{["Date", "Check in", "Check out", "Hours", "Status", ""].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody>{rows.map((d) => (
              <tr key={d.date} className="border-b border-line/60 last:border-0 hover:bg-line/30">
                <td className="px-5 py-3.5 font-semibold">{new Date(d.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</td>
                <td className="px-5 tabular-nums">{fmtTime(d.checkIn)}</td><td className="px-5 tabular-nums">{fmtTime(d.checkOut)}</td><td className="px-5 tabular-nums">{fmtHours(d.workedMinutes)}</td>
                <td className="px-5"><Chip k={d.status} /></td><td className="px-5 text-right"><Btn v="ghost" onClick={() => setSel(d)}>Details</Btn></td>
              </tr>))}</tbody>
          </table>
          <ul className="divide-y divide-line md:hidden">{rows.map((d) => (
            <li key={d.date}><button onClick={() => setSel(d)} className="flex min-h-16 w-full items-center justify-between gap-3 px-4 text-left">
              <span><span className="block font-semibold">{new Date(d.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span>
                <span className="text-xs text-mute">{fmtTime(d.checkIn)} – {fmtTime(d.checkOut)} · {fmtHours(d.workedMinutes)}</span></span><Chip k={d.status} /></button></li>))}</ul>
        </Card>)}
      <AnimatePresence>{sel && <DaySheet key={sel.date} day={sel} onClose={() => setSel(null)} onSaved={load} />}</AnimatePresence>
    </div>
  );
}

function DaySheet({ day, onClose, onSaved }) {
  const toast = useToast(), [form, setForm] = useState(false), [f, setF] = useState({ checkIn: "09:00", checkOut: "18:00", reason: "" });
  const [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const canFix = ["missing", "late", "absent", "half"].includes(day.status) && !day.pending;
  const submit = async () => {
    if (!f.reason.trim()) return setErr("Add a reason so your request can be reviewed.");
    setBusy(true); await api.correction({ date: day.date, ...f });
    toast.success("Correction sent", "You can track it under Requests."); onSaved(); onClose();
  };
  return (
    <Sheet title={new Date(day.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} onClose={onClose}>
      <div className="space-y-5">
        <Chip k={day.status} />
        <dl className="grid grid-cols-3 gap-3">{[["Check in", fmtTime(day.checkIn)], ["Check out", fmtTime(day.checkOut)], ["Hours", fmtHours(day.workedMinutes)]].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-line/40 p-3"><dt className="text-xs text-mute">{k}</dt><dd className="mt-0.5 font-bold tabular-nums">{v}</dd></div>))}</dl>
        {day.pending && <p className="rounded-xl bg-warn/15 px-4 py-3 text-sm font-medium">A correction for this day is waiting for review.</p>}
        {canFix && !form && <Btn v="secondary" className="w-full" icon={PenLine} onClick={() => setForm(true)}>Request correction</Btn>}
        {form && (<div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Check in"><input type="time" className="field" value={f.checkIn} onChange={(e) => setF({ ...f, checkIn: e.target.value })} /></Field>
            <Field label="Check out"><input type="time" className="field" value={f.checkOut} onChange={(e) => setF({ ...f, checkOut: e.target.value })} /></Field>
          </div>
          <Field label="Reason" error={err}><textarea rows={3} className="field" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></Field>
          <Btn className="w-full" loading={busy} onClick={submit}>Send correction</Btn>
        </div>)}
      </div>
    </Sheet>
  );
}
