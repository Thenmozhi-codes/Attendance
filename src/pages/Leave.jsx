import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CalendarOff, Send } from "lucide-react";
import { LEAVE_TYPES, api, ymd } from "../lib/api";
import { useToast } from "../lib/toast";
import { Btn, Card, Chip, Counter, Empty, Field, Item, PageHeader, Ring, Segmented, Skeleton, Stagger } from "../components/ui";

const COLORS = { Casual: ["var(--brand)", "var(--brand-2)"], Sick: ["var(--bad)", "var(--warn)"], Earned: ["var(--violet)", "var(--brand)"] };
const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export default function Leave() {
  const nav = useNavigate(), toast = useToast(), today = ymd(new Date());
  const [bal, setBal] = useState(null), [reqs, setReqs] = useState(null);
  const [f, setF] = useState({ type: LEAVE_TYPES[0], from: today, to: today, half: false, reason: "" });
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const load = () => { api.balance().then(setBal); api.requests().then((r) => setReqs(r.filter((x) => x.kind === "leave"))); };
  useEffect(load, []);

  const days = f.half ? 0.5 : Math.max(0, Math.round((new Date(f.to) - new Date(f.from)) / 86400000) + 1);
  const left = bal?.find((b) => b.type === f.type)?.left ?? 0;
  const submit = async () => {
    if (f.to < f.from) return setErr("The end date must be on or after the start date.");
    if (!f.reason.trim()) return setErr("Add a short reason for your leave.");
    if (days > left) return setErr(`You have ${left} ${f.type.toLowerCase()} leave days left.`);
    setBusy(true); setErr(""); await api.applyLeave(f);
    toast.success("Leave request sent", `${days} day${days === 1 ? "" : "s"} of ${f.type.toLowerCase()} leave.`);
    setF({ ...f, reason: "" }); setBusy(false); load();
  };

  return (
    <Stagger className="space-y-5">
      <Item><PageHeader title="Leave" subtitle="Check your balance and plan time off." /></Item>
      <Item className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-3">
        {!bal ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-40" />) : bal.map((b) => (
          <Card key={b.type} lift className="flex items-center gap-4">
            <Ring size={84} stroke={9} value={b.left / b.total} from={COLORS[b.type][0]} to={COLORS[b.type][1]}><span className="text-lg font-extrabold"><Counter value={b.left} /></span></Ring>
            <div><p className="font-bold">{b.type}</p><p className="text-sm text-mute">{b.left} of {b.total} days left</p></div>
          </Card>))}
      </Item>
      <Item className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-5">
        <Card className="space-y-5 lg:col-span-3">
          <h2 className="font-bold">Apply for leave</h2>
          <Field label="Leave type"><Segmented label="Leave type" value={f.type} onChange={(type) => setF({ ...f, type })} options={LEAVE_TYPES} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From"><input type="date" min={today} className="field" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value, to: f.half || e.target.value > f.to ? e.target.value : f.to })} /></Field>
            <Field label="To"><input type="date" min={f.from} className="field disabled:opacity-50" value={f.to} disabled={f.half} onChange={(e) => setF({ ...f, to: e.target.value })} /></Field>
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
            <input type="checkbox" className="size-5 accent-[var(--brand)]" checked={f.half} onChange={(e) => setF({ ...f, half: e.target.checked, to: f.from })} />Half-day
          </label>
          <Field label="Reason" error={err}><textarea rows={3} className="field" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="Add a short note" /></Field>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-line/40 px-4 py-3 text-sm">
            <span>This uses <b>{days}</b> day{days === 1 ? "" : "s"}</span><span className="flex items-center gap-2 text-mute">{left}<ArrowRight size={14} /><b className="text-ink">{Math.max(0, left - days)}</b> left</span>
          </div>
          <Btn className="w-full" icon={Send} loading={busy} onClick={submit}>Submit request</Btn>
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-bold">Leave timeline</h2>
          {!reqs ? <Skeleton className="h-40" /> : reqs.length === 0 ? <Empty icon={CalendarOff} title="No leave planned" hint="Requests you send will appear here as a timeline." /> : (
            <ol className="relative space-y-5 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-line">
              {reqs.map((r, i) => (
                <motion.li key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="relative pl-7">
                  <span className="absolute left-0 top-1.5 size-[15px] rounded-full border-2 border-brand bg-solid" />
                  <p className="text-sm font-semibold">{r.type} · {r.days} day{r.days === 1 ? "" : "s"}</p>
                  <p className="mb-1.5 text-xs text-mute">{fmt(r.from)}{r.from !== r.to && ` – ${fmt(r.to)}`}</p><Chip k={r.status} />
                </motion.li>))}
            </ol>)}
        </Card>
      </Item>
    </Stagger>
  );
}
