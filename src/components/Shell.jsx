import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Bell, CalendarDays, CheckSquare, ChevronRight, ClipboardList, Command, LayoutDashboard, LogIn, LogOut, Moon, PanelLeftClose, PanelLeftOpen,
  PenLine, Plane, Plus, Search, Sun, User, Users, WifiOff, X } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { useAttendance } from "../lib/attendance";
import { api, fmtHMS } from "../lib/api";
import { Popover, Tooltip, cx } from "./ui";
import CommandPalette from "./CommandPalette";

const EMP_NAV = [
  { to: "/", label: "Dashboard", Icon: LayoutDashboard }, { to: "/history", label: "History", Icon: CalendarDays },
  { to: "/leave", label: "Leave", Icon: Plane }, { to: "/requests", label: "Requests", Icon: ClipboardList }, { to: "/profile", label: "Profile", Icon: User },
];
const ADMIN_NAV = [
  { to: "/", label: "Overview", Icon: LayoutDashboard }, { to: "/approvals", label: "Approvals", Icon: CheckSquare },
  { to: "/employees", label: "Employees", Icon: Users }, { to: "/reports", label: "Reports", Icon: BarChart3 }, { to: "/profile", label: "Profile", Icon: User },
];

function StatusPill() {
  const { state, seconds } = useAttendance();
  if (state === "admin") return null;
  const cfg = { loading: ["var(--mute)", "…"], idle: ["var(--mute)", "Not checked in"], working: ["var(--ok)", fmtHMS(seconds)], done: ["var(--brand)", "Day complete"] }[state];
  return (
    <span className="hidden items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs font-semibold sm:inline-flex" aria-live="off">
      <span className="relative flex size-2">
        {state === "working" && <span className="ping-soft absolute inset-0 rounded-full" style={{ background: cfg[0] }} />}
        <span className="relative size-2 rounded-full" style={{ background: cfg[0] }} />
      </span>
      <span className="tabular-nums">{cfg[1]}</span>
    </span>
  );
}

function Notifications() {
  const [data, setData] = useState({ list: [], count: 0 }), loc = useLocation();
  useEffect(() => { api.notifications().then(setData); }, [loc.pathname]);
  return (
    <Popover trigger={({ toggle }) => (
      <button onClick={toggle} aria-label={`Notifications, ${data.count} pending`} className="relative grid size-10 place-items-center rounded-xl hover:bg-line">
        <Bell size={19} />{data.count > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-bad ring-2 ring-bg" />}
      </button>)}>
      <p className="px-3 pb-2 pt-1 text-sm font-bold">Notifications</p>
      {data.list.length === 0 ? <p className="px-3 pb-4 pt-2 text-sm text-mute">You are all caught up.</p> :
        data.list.slice(0, 5).map((n) => (
          <div key={n.id} className="rounded-xl px-3 py-2.5 hover:bg-line/60"><p className="text-sm font-medium">{n.title}</p><p className="text-xs text-mute">{n.sub}</p></div>))}
    </Popover>
  );
}

function ProfileMenu() {
  const { user, logout } = useAuth(), { toggle: toggleTheme, dark } = useTheme(), nav = useNavigate();
  const item = "flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium hover:bg-line";
  return (
    <Popover trigger={({ toggle }) => (
      <button onClick={toggle} aria-label="Account menu" className="grid size-10 place-items-center rounded-xl btn-primary text-sm font-bold">{user.name[0]}</button>)} width="w-60">
      {(close) => (<>
        <div className="px-3 pb-2 pt-1"><p className="text-sm font-bold">{user.name}</p><p className="text-xs text-mute">{user.id} · {user.role === "admin" ? "Admin" : user.dept}</p></div>
        <div className="my-1 h-px bg-line" />
        <button className={item} onClick={() => { close(); nav("/profile"); }}><User size={16} />Profile</button>
        <button className={item} onClick={toggleTheme}>{dark ? <Sun size={16} /> : <Moon size={16} />}{dark ? "Light mode" : "Dark mode"}</button>
        <button className={cx(item, "text-bad")} onClick={() => { logout(); nav("/login"); }}><LogOut size={16} />Log out</button>
      </>)}
    </Popover>
  );
}

export default function Shell() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("att.nav") === "1");
  const [palette, setPalette] = useState(false), [fab, setFab] = useState(false), [online, setOnline] = useState(navigator.onLine);
  const loc = useLocation(), nav = useNavigate(), att = useAttendance(), theme = useTheme(), { user, logout } = useAuth();
  const isAdmin = user.role === "admin", NAV = isAdmin ? ADMIN_NAV : EMP_NAV, showFab = !isAdmin && loc.pathname !== "/";
  const current = NAV.find((n) => n.to === loc.pathname) || NAV[0];

  useEffect(() => localStorage.setItem("att.nav", collapsed ? "1" : "0"), [collapsed]);
  useEffect(() => { setFab(false); }, [loc.pathname]);
  useEffect(() => {
    const k = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((p) => !p); } };
    const on = () => setOnline(true), off = () => setOnline(false);
    addEventListener("keydown", k); addEventListener("online", on); addEventListener("offline", off);
    return () => { removeEventListener("keydown", k); removeEventListener("online", on); removeEventListener("offline", off); };
  }, []);

  const commands = [
    ...NAV.map((n) => ({ id: n.to, label: `Go to ${n.label}`, group: "Navigate", icon: n.Icon, run: () => nav(n.to) })),
    { id: "in", label: "Check in", group: "Action", icon: LogIn, hidden: att.state !== "idle", run: att.checkIn },
    { id: "out", label: "Check out", group: "Action", icon: LogOut, hidden: att.state !== "working", run: att.checkOut },
    { id: "leave", label: "Apply for leave", group: "Action", icon: Plane, hidden: isAdmin, run: () => nav("/leave") },
    { id: "fix", label: "Request attendance correction", group: "Action", icon: PenLine, hidden: isAdmin, keywords: "missing late", run: () => nav("/history") },
    { id: "theme", label: theme.dark ? "Switch to light mode" : "Switch to dark mode", group: "Preference", icon: theme.dark ? Sun : Moon, run: theme.toggle },
    { id: "logout", label: "Log out", group: "Account", icon: LogOut, run: () => { logout(); nav("/login"); } },
  ];
  const quick = [
    { label: att.state === "working" ? "Check out" : "Check in", Icon: att.state === "working" ? LogOut : LogIn, run: att.state === "working" ? att.checkOut : att.checkIn, off: att.state === "done" || att.state === "loading" },
    { label: "Apply leave", Icon: Plane, run: () => nav("/leave") }, { label: "Request correction", Icon: PenLine, run: () => nav("/history") },
  ];

  return (
    <div className="min-h-dvh">
      <motion.aside animate={{ width: collapsed ? 76 : 244 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="glass fixed inset-y-0 left-0 z-30 hidden flex-col rounded-none border-y-0 border-l-0 p-3 md:flex">
        <div className="mb-6 flex h-12 items-center gap-3 px-2">
          <div className="btn-primary grid size-9 shrink-0 place-items-center rounded-xl"><CalendarDays size={18} /></div>
          {!collapsed && <span className="text-lg font-extrabold tracking-tight">Attendance</span>}
        </div>
        <nav className="flex-1 space-y-1" aria-label="Main">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => cx("relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors", isActive ? "text-ink" : "text-mute hover:bg-line/60 hover:text-ink", collapsed && "justify-center")}>
              {({ isActive }) => (<>
                {isActive && <motion.span layoutId="navbg" className="absolute inset-0 rounded-xl bg-solid shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                {isActive && <span className="absolute left-0 top-2.5 h-6 w-1 rounded-r-full" style={{ background: "linear-gradient(var(--brand),var(--brand-2))" }} />}
                <Tooltip text={collapsed ? label : ""}><Icon size={19} className="relative" /></Tooltip>
                {!collapsed && <span className="relative">{label}</span>}
              </>)}
            </NavLink>
          ))}
        </nav>
        <button onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex min-h-11 items-center justify-center gap-3 rounded-xl text-sm font-semibold text-mute hover:bg-line/60">
          {collapsed ? <PanelLeftOpen size={19} /> : <><PanelLeftClose size={19} />Collapse</>}
        </button>
      </motion.aside>

      <div className={cx("transition-[padding] duration-300", collapsed ? "md:pl-[76px]" : "md:pl-[244px]")}>
        <header className="glass sticky top-0 z-20 flex h-16 items-center gap-3 rounded-none border-x-0 border-t-0 px-4 md:px-8" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
            <Link to="/" className="hidden text-mute hover:text-ink sm:inline">Home</Link><ChevronRight size={14} className="hidden text-mute sm:inline" />
            <span className="font-bold">{current.label}</span>
          </nav>
          <div className="flex-1" />
          <button onClick={() => setPalette(true)} className="hidden h-10 w-64 items-center gap-2 rounded-xl border border-line bg-line/30 px-3 text-sm text-mute hover:bg-line/60 md:flex">
            <Search size={16} />Search or jump to…<kbd className="ml-auto flex items-center gap-0.5 rounded-md border border-line px-1.5 text-[11px]"><Command size={10} />K</kbd>
          </button>
          <button onClick={() => setPalette(true)} aria-label="Open command menu" className="grid size-10 place-items-center rounded-xl hover:bg-line md:hidden"><Search size={19} /></button>
          <StatusPill />
          <button onClick={theme.toggle} aria-label="Toggle theme" className="hidden size-10 place-items-center rounded-xl hover:bg-line sm:grid">{theme.dark ? <Sun size={19} /> : <Moon size={19} />}</button>
          <Notifications /><ProfileMenu />
        </header>

        <AnimatePresence>
          {!online && (
            <motion.div role="status" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <p className="flex items-center justify-center gap-2 bg-warn/20 px-4 py-2 text-sm font-semibold"><WifiOff size={15} />You are offline. Reconnect to check in or send requests.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-6 md:px-8 md:pb-12">
          <motion.div key={loc.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}><Outlet /></motion.div>
        </main>
      </div>

      {/* Mobile: floating action button + sticky nav */}
      <div className="md:hidden">
        <AnimatePresence>
          {fab && showFab && (<>
            <motion.div className="fixed inset-0 z-30 bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFab(false)} />
            <motion.ul className="fixed bottom-40 right-4 z-40 space-y-2" initial="h" animate="s" exit="h" variants={{ s: { transition: { staggerChildren: 0.05 } }, h: {} }}>
              {quick.map((q) => (
                <motion.li key={q.label} variants={{ h: { opacity: 0, y: 12 }, s: { opacity: 1, y: 0 } }} className="flex justify-end">
                  <button disabled={q.off} onClick={() => { setFab(false); q.run(); }} className="glass-strong flex min-h-11 items-center gap-3 rounded-2xl px-4 text-sm font-semibold disabled:opacity-40"><q.Icon size={17} />{q.label}</button>
                </motion.li>))}
            </motion.ul>
          </>)}
        </AnimatePresence>
        {showFab && <motion.button whileTap={{ scale: 0.92 }} onClick={() => setFab(!fab)} aria-label="Quick actions" aria-expanded={fab}
          className="btn-primary fixed bottom-[88px] right-4 z-40 grid size-14 place-items-center rounded-2xl" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
          <motion.span animate={{ rotate: fab ? 45 : 0 }}>{fab ? <X size={22} /> : <Plus size={24} />}</motion.span>
        </motion.button>}
        <nav aria-label="Main" className="glass fixed inset-x-3 bottom-3 z-30 flex rounded-2xl p-1.5" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
          {NAV.slice(0, 4).map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} className="relative flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold">
              {({ isActive }) => (<>
                {isActive && <motion.span layoutId="mnav" className="absolute inset-0 rounded-xl bg-solid shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                <Icon size={19} className={cx("relative", isActive ? "text-brand" : "text-mute")} /><span className={cx("relative", isActive ? "text-ink" : "text-mute")}>{label}</span>
              </>)}
            </NavLink>))}
        </nav>
      </div>

      <AnimatePresence>{palette && <CommandPalette commands={commands} onClose={() => setPalette(false)} />}</AnimatePresence>
    </div>
  );
}
