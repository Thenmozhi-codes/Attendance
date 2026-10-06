import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Coffee, Fingerprint, LogIn, LogOut, PenLine, Plane, Sparkles } from "lucide-react";
import { api, fmtHMS, fmtHours, fmtTime } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useAttendance } from "../lib/attendance";
import { Btn, Card, Chip, Counter, Empty, Item, Ring, Skeleton, Stagger, TONE, Tooltip, cx } from "../components/ui";

const hello = (h) => (h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
const HEAT = { present: "var(--ok)", late: "var(--warn)", half: "var(--warn)", leave: "var(--violet)", absent: "var(--bad)", missing: "var(--bad)" };

function LiveStatus({ state, late }) {
  const m = { idle: ["var(--mute)", "Not checked in"], working: ["var(--ok)", "Working now"], done: ["var(--brand)", "Day complete"], loading: ["var(--mute)", "Loading"] }[state];
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative flex size-2.5">{state === "working" && <span className="ping-soft absolute inset-0 rounded-full" style={{ background: m[0] }} />}<span className="relative size-2.5 rounded-full" style={{ background: m[0] }} /></span>
      <span className="whitespace-nowrap text-sm font-semibold">{m[1]}</span>{late && <Chip k="late" />}
    </div>
  );
}

function AttendanceCard() {
  const a = useAttendance(), done = a.state === "done", working = a.state === "working";
  const worked = a.seconds, remaining = Math.max(0, a.expected - worked), pct = worked / a.expected;
  const late = a.rec && a.rec.checkIn.slice(11, 16) > "09:30";
  const stats = [["Expected", fmtHours(a.expected / 60)], ["Worked", fmtHours(Math.floor(worked / 60))], ["Remaining", fmtHours(Math.ceil(remaining / 60))]];
  return (
    <Card className="relative overflow-hidden lg:col-span-8">
      <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(var(--brand),transparent 70%)" }} />
      <div className="relative flex items-center justify-between"><LiveStatus state={a.state} late={late} /><span className="hidden text-xs font-semibold text-mute sm:inline">Shift 9h · 09:00 – 18:00</span></div>
      <div className="relative mt-4 flex flex-col items-center gap-5 sm:mt-6 sm:gap-8 sm:flex-row">
        {a.state === "loading" ? <Skeleton className="size-[164px] rounded-full sm:size-[210px]" /> : (
          <Ring size={innerWidth < 640 ? 164 : 210} stroke={innerWidth < 640 ? 12 : 14} value={pct}>
            <div className="text-center">
              <p className="text-[1.65rem] font-extrabold leading-none sm:text-[2rem] tracking-tight tabular-nums" aria-label="Live working timer">{fmtHMS(worked)}</p>
              <p className="mt-2 text-xs font-medium text-mute">{Math.round(Math.min(1, pct) * 100)}% of today</p>
            </div>
          </Ring>)}
        <div className="w-full flex-1 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {[["Check in", a.rec?.checkIn], ["Check out", a.rec?.checkOut]].map(([l, t]) => (
              <div key={l} className="rounded-xl border border-line bg-line/30 p-3 sm:p-3.5"><p className="text-xs text-mute">{l}</p><p className="mt-0.5 text-lg font-bold tabular-nums">{fmtTime(t)}</p></div>))}
          </div>
          {done ? <p className="flex items-center gap-2 rounded-xl bg-ok/10 px-4 py-3 text-sm font-semibold"><Sparkles size={17} className="text-ok" />Day complete. Rest well.</p>
            : working ? <Btn v="danger" className="h-14 w-full text-base" loading={a.busy} icon={a.bioRequired ? Fingerprint : LogOut} onClick={a.checkOut}>Check out</Btn>
            : <Btn className="h-14 w-full text-base" loading={a.busy} disabled={a.state === "loading"} icon={a.bioRequired ? Fingerprint : LogIn} onClick={a.checkIn}>Check in</Btn>}
        </div>
      </div>
      <dl className="relative mt-6 grid grid-cols-3 gap-3 border-t border-line pt-5">
        {stats.map(([k, v]) => <div key={k}><dt className="text-xs text-mute">{k}</dt><dd className="mt-0.5 text-lg font-bold tabular-nums">{v}</dd></div>)}
      </dl>
    </Card>
  );
}

function Overview({ days }) {
  const c = (s) => days.filter((d) => d.status === s).length;
  const rows = [["Present", c("present"), "var(--ok)"], ["Late", c("late") + c("half"), "var(--warn)"], ["Absent", c("absent") + c("missing"), "var(--bad)"], ["Leave", c("leave"), "var(--violet)"]];
  const elapsed = days.filter((d) => !["weekend", "none"].includes(d.status)).length || 1;
  const rate = Math.round(((c("present") + c("late") + c("half")) / elapsed) * 100);
  return (
    <Card lift className="lg:col-span-4">
      <div className="flex items-start justify-between"><h2 className="font-bold">This month</h2><span className="text-2xl font-extrabold grad-text"><Counter value={rate} />%</span></div>
      <p className="text-xs text-mute">Attendance rate</p>
      <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-line">
        {rows.map(([k, n, col]) => <motion.div key={k} initial={{ width: 0 }} animate={{ width: `${(n / elapsed) * 100}%` }} transition={{ duration: 0.9, delay: 0.2 }} style={{ background: col }} />)}
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3">
        {rows.map(([k, n, col]) => (
          <div key={k} className="rounded-xl bg-line/30 p-3"><dt className="flex items-center gap-2 text-xs text-mute"><span className="size-2 rounded-full" style={{ background: col }} />{k}</dt>
            <dd className="mt-1 text-2xl font-extrabold"><Counter value={n} /></dd></div>))}
      </dl>
    </Card>
  );
}

function Heatmap({ weeks }) {
  return (
    <Card className="lg:col-span-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">Attendance heatmap</h2>
        <div className="flex items-center gap-3 text-xs text-mute">{[["Present", "var(--ok)"], ["Late", "var(--warn)"], ["Leave", "var(--violet)"], ["Absent", "var(--bad)"]].map(([l, c]) => <span key={l} className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px]" style={{ background: c }} />{l}</span>)}</div></div>
      <div className="overflow-x-auto pb-1">
        <div className="flex w-max gap-1.5" role="img" aria-label="Attendance heatmap for the last 16 weeks">
          {weeks.map((w, i) => (
            <div key={i} className="grid gap-1.5">
              {w.map((d, j) => (
                <Tooltip key={d.date} text={`${new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · ${d.status === "none" ? "—" : d.status}`}>
                  <motion.span initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.025 + j * 0.01 }}
                    className="block size-[18px] rounded-[5px] sm:size-5" style={{ background: HEAT[d.status] || "var(--line)", opacity: d.status === "weekend" || d.status === "none" ? 0.35 : 1 }} />
                </Tooltip>))}
            </div>))}
        </div>
      </div>
    </Card>
  );
}

function Timeline({ items }) {
  const icon = { in: LogIn, out: LogOut, req: PenLine };
  const when = (iso) => { const d = new Date(iso), t = new Date().toDateString() === d.toDateString(); return (t ? "Today" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })) + ", " + fmtTime(iso); };
  return (
    <Card lift className="lg:col-span-4">
      <h2 className="mb-4 font-bold">Recent activity</h2>
      {items.length === 0 ? <Empty icon={Coffee} title="Nothing yet" hint="Your check-ins and requests will show up here." /> : (
        <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-line">
          {items.slice(0, 6).map((e, i) => { const I = icon[e.kind]; return (
            <motion.li key={e.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.06 }} className="relative flex gap-3">
              <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full border border-line bg-solid"><I size={14} style={{ color: e.kind === "in" ? "var(--ok)" : e.kind === "out" ? "var(--brand)" : "var(--warn)" }} /></span>
              <div><p className="text-sm font-semibold">{e.title}</p><p className="text-xs text-mute">{when(e.at)}</p></div>
            </motion.li>); })}
        </ol>)}
    </Card>
  );
}

export default function Home() {
  const { user } = useAuth(), a = useAttendance(), nav = useNavigate();
  const [days, setDays] = useState(null), [weeks, setWeeks] = useState(null), [act, setAct] = useState(null);
  useEffect(() => {
    const n = new Date();
    api.month(n.getFullYear(), n.getMonth()).then(setDays); api.heatmap().then(setWeeks); api.activity().then(setAct);
  }, [a.version]);
  const d = new Date(a.now);
  const quick = [
    { label: "Check in", Icon: LogIn, run: a.checkIn, off: a.state !== "idle", why: "Already checked in today" },
    { label: "Check out", Icon: LogOut, run: a.checkOut, off: a.state !== "working", why: "Check in first" },
    { label: "Apply leave", Icon: Plane, run: () => nav("/leave") }, { label: "Request correction", Icon: PenLine, run: () => nav("/history") },
  ];
  return (
    <Stagger className="space-y-5">
      <Item className="flex flex-wrap items-end justify-between gap-2">
        <div><p className="text-sm font-medium text-mute">{d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          <h1 className="text-[clamp(1.6rem,1.2rem+1.6vw,2.4rem)] font-extrabold tracking-tight">{hello(d.getHours())}, <span className="grad-text">{user.name.split(" ")[0]}</span></h1></div>
        <p className="text-lg font-bold tabular-nums text-mute sm:text-2xl">{d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}</p>
      </Item>
      <Item className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-12">
        <AttendanceCard />
        {days ? <Overview days={days} /> : <Skeleton className="h-80 lg:col-span-4" />}
      </Item>
      <Item className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {quick.map((q) => (
          <Tooltip key={q.label} text={q.off ? q.why : ""}>
            <button disabled={q.off} onClick={q.run} className="glass lift flex min-h-16 w-full items-center gap-3 rounded-2xl px-4 text-left text-sm font-semibold disabled:pointer-events-none disabled:opacity-45">
              <span className="grid size-10 place-items-center rounded-xl bg-line/60"><q.Icon size={18} /></span>{q.label}</button>
          </Tooltip>))}
      </Item>
      <Item className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-12">
        {weeks ? <Heatmap weeks={weeks} /> : <Skeleton className="h-56 lg:col-span-8" />}
        {act ? <Timeline items={act} /> : <Skeleton className="h-56 lg:col-span-4" />}
      </Item>
    </Stagger>
  );
}
