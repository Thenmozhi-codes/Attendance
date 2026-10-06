import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Inbox, Plane, Search, SlidersHorizontal, Undo2 } from "lucide-react";
import { api } from "../lib/api";
import { useToast } from "../lib/toast";
import { Btn, Card, Chip, Confirm, Empty, PageHeader, Segmented, Skeleton } from "../components/ui";

const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const title = (r) => (r.kind === "leave" ? `${r.type} leave · ${r.days} day${r.days === 1 ? "" : "s"}` : "Attendance correction");
const dates = (r) => (r.kind === "leave" ? `${fmt(r.from)}${r.from !== r.to ? " – " + fmt(r.to) : ""}` : `${fmt(r.date)} · ${r.checkIn} – ${r.checkOut}`);

export default function Requests() {
  const nav = useNavigate(), toast = useToast();
  const [list, setList] = useState(null), [status, setStatus] = useState("All"), [kind, setKind] = useState("All"), [q, setQ] = useState(""), [adv, setAdv] = useState(false), [target, setTarget] = useState(null);
  const load = () => api.requests().then(setList);
  useEffect(() => { load(); }, []);
  const shown = useMemo(() => list?.filter((r) => (status === "All" || r.status === status) && (kind === "All" || r.kind === kind.toLowerCase()) &&
    (!q || (title(r) + r.reason).toLowerCase().includes(q.toLowerCase()))), [list, status, kind, q]);
  const clear = () => { setStatus("All"); setKind("All"); setQ(""); };

  return (
    <div className="space-y-5">
      <PageHeader title="Requests" subtitle="Track your leave and correction requests." actions={<Btn icon={Plane} onClick={() => nav("/leave")}>New leave request</Btn>} />
      <Card className="space-y-3 !p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-52 flex-1"><Search size={17} className="absolute left-3.5 top-3.5 text-mute" /><input className="field !pl-10" placeholder="Search requests" aria-label="Search requests" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Segmented label="Status" value={status} onChange={setStatus} options={["All", "Pending", "Approved", "Rejected"]} className="max-w-full overflow-x-auto" />
          <Btn v={adv ? "primary" : "secondary"} icon={SlidersHorizontal} aria-expanded={adv} onClick={() => setAdv(!adv)}>Filters</Btn>
        </div>
        <AnimatePresence>{adv && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3"><span className="text-sm font-semibold">Type</span><Segmented label="Type" value={kind} onChange={setKind} options={["All", "Leave", "Correction"]} /></div>
          </motion.div>)}</AnimatePresence>
      </Card>

      {!shown ? <Skeleton className="h-64" /> : shown.length === 0 ? (
        <Empty icon={Inbox} title={list.length ? "No requests match" : "No requests yet"} hint={list.length ? "Try changing the filters or search." : "Leave and correction requests you send will appear here."}
          action={list.length ? <Btn v="secondary" onClick={clear}>Clear filters</Btn> : <Btn onClick={() => nav("/leave")}>Apply for leave</Btn>} />
      ) : (
        <Card className="overflow-hidden !p-0">
          <table className="hidden w-full text-sm md:table">
            <thead className="border-b border-line text-left text-xs text-mute"><tr>{["Request", "Dates", "Reason", "Status", ""].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody>{shown.map((r) => (
              <tr key={r.id} className="border-b border-line/60 last:border-0 hover:bg-line/30">
                <td className="px-5 py-3.5 font-semibold">{title(r)}</td><td className="px-5 text-mute">{dates(r)}</td>
                <td className="max-w-56 truncate px-5 text-mute">{r.reason}</td><td className="px-5"><Chip k={r.status} /></td>
                <td className="px-5 text-right">{r.status === "Pending" && <Btn v="ghost" icon={Undo2} onClick={() => setTarget(r)}>Withdraw</Btn>}</td>
              </tr>))}</tbody>
          </table>
          <ul className="divide-y divide-line md:hidden">{shown.map((r) => (
            <li key={r.id} className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2"><div><p className="font-semibold">{title(r)}</p><p className="text-xs text-mute">{dates(r)}</p></div><Chip k={r.status} /></div>
              <p className="text-sm text-mute">{r.reason}</p>
              {r.status === "Pending" && <Btn v="secondary" icon={Undo2} onClick={() => setTarget(r)}>Withdraw</Btn>}
            </li>))}</ul>
        </Card>)}
      <AnimatePresence>{target && (
        <Confirm title="Withdraw this request?" text={`${title(target)} will be cancelled. You can send a new request any time.`} confirmLabel="Withdraw" danger onClose={() => setTarget(null)}
          onConfirm={async () => { await api.withdraw(target.id); toast.success("Request withdrawn"); load(); }} />)}</AnimatePresence>
    </div>
  );
}
