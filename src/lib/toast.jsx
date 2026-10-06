import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
const Ctx = createContext(null);
export const useToast = () => useContext(Ctx);
const ICON = { success: [CheckCircle2, "var(--ok)"], error: [AlertCircle, "var(--bad)"], info: [Info, "var(--brand)"] };
export function ToastProvider({ children }) {
  const [list, setList] = useState([]);
  const push = useCallback((type, title, text) => {
    const id = Math.random();
    setList((l) => [...l, { id, type, title, text }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 3800);
  }, []);
  const toast = { success: (t, x) => push("success", t, x), error: (t, x) => push("error", t, x), info: (t, x) => push("info", t, x) };
  return (
    <Ctx.Provider value={toast}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 md:items-end md:pr-6">
        <AnimatePresence>
          {list.map((t) => { const [Icon, c] = ICON[t.type]; return (
            <motion.div key={t.id} layout initial={{ opacity: 0, y: -16, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: .95 }}
              className="glass-strong pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl p-3.5">
              <Icon size={20} style={{ color: c }} className="mt-0.5 shrink-0" />
              <div><p className="text-sm font-semibold">{t.title}</p>{t.text && <p className="text-sm text-mute">{t.text}</p>}</div>
            </motion.div>); })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
