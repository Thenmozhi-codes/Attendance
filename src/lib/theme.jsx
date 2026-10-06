import { createContext, useContext, useEffect, useState } from "react";
const Ctx = createContext(null);
export const useTheme = () => useContext(Ctx);
export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem("att.theme") || "dark");
  const [sys, setSys] = useState(() => matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)"), f = (e) => setSys(e.matches);
    mq.addEventListener("change", f); return () => mq.removeEventListener("change", f);
  }, []);
  const dark = mode === "dark" || (mode === "system" && sys);
  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; localStorage.setItem("att.theme", mode); }, [dark, mode]);
  return <Ctx.Provider value={{ mode, setMode, dark, toggle: () => setMode(dark ? "light" : "dark") }}>{children}</Ctx.Provider>;
}
