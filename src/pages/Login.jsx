import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CalendarCheck2, Eye, EyeOff, Fingerprint, ShieldCheck, Timer } from "lucide-react";
import { useAuth } from "../lib/auth";
import { Btn, Field } from "../components/ui";
import { bioError, useBiometric } from "../lib/biometric";
import { GOOGLE_CLIENT_ID, GoogleButton } from "../lib/google";

const POINTS = [[Timer, "One-tap check-in", "Start your day in under five seconds."], [CalendarCheck2, "Clear history", "Every day, hour and request in one place."], [ShieldCheck, "Simple approvals", "Leave and corrections, tracked end to end."]];

export default function Login() {
  const { user, login, loginWithUser, loginWithEmail } = useAuth(), bio = useBiometric(), nav = useNavigate(), loc = useLocation();
  const [id, setId] = useState(""), [pw, setPw] = useState(""), [show, setShow] = useState(false), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;
  const bioLogin = async () => {
    setErr(""); setBusy(true);
    try { await loginWithUser(await bio.verify()); nav(loc.state?.from || "/", { replace: true }); }
    catch (x) { setErr(bioError(x)); setBusy(false); }
  };
  const googleLogin = async ({ email }) => {
    setErr(""); setBusy(true);
    try { await loginWithEmail(email); nav(loc.state?.from || "/", { replace: true }); } catch (x) { setErr(x.message); setBusy(false); }
  };
  const submit = async (e) => {
    e?.preventDefault();
    if (!id.trim() || !pw) return setErr("Enter your employee ID and password.");
    setBusy(true); setErr("");
    try { await login(id, pw); nav(loc.state?.from || "/", { replace: true }); } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden p-14 text-white lg:flex lg:flex-col lg:justify-between" style={{ background: "linear-gradient(150deg,#050B1D,#0A1A4A 55%,#0B3A6E)" }}>
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" /><div className="absolute -bottom-32 left-10 size-96 rounded-full bg-black/20 blur-3xl" />
        <div className="relative flex items-center gap-3 text-xl font-extrabold"><div className="grid size-10 place-items-center rounded-xl bg-white/20 backdrop-blur"><CalendarCheck2 size={20} /></div>Attendance</div>
        <div className="relative">
          <h2 className="max-w-md text-5xl font-extrabold leading-[1.05] tracking-tight">Your workday, tracked without the effort.</h2>
          <ul className="mt-10 space-y-5">
            {POINTS.map(([Icon, t, d], i) => (
              <motion.li key={t} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.12 }} className="flex gap-4">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur"><Icon size={19} /></div>
                <div><p className="font-bold">{t}</p><p className="text-sm text-white/75">{d}</p></div>
              </motion.li>))}
          </ul>
        </div>
        <p className="relative text-sm text-white/60">Version 1.0</p>
      </div>
      <div className="grid place-items-center p-5">
        <motion.form onSubmit={submit} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="glass w-full max-w-sm space-y-5 rounded-3xl p-7">
          <div><h1 className="text-3xl font-extrabold tracking-tight">Welcome back</h1><p className="mt-1 text-sm text-mute">Sign in to start your day.</p></div>
          {bio.enabled && bio.supported && (<>
            <Btn type="button" v="secondary" className="h-14 w-full" icon={Fingerprint} loading={busy} onClick={bioLogin}>Sign in with fingerprint</Btn>
            <div className="flex items-center gap-3 text-xs text-mute"><span className="h-px flex-1 bg-line" />or use password<span className="h-px flex-1 bg-line" /></div>
          </>)}
          <Field label="Employee ID or email"><input className="field" value={id} autoComplete="username" onChange={(e) => setId(e.target.value)} placeholder="EMP001" /></Field>
          <Field label="Password" error={err}>
            <div className="relative">
              <input className="field pr-12" type={show ? "text" : "password"} value={pw} autoComplete="current-password" onChange={(e) => setPw(e.target.value)} />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-lg text-mute hover:bg-line">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </div>
          </Field>
          <Btn type="submit" className="w-full" loading={busy} icon={ArrowRight}>Sign in</Btn>
          {(GOOGLE_CLIENT_ID || import.meta.env.DEV) && <>
            <div className="flex items-center gap-3 text-xs text-mute"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
            <GoogleButton onCredential={googleLogin} onError={(m) => { setErr(m); setBusy(false); }} />
          </>}
          <div className="space-y-2 text-center text-xs text-mute"><p>Demo accounts</p>
            <div className="flex justify-center gap-2">{[["Employee", "EMP001", "demo123"], ["Admin", "ADM001", "admin123"]].map(([l, u, p]) => (
              <button key={l} type="button" onClick={() => { setId(u); setPw(p); setErr(""); }} className="rounded-lg border border-line px-3 py-1.5 font-semibold text-ink hover:bg-line">{l}</button>))}</div></div>
        </motion.form>
      </div>
    </div>
  );
}
