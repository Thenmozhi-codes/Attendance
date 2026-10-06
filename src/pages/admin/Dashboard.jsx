import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarOff, CheckCircle2, Clock, UserX, ArrowRight } from "lucide-react";
import { api, fmtHours, fmtTime } from "../../lib/api";
import { Avatar, Btn, Card, Chip, Counter, Item, Kpi, PageHeader, Ring, Skeleton, Stagger } from "../../components/ui";

export default function AdminDashboard() {
  const nav = useNavigate(), [rows, setRows] = useState(null), [pending, setPending] = useState(0);
  const load = () => { api.adminToday().then(setRows); api.notifications().then((n) => setPending(n.count)); };
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);
  const n = (f) => rows?.filter(f).length ?? 0;
  const total = rows?.length ?? 0, inCount = n((r) => !!r.rec), late = n((r) => r.status === "late"), notIn = n((r) => r.status === "none"), leave = n((r) => r.status === "leave");
  const rate = total ? Math.round((inCount / total) * 100) : 0;

  return (
    <Stagger className="space-y-5">
      <Item><PageHeader title="Overview" subtitle={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} /></Item>
      <Item className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {!rows ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />) : <>
          <Kpi icon={CheckCircle2} label="Checked in" value={inCount} tone="var(--ok)" hint={`of ${total} employees`} />
          <Kpi icon={Clock} label="Late arrivals" value={late} tone="var(--warn)" hint={`after ${"09:15"}`} />
          <Kpi icon={UserX} label="Not in yet" value={notIn} tone="var(--bad)" hint="no check-in today" />
          <Kpi icon={CalendarOff} label="On leave" value={leave} tone="var(--violet)" hint="approved leave" /></>}
      </Item>
      <Item className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-12">
        <Card className="overflow-hidden !p-0 lg:col-span-8">
          <div className="flex items-center justify-between border-b border-line px-5 py-4"><h2 className="font-bold">Today's attendance</h2><span className="flex items-center gap-2 text-xs text-mute"><span className="size-2 rounded-full bg-ok" />Live · updates every 30s</span></div>
          {!rows ? <div className="p-5"><Skeleton className="h-64" /></div> : (<>
            <table className="hidden w-full text-sm md:table">
              <thead className="text-left text-xs text-mute"><tr>{["Employee", "Status", "Check in", "Check out", "Hours"].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.user.id} className="border-t border-line/60 hover:bg-line/30">
                  <td className="px-5 py-3"><div className="flex items-center gap-3"><Avatar name={r.user.name} /><div><p className="font-semibold">{r.user.name}</p><p className="text-xs text-mute">{r.user.dept}</p></div></div></td>
                  <td className="px-5"><div className="flex items-center gap-2"><Chip k={r.status} />{r.working && <span title="Currently working" className="relative flex size-2"><span className="ping-soft absolute inset-0 rounded-full bg-ok" /><span className="relative size-2 rounded-full bg-ok" /></span>}</div></td>
                  <td className="px-5 tabular-nums">{fmtTime(r.rec?.checkIn)}</td><td className="px-5 tabular-nums">{fmtTime(r.rec?.checkOut)}</td><td className="px-5 tabular-nums">{r.rec ? fmtHours(r.workedMinutes) : "--"}</td>
                </tr>))}</tbody>
            </table>
            <ul className="divide-y divide-line md:hidden">{rows.map((r) => (
              <li key={r.user.id} className="flex items-center gap-3 p-4"><Avatar name={r.user.name} />
                <div className="min-w-0 flex-1"><p className="truncate font-semibold">{r.user.name}</p><p className="text-xs text-mute">{fmtTime(r.rec?.checkIn)} – {fmtTime(r.rec?.checkOut)}</p></div><Chip k={r.status} /></li>))}</ul></>)}
        </Card>
        <div className="space-y-5 lg:col-span-4">
          <Card className="flex flex-col items-center gap-4">
            <h2 className="self-start font-bold">Attendance rate</h2>
            <Ring size={170} stroke={13} value={rate / 100}><div className="text-center"><p className="text-3xl font-extrabold"><Counter value={rate} />%</p><p className="text-xs text-mute">{inCount} of {total} in</p></div></Ring>
          </Card>
          <Card lift className="flex items-center justify-between gap-3">
            <div><p className="text-xs font-semibold text-mute">Waiting for approval</p><p className="text-3xl font-extrabold"><Counter value={pending} /></p></div>
            <Btn v="secondary" icon={ArrowRight} onClick={() => nav("/approvals")}>Review</Btn>
          </Card>
        </div>
      </Item>
    </Stagger>
  );
}
