import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, animate, motion } from "framer-motion";
import { Check, CircleDot, CircleHelp, Clock, Hourglass, Minus, Plane, Undo2, X } from "lucide-react";
import { STATUS_LABEL } from "../lib/api";

export const cx = (...a) => a.filter(Boolean).join(" ");

/* ---------- Motion helpers ---------- */
const EASE = [0.22, 1, 0.36, 1];
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const rise = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } };
export const Stagger = ({ className, children }) => <motion.div variants={container} initial="hidden" animate="show" className={className}>{children}</motion.div>;
export const Item = ({ className, children }) => <motion.div variants={rise} className={className}>{children}</motion.div>;

/* ---------- Status tones ---------- */
export const TONE = {
  present: ["var(--ok)", Check], late: ["var(--warn)", Clock], absent: ["var(--bad)", X], half: ["var(--warn)", CircleDot],
  leave: ["var(--violet)", Plane], missing: ["var(--bad)", CircleHelp], weekend: ["var(--mute)", Minus], none: ["var(--mute)", Minus],
  Pending: ["var(--warn)", Hourglass], Approved: ["var(--ok)", Check], Rejected: ["var(--bad)", X], Withdrawn: ["var(--mute)", Undo2],
};
export function Chip({ k }) {
  const [c, Icon] = TONE[k] || TONE.none;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: `color-mix(in srgb, ${c} 14%, transparent)`, color: `color-mix(in srgb, ${c} 80%, var(--ink))` }}>
      <Icon size={13} strokeWidth={3} aria-hidden />{STATUS_LABEL[k] || k}
    </span>
  );
}

/* ---------- Surfaces & buttons ---------- */
export const Card = ({ lift, className, ...p }) => <section className={cx("glass min-w-0 rounded-2xl p-4 sm:p-5", lift && "lift", className)} {...p} />;
const V = { primary: "btn-primary", danger: "btn-danger", secondary: "glass hover:bg-solid", ghost: "hover:bg-line" };
export function Btn({ v = "primary", loading, icon: Icon, className, children, ...p }) {
  return (
    <motion.button whileTap={{ scale: 0.97 }} whileHover={{ y: -1 }} {...p} disabled={p.disabled || loading}
      className={cx("inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:pointer-events-none disabled:opacity-50", V[v], className)}>
      {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : Icon && <Icon size={17} aria-hidden />}
      {children}
    </motion.button>
  );
}
export function Field({ label, error, hint, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-semibold">{label}</span>{children}
      {hint && !error && <span className="mt-1 block text-xs text-mute">{hint}</span>}
      {error && <span role="alert" className="mt-1 block text-xs font-medium text-bad">{error}</span>}
    </label>
  );
}
export function Segmented({ value, onChange, options, label, className }) {
  const id = useId();
  return (
    <div role="tablist" aria-label={label} className={cx("inline-flex rounded-xl border border-line bg-line/40 p-1", className)}>
      {options.map((o) => {
        const v = o.value ?? o, on = v === value;
        return (
          <button key={v} role="tab" aria-selected={on} onClick={() => onChange(v)}
            className={cx("relative min-h-9 rounded-lg px-3 text-sm font-semibold transition-colors", on ? "text-ink" : "text-mute hover:text-ink")}>
            {on && <motion.span layoutId={id} transition={{ type: "spring", stiffness: 500, damping: 38 }} className="absolute inset-0 rounded-lg bg-solid shadow-sm" />}
            <span className="relative flex items-center gap-1.5">{o.icon}{o.label ?? o}</span>
          </button>
        );
      })}
    </div>
  );
}
export const Tooltip = ({ text, children }) => (
  <span className="group relative inline-flex">{children}
    <span role="tooltip" className="pointer-events-none absolute -top-9 left-1/2 z-40 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 text-xs font-medium text-bg shadow-lg [@media(hover:hover)]:group-hover:block">{text}</span>
  </span>
);

/* ---------- Loading & empty ---------- */
export const Skeleton = ({ className = "h-20" }) => <div aria-hidden className={cx("shimmer rounded-2xl", className)} />;
export function Empty({ icon: Icon, title, hint, action }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-12 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-line/60">{Icon && <Icon size={26} className="text-mute" />}</div>
      <p className="font-semibold">{title}</p><p className="mt-1 max-w-xs text-sm text-mute">{hint}</p>{action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------- Data viz ---------- */
export function Ring({ value = 0, size = 160, stroke = 12, children, from = "var(--brand)", to = "var(--brand-2)" }) {
  const id = useId(), r = (size - stroke) / 2, c = 2 * Math.PI * r, v = Math.min(1, Math.max(0, value));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${Math.round(v * 100)} percent`}>
      <svg width={size} height={size} className="-rotate-90">
        <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={from} /><stop offset="1" stopColor={to} /></linearGradient></defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - v) }} transition={{ duration: 1.1, ease: EASE }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
export function Counter({ value, className }) {
  const [n, setN] = useState(0);
  useEffect(() => { const a = animate(0, value, { duration: 0.9, ease: "easeOut", onUpdate: (v) => setN(Math.round(v)) }); return () => a.stop(); }, [value]);
  return <span className={className}>{n}</span>;
}

/* ---------- Overlays ---------- */
function useEsc(fn) { useEffect(() => { const k = (e) => e.key === "Escape" && fn(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [fn]); }
export function Sheet({ title, onClose, children }) {
  useEsc(onClose);
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end bg-black/45 backdrop-blur-sm md:items-center md:justify-center" onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}
        className="glass-strong max-h-[88vh] w-full overflow-auto rounded-t-3xl p-6 pb-8 md:max-w-md md:rounded-3xl">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line md:hidden" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="grid size-10 place-items-center rounded-xl hover:bg-line"><X size={18} /></button>
        </div>{children}
      </motion.div>
    </motion.div>
  );
}
export function Confirm({ title, text, confirmLabel = "Confirm", danger, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  return (
    <Sheet title={title} onClose={onClose}>
      <p className="mb-6 text-sm text-mute">{text}</p>
      <div className="flex gap-3">
        <Btn v="secondary" className="flex-1" onClick={onClose}>Cancel</Btn>
        <Btn v={danger ? "danger" : "primary"} className="flex-1" loading={busy} onClick={async () => { setBusy(true); await onConfirm(); onClose(); }}>{confirmLabel}</Btn>
      </div>
    </Sheet>
  );
}
export function Popover({ trigger, children, align = "right", width = "w-[min(18rem,calc(100vw-2rem))]" }) {
  const [open, setOpen] = useState(false), ref = useRef();
  useEffect(() => {
    if (!open) return;
    const d = (e) => !ref.current?.contains(e.target) && setOpen(false), k = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", d); document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", d); document.removeEventListener("keydown", k); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}
            className={cx("glass-strong absolute z-40 mt-2 rounded-2xl p-2", width, align === "right" ? "right-0" : "left-0")}>
            {typeof children === "function" ? children(() => setOpen(false)) : children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div><h1 className="text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] font-extrabold tracking-tight">{title}</h1>{subtitle && <p className="mt-1 text-sm text-mute">{subtitle}</p>}</div>
    {actions}
  </div>
);

export function Switch({ checked, onChange, label, hint, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
      className="flex min-h-14 w-full items-center justify-between gap-4 text-left disabled:opacity-50">
      <span><span className="block text-sm font-semibold">{label}</span>{hint && <span className="block text-xs text-mute">{hint}</span>}</span>
      <span className={cx("relative h-7 w-12 shrink-0 rounded-full transition-colors", checked ? "btn-primary" : "bg-line")}>
        <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 35 }} className={cx("absolute top-1 size-5 rounded-full bg-white shadow", checked ? "right-1" : "left-1")} />
      </span>
    </button>
  );
}

export const Avatar = ({ name, size = "size-9" }) => (
  <span aria-hidden className={cx("grid shrink-0 place-items-center rounded-full bg-brand/15 text-sm font-bold text-brand", size)}>{name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
);
export const Kpi = ({ icon: Icon, label, value, tone = "var(--brand)", hint, suffix }) => (
  <Card lift className="flex items-center gap-4">
    <span className="grid size-12 shrink-0 place-items-center rounded-xl" style={{ background: `color-mix(in srgb, ${tone} 16%, transparent)`, color: tone }}><Icon size={22} /></span>
    <div className="min-w-0"><p className="truncate text-xs font-semibold text-mute">{label}</p><p className="text-2xl font-extrabold leading-tight"><Counter value={value} />{suffix}</p>{hint && <p className="truncate text-xs text-mute">{hint}</p>}</div>
  </Card>
);
