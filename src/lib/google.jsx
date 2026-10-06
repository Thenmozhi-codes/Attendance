import { useEffect, useRef } from "react";
import { useTheme } from "./theme";
// Google Sign-In (Google Identity Services). Set VITE_GOOGLE_CLIENT_ID in .env / Vercel.
// NOTE: the ID token is decoded in the browser here. In production, send `credential` to your
// server and verify its signature with Google before creating a session.
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const loadGsi = () => new Promise((res, rej) => {
  if (window.google?.accounts?.id) return res();
  const s = document.createElement("script");
  s.src = "https://accounts.google.com/gsi/client"; s.async = true; s.onload = res;
  s.onerror = () => rej(new Error("Could not load Google sign-in. Check your connection."));
  document.head.appendChild(s);
});

export function decodeCredential(jwt, clientId = GOOGLE_CLIENT_ID) {
  const b64 = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const p = JSON.parse(decodeURIComponent(atob(b64).split("").map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")));
  if (p.aud !== clientId) throw new Error("This Google token was issued for a different app.");
  if (p.exp * 1000 < Date.now()) throw new Error("Google sign-in expired. Please try again.");
  if (!p.email_verified) throw new Error("Your Google email is not verified.");
  return { email: p.email, name: p.name };
}

export function GoogleButton({ onCredential, onError }) {
  const ref = useRef(), cb = useRef({}), { dark } = useTheme();
  cb.current = { onCredential, onError };
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let dead = false;
    loadGsi().then(() => {
      if (dead) return;
      window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, ux_mode: "popup",
        callback: (r) => { try { cb.current.onCredential(decodeCredential(r.credential)); } catch (e) { cb.current.onError(e.message); } } });
      window.google.accounts.id.renderButton(ref.current, { theme: dark ? "filled_black" : "outline", size: "large", shape: "pill", text: "continue_with", width: Math.min(400, ref.current.offsetWidth || 320) });
    }).catch((e) => cb.current.onError(e.message));
    return () => { dead = true; };
  }, [dark]);
  if (!GOOGLE_CLIENT_ID) return import.meta.env.DEV ? <p className="rounded-xl border border-dashed border-line p-3 text-center text-xs text-mute">Google sign-in is off. Add VITE_GOOGLE_CLIENT_ID to a .env file (see .env.example).</p> : null;
  return <div ref={ref} className="flex min-h-11 w-full justify-center" />;
}
