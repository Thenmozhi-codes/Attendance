import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Building2, Fingerprint, IdCard, LogOut, Mail, Monitor, Moon, ShieldCheck, Sun } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { Btn, Card, Confirm, Item, PageHeader, Segmented, Stagger, Switch } from "../components/ui";
import { bioError, useBiometric } from "../lib/biometric";
import { useToast } from "../lib/toast";

export default function Profile() {
  const { user, logout } = useAuth(), { mode, setMode } = useTheme(), nav = useNavigate(), [ask, setAsk] = useState(false), bio = useBiometric(), toast = useToast(), [busy, setBusy] = useState(false);
  const toggleBio = async (on) => {
    if (!on) { bio.disable(); return toast.info("Fingerprint turned off"); }
    setBusy(true);
    try { await bio.enable(user); toast.success("Fingerprint enabled", "You can now sign in with your fingerprint."); }
    catch (e) { toast.error("Could not enable fingerprint", bioError(e)); }
    finally { setBusy(false); }
  };
  const rows = [[IdCard, "Employee ID", user.id], [Building2, "Department", user.dept], [Mail, "Email", user.email]];
  return (
    <Stagger className="space-y-5">
      <Item><PageHeader title="Profile" subtitle="Your details and preferences." /></Item>
      <Item><Card className="overflow-hidden !p-0">
        <div className="h-28" style={{ background: "linear-gradient(120deg,var(--brand),var(--brand-2))" }} />
        <div className="-mt-10 flex items-end gap-4 px-6 pb-6">
          <div className="btn-primary grid size-20 place-items-center rounded-3xl border-4 border-solid text-3xl font-extrabold">{user.name[0]}</div>
          <div className="pb-1"><p className="text-xl font-extrabold">{user.name}</p><p className="text-sm text-mute">{user.dept}</p></div>
        </div>
      </Card></Item>
      <Item className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2">
        <Card><h2 className="mb-2 font-bold">Details</h2><dl className="divide-y divide-line">
          {rows.map(([I, k, v]) => <div key={k} className="flex items-center gap-3 py-3.5"><I size={18} className="text-mute" /><dt className="text-sm text-mute">{k}</dt><dd className="ml-auto text-sm font-semibold">{v}</dd></div>)}</dl></Card>
        <Card className="space-y-5"><h2 className="font-bold">Preferences</h2>
          <div><p className="mb-2 text-sm font-semibold">Appearance</p>
            <Segmented label="Theme" value={mode} onChange={setMode} options={[{ value: "light", label: "Light", icon: <Sun size={15} /> }, { value: "dark", label: "Dark", icon: <Moon size={15} /> }, { value: "system", label: "System", icon: <Monitor size={15} /> }]} /></div>
          <Btn v="secondary" className="w-full !text-bad" icon={LogOut} onClick={() => setAsk(true)}>Log out</Btn>
        </Card>
      </Item>
      <Item><Card>
        <h2 className="mb-1 flex items-center gap-2 font-bold"><ShieldCheck size={18} className="text-brand" />Security</h2>
        {!bio.supported ? <p className="py-3 text-sm text-mute">Fingerprint is not available on this device or browser. It needs a fingerprint or screen lock set up, and an https connection.</p> : (
          <div className="divide-y divide-line">
            <Switch checked={bio.enabled} disabled={busy} onChange={toggleBio} label="Fingerprint sign-in" hint="Unlock the app with your fingerprint instead of a password." />
            <Switch checked={bio.requireCheckIn} disabled={!bio.enabled} onChange={bio.setRequire} label="Require fingerprint to check in or out" hint="Confirm every check-in and check-out with your fingerprint." />
          </div>)}
      </Card></Item>
      <AnimatePresence>{ask && <Confirm title="Log out?" text="You will need to sign in again to check in." confirmLabel="Log out" danger onClose={() => setAsk(false)} onConfirm={() => { logout(); nav("/login"); }} />}</AnimatePresence>
    </Stagger>
  );
}
