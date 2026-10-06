import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";
import { useToast } from "./toast";
import { useAuth } from "./auth";
import { bioError, useBiometric } from "./biometric";
const Ctx = createContext(null);
export const useAttendance = () => useContext(Ctx);
export const EXPECTED = 9 * 3600;

export function AttendanceProvider({ children }) {
  const toast = useToast(), bio = useBiometric(), { user } = useAuth(), isAdmin = user?.role === "admin";
  const [rec, setRec] = useState(undefined), [busy, setBusy] = useState(false), [now, setNow] = useState(Date.now());
  const [version, setVersion] = useState(0);
  useEffect(() => { if (!isAdmin) api.today().then(setRec).catch(() => setRec(null)); }, [isAdmin]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const run = async (fn, title, text) => {
    setBusy(true);
    try {
      if (bio.requireCheckIn) await bio.verify();
      setRec(await fn()); setVersion((v) => v + 1); navigator.vibrate?.(35); toast.success(title, text); }
    catch (e) { toast.error(bio.requireCheckIn && e.name ? "Fingerprint not verified" : "Could not complete that", bioError(e)); }
    finally { setBusy(false); }
  };
  const state = isAdmin ? "admin" : rec === undefined ? "loading" : !rec ? "idle" : rec.checkOut ? "done" : "working";
  const seconds = rec ? Math.max(0, Math.floor(((rec.checkOut ? new Date(rec.checkOut) : now) - new Date(rec.checkIn)) / 1000)) : 0;
  const value = { rec, bioRequired: bio.requireCheckIn, state, seconds, now, busy, version, expected: EXPECTED,
    checkIn: () => run(api.checkIn, "Checked in", "Your day has started."),
    checkOut: () => run(api.checkOut, "Checked out", "Have a good evening.") };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
