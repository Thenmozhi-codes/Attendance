import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CornerDownLeft, Search } from "lucide-react";
import { cx } from "./ui";

export default function CommandPalette({ commands, onClose }) {
  const [q, setQ] = useState(""), [i, setI] = useState(0), ref = useRef();
  const list = useMemo(() => commands.filter((c) => !c.hidden && (c.label + " " + (c.keywords || "")).toLowerCase().includes(q.toLowerCase())), [commands, q]);
  useEffect(() => { ref.current?.focus(); }, []);
  useEffect(() => setI(0), [q]);
  const run = (c) => { onClose(); c?.run(); };
  const onKey = (e) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowDown") { e.preventDefault(); setI((x) => Math.min(list.length - 1, x + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setI((x) => Math.max(0, x - 1)); }
    if (e.key === "Enter") run(list[i]);
  };
  return (
    <motion.div className="fixed inset-0 z-[55] flex items-start justify-center bg-black/45 px-4 pt-[14vh] backdrop-blur-sm" onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div role="dialog" aria-modal="true" aria-label="Command menu" onClick={(e) => e.stopPropagation()} onKeyDown={onKey}
        initial={{ y: -12, scale: 0.97 }} animate={{ y: 0, scale: 1 }} className="glass-strong w-full max-w-lg overflow-hidden rounded-2xl">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={18} className="text-mute" />
          <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a command or search…" aria-label="Search commands"
            className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-mute" />
          <kbd className="rounded-md border border-line px-1.5 py-0.5 text-[11px] text-mute">Esc</kbd>
        </div>
        <ul role="listbox" className="max-h-80 overflow-auto p-2">
          {list.length === 0 && <li className="px-3 py-8 text-center text-sm text-mute">No commands match “{q}”.</li>}
          {list.map((c, n) => (
            <li key={c.id} role="option" aria-selected={n === i}>
              <button onMouseMove={() => setI(n)} onClick={() => run(c)}
                className={cx("flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm", n === i && "bg-line")}>
                <c.icon size={17} className="text-mute" /><span className="flex-1 font-medium">{c.label}</span>
                <span className="text-xs text-mute">{c.group}</span>{n === i && <CornerDownLeft size={14} className="text-mute" />}
              </button>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}
