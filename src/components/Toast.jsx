import { useEffect } from "react";

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors =
    type === "success"
      ? "bg-green-500/15 border-green-500/30 text-green-400"
      : "bg-red-500/15 border-red-500/30 text-red-400";

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-slideIn">
      <div
        className={`border rounded-xl px-5 py-3.5 text-sm font-medium shadow-lg max-w-[340px] ${colors}`}
      >
        {message}
      </div>
    </div>
  );
}
