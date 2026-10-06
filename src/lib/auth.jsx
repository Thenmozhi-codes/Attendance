import { createContext, useContext, useState } from "react";
import { api } from "./api";
const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(api.me());
  const login = async (id, pw) => setUser(await api.login(id, pw));
  const loginWithEmail = async (email) => setUser(await api.loginWithEmail(email));
  const loginWithUser = async (u) => setUser(await api.setUser(u));
  const logout = () => { api.logout(); setUser(null); };
  return <Ctx.Provider value={{ user, login, loginWithUser, loginWithEmail, logout }}>{children}</Ctx.Provider>;
}
