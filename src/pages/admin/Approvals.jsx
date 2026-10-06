import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ClipboardCheck, PenLine, Plane, X } from "lucide-react";
import { api } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { Avatar, Btn, Card, Chip, Confirm, Empty, PageHeader, Segmented, Skeleton } from "../../components/ui";

const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const detail = (r) => (r.kind === "leave" ? `${r.type} leave · ${r.days} day${r.days === 1 ? "" : "s"} · ${fmt(r.from)}${r.from !== r.to ? " – " + fmt(r.to) : ""}` : `Correction for ${fmt(r.date)} · ${r.checkIn} – ${r.checkOut}`);

export default function Approvals() {
  const toast = useToast(), [list, setList] = useState(null), [tab, setTab] = useState("Pending"), [reject, setReject] = useState(null), [busy, setBusy] = useState(null);
  const load = () => api.approvals().then(setList);
  useEffect(() => { load(); }, []);
  const shown = list?.filter((r) => (tab === "Pending" ? r.status === "Pending" : r.status !== "Pending"));
  const decide = async (r, ok) => {
    setBusy(r.id);
    try { await api.decide(r.id, ok); toast.success(ok ? "Request approved" : "Request rejected", r.user.name); await load(); }
    catch (e) { toast.error("Could not update", e.message); } finally { setBusy(null); }
  };
  return (
    <div className="space-y-5">
      <PageHeader title="Approvals" subtitle="Review leave and attendance correction requests." actions={<Segmented label="Show" value={tab} onChange={setTab} options={["Pending", "Decided"]} />} />
      {!shown ? <Skeleton className="h-64" /> : shown.length === 0 ? <Empty icon={ClipboardCheck} title={tab === "Pending" ? "All caught up" : "Nothing decided yet"} hint={tab === "Pending" ? "New requests from employees will appear here." : "Approved and rejected requests are listed here."} /> : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
          <AnimatePresence initial={false}>{shown.map((r) => (
            <motion.div key={r.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}>
              <Card className="space-y-4">
                <div className="flex items-start gap-3"><Avatar name={r.user.name} size="size-11" />
                  <div className="min-w-0 flex-1"><p className="font-bold">{r.user.name}</p><p className="text-xs text-mute">{r.user.dept} · {r.userId}</p></div>
                  {r.status === "Pending" ? <span className="grid size-9 place-items-center rounded-xl bg-line/60">{r.kind === "leave" ? <Plane size={17} /> : <PenLine size={17} />}</span> : <Chip k={r.status} />}</div>
                <div><p className="text-sm font-semibold">{detail(r)}</p><p className="mt-1 text-sm text-mute">“{r.reason}”</p></div>
                {r.status === "Pending" && <div className="flex gap-3">
                  <Btn v="secondary" className="flex-1" icon={X} disabled={busy === r.id} onClick={() => setReject(r)}>Reject</Btn>
                  <Btn className="flex-1" icon={Check} loading={busy === r.id} onClick={() => decide(r, true)}>Approve</Btn></div>}
              </Card></motion.div>))}</AnimatePresence>
        </div>)}
      <AnimatePresence>{reject && <Confirm title="Reject this request?" danger confirmLabel="Reject" text={`${reject.user.name} will see this request as rejected.`} onClose={() => setReject(null)} onConfirm={() => decide(reject, false)} />}</AnimatePresence>
    </div>
  );
}
