import { createContext, useContext, useEffect, useState } from "react";
// Fingerprint / Face / screen-lock via WebAuthn (platform authenticator). Needs https or localhost.
// NOTE: assertions are verified on the device only. In production, send the credential
// to your server and verify the signature there before trusting it.
const KEY = "att.bio";
const Ctx = createContext(null);
export const useBiometric = () => useContext(Ctx);

const rand = (n) => crypto.getRandomValues(new Uint8Array(n));
const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64 = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; } };

export function BiometricProvider({ children }) {
  const [data, setData] = useState(read), [supported, setSupported] = useState(false);
  useEffect(() => {
    (async () => {
      try { setSupported(!!window.PublicKeyCredential && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()); }
      catch { setSupported(false); }
    })();
  }, []);
  const save = (d) => { d ? localStorage.setItem(KEY, JSON.stringify(d)) : localStorage.removeItem(KEY); setData(d); };

  const verify = async () => {
    if (!data) throw new Error("Fingerprint is not set up on this device.");
    const cred = await navigator.credentials.get({ publicKey: { challenge: rand(32), timeout: 60000, userVerification: "required",
      allowCredentials: [{ type: "public-key", id: fromB64(data.credId), transports: ["internal"] }] } });
    if (!cred) throw new Error("Fingerprint was not verified.");
    return data.user;
  };
  const enable = async (user) => {
    const cred = await navigator.credentials.create({ publicKey: { challenge: rand(32), timeout: 60000,
      rp: { name: "Attendance" }, user: { id: new TextEncoder().encode(user.id), name: user.id, displayName: user.name },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "preferred" } } });
    if (!cred) throw new Error("Could not set up fingerprint.");
    save({ credId: toB64(cred.rawId), user, requireCheckIn: false });
  };
  const disable = () => save(null);
  const setRequire = (v) => data && save({ ...data, requireCheckIn: v });

  return <Ctx.Provider value={{ supported, enabled: !!data, requireCheckIn: !!data?.requireCheckIn, verify, enable, disable, setRequire }}>{children}</Ctx.Provider>;
}
export const bioError = (e) => e?.name === "NotAllowedError" ? "Fingerprint was cancelled or not recognised." : e?.name === "InvalidStateError" ? "This device is already registered." : e?.message || "Fingerprint failed.";
