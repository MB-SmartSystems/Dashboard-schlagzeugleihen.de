import { useState } from "react";
import PinScreen from "./components/PinScreen";
import DashboardLayout from "./components/DashboardLayout";

export default function App() {
  const [authed, setAuthed] = useState(false);

  if (!authed) {
    return <PinScreen onAuth={() => setAuthed(true)} />;
  }

  return <DashboardLayout />;
}
