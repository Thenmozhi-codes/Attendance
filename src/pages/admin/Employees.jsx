import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Copy, Pencil, UserCheck, UserPlus, UserX } from "lucide-react";
import { DEPTS, MAX_USERS, api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../lib/toast";
import { Avatar, Btn, Card, Confirm, Field, PageHeader, Segmented, Sheet, Skeleton } from "../../components/ui";

export default function Employees() {
  const toast = useToast(), { user } = useAuth();
  const [list, setList] = useState(null), [add, setAdd] = useState(false), [edit, setEdit] = useState(null), [target, setTarget] = useState(null), [created, setCreated] = useState(null);
  const load = () => api.users().then(setList);
  useEffect(() => { load(); }, []);
  const full = (list?.length ?? 0) >= MAX_USERS;

  return (
    <div className="space-y-5">
      <PageHeader title="Employees" subtitle={`${list?.length ?? "–"} of ${MAX_USERS} user accounts used`} actions={<Btn icon={UserPlus} disabled={!list || full} onClick={() => setAdd(true)}>{full ? "User limit reached" : "Add user"}</Btn>} />
      <Card className="!p-4"><div className="h-2 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${((list?.length ?? 0) / MAX_USERS) * 100}%`, background: "linear-gradient(90deg,var(--brand),var(--brand-2))" }} /></div></Card>
      {!list ? <Skeleton className="h-72" /> : (
        <Card className="overflow-hidden !p-0">
          <table className="hidden w-full text-sm md:table">
            <thead className="border-b border-line text-left text-xs text-mute"><tr>{["Name", "ID", "Department", "Role", "Status", ""].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody>{list.map((u) => (
              <tr key={u.id} className="border-b border-line/60 last:border-0 hover:bg-line/30">
                <td className="px-5 py-3"><div className="flex items-center gap-3"><Avatar name={u.name} /><div><p className="font-semibold">{u.name}</p><p className="text-xs text-mute">{u.email}</p></div></div></td>
                <td className="px-5 tabular-nums">{u.id}</td><td className="px-5 text-mute">{u.dept}</td>
                <td className="px-5"><span className="rounded-full bg-brand/15 px-2.5 py-1 text-xs font-semibold capitalize text-brand">{u.role}</span></td>
                <td className="px-5"><span className={u.active ? "text-ok" : "text-mute"}>{u.active ? "Active" : "Disabled"}</span></td>
                <td className="px-5 text-right"><Btn v="ghost" aria-label={`Edit ${u.name}`} onClick={() => setEdit(u)}><Pencil size={16} /></Btn>{u.id !== user.id && <Btn v="ghost" icon={u.active ? UserX : UserCheck} onClick={() => setTarget(u)}>{u.active ? "Disable" : "Enable"}</Btn>}</td>
              </tr>))}</tbody>
          </table>
          <ul className="divide-y divide-line md:hidden">{list.map((u) => (
            <li key={u.id} className="flex items-center gap-3 p-4"><Avatar name={u.name} />
              <div className="min-w-0 flex-1"><p className="truncate font-semibold">{u.name}</p><p className="text-xs text-mute">{u.id} · {u.dept} · {u.role}</p><p className={`text-xs font-semibold ${u.active ? "text-ok" : "text-mute"}`}>{u.active ? "Active" : "Disabled"}</p></div>
              {<Btn v="ghost" aria-label={`Edit ${u.name}`} onClick={() => setEdit(u)}><Pencil size={17} /></Btn>}{u.id !== user.id && <Btn v="secondary" aria-label={u.active ? "Disable" : "Enable"} onClick={() => setTarget(u)}>{u.active ? <UserX size={17} /> : <UserCheck size={17} />}</Btn>}</li>))}</ul>
        </Card>)}
      <AnimatePresence>
        {edit && <UserForm initial={edit} onClose={() => setEdit(null)} onDone={() => { setEdit(null); load(); toast.success("Details updated"); }} />}
        {add && <UserForm onClose={() => setAdd(false)} onDone={(u) => { setAdd(false); setCreated(u); load(); toast.success("User added", `${u.name} can now sign in.`); }} />}
        {created && <Sheet title="Account created" onClose={() => setCreated(null)}>
          <p className="mb-4 text-sm text-mute">Share these sign-in details with {created.name}.</p>
          <dl className="space-y-2 rounded-xl bg-line/40 p-4 text-sm"><div className="flex justify-between"><dt className="text-mute">User ID</dt><dd className="font-bold">{created.id}</dd></div><div className="flex justify-between"><dt className="text-mute">Temporary password</dt><dd className="font-bold">{created.pw}</dd></div></dl>
          <Btn className="mt-4 w-full" icon={Copy} onClick={async () => { try { await navigator.clipboard.writeText(`ID: ${created.id}\nPassword: ${created.pw}`); toast.info("Copied to clipboard"); } catch { toast.error("Could not copy", "Select and copy the details manually."); } }}>Copy details</Btn>
        </Sheet>}
        {target && <Confirm title={target.active ? "Disable this account?" : "Enable this account?"} danger={target.active} confirmLabel={target.active ? "Disable" : "Enable"}
          text={target.active ? `${target.name} will no longer be able to sign in. Their attendance history is kept.` : `${target.name} will be able to sign in again.`}
          onClose={() => setTarget(null)} onConfirm={async () => { try { await api.setActive(target.id, !target.active); toast.success(target.active ? "Account disabled" : "Account enabled"); load(); } catch (e) { toast.error("Could not update", e.message); } }} />}
      </AnimatePresence>
    </div>
  );
}

function UserForm({ initial, onClose, onDone }) {
  const [f, setF] = useState({ name: initial?.name || "", dept: initial?.dept || DEPTS[0], role: initial?.role || "employee", email: initial?.email || "" }), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const submit = async () => {
    if (f.name.trim().length < 3) return setErr("Enter the person's full name.");
    setBusy(true); try { onDone(initial ? await api.updateUser(initial.id, f) : await api.addUser(f)); } catch (e) { setErr(e.message); setBusy(false); }
  };
  return (
    <Sheet title={initial ? "Edit user" : "Add user"} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Full name"><input className="field" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Ravi Shankar" /></Field>
        <Field label="Email (used for Google sign-in)" error={err}><input type="email" className="field" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="name@gmail.com" /></Field>
        <Field label="Department"><select className="field" value={f.dept} onChange={(e) => setF({ ...f, dept: e.target.value })}>{DEPTS.map((d) => <option key={d}>{d}</option>)}</select></Field>
        {!initial && <Field label="Role"><Segmented label="Role" value={f.role} onChange={(role) => setF({ ...f, role })} options={[{ value: "employee", label: "Employee" }, { value: "admin", label: "Admin" }]} /></Field>}
        <Btn className="w-full" loading={busy} onClick={submit}>{initial ? "Save changes" : "Create account"}</Btn>
      </div>
    </Sheet>
  );
}
