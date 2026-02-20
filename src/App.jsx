import { useState, useEffect } from "react";
import PinScreen from "./components/PinScreen";
import DashboardLayout from "./components/DashboardLayout";

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/auth/check", { credentials: "same-origin" })
      .then((res) => {
        if (res.ok) setAuthed(true);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    const handleExpired = () => setAuthed(false);
    window.addEventListener("session-expired", handleExpired);
    return () => window.removeEventListener("session-expired", handleExpired);
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return <PinScreen onAuth={() => setAuthed(true)} />;
  }

  return <DashboardLayout />;
}
