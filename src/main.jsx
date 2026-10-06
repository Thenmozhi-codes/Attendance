import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import App from "./App.jsx";
import { ThemeProvider } from "./lib/theme";
import { ToastProvider } from "./lib/toast";
import { BiometricProvider } from "./lib/biometric";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <MotionConfig reducedMotion="user">
    <ThemeProvider><ToastProvider><BiometricProvider><BrowserRouter><App /></BrowserRouter></BiometricProvider></ToastProvider></ThemeProvider>
  </MotionConfig>
);

if ("serviceWorker" in navigator && import.meta.env.PROD) addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
