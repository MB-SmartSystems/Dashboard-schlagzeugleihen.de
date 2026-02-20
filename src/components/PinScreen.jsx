import { useState, useRef } from "react";

export default function PinScreen({ onAuth }) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const check = async () => {
    const val = inputRef.current.value;
    if (!val) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ pin: val }),
      });
      if (res.ok) {
        onAuth();
      } else {
        setError(true);
        inputRef.current.value = "";
        inputRef.current.placeholder = "Falscher PIN";
        setTimeout(() => {
          setError(false);
          if (inputRef.current) inputRef.current.placeholder = "PIN eingeben";
        }, 1500);
      }
    } catch {
      setError(true);
      inputRef.current.value = "";
      inputRef.current.placeholder = "Netzwerkfehler";
      setTimeout(() => {
        setError(false);
        if (inputRef.current) inputRef.current.placeholder = "PIN eingeben";
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") check();
    if (error) setError(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 animate-fadeIn">
      <div className="font-mono text-lg font-bold text-accent tracking-tight mb-2">
        schlagzeugleihen.de
      </div>
      <div className="text-sm text-gray-500 mb-8">Dashboard Login</div>
      <input
        ref={inputRef}
        type="password"
        placeholder="PIN eingeben"
        autoComplete="off"
        onKeyDown={handleKeyDown}
        disabled={loading}
        className={`bg-gray-900 border text-gray-100 font-sans text-base px-5 py-3.5 rounded-xl w-[280px] text-center outline-none transition-all ${
          error
            ? "border-red-500 animate-shake"
            : "border-gray-800 focus:border-accent focus:shadow-[0_0_0_3px_rgba(10,144,98,0.15)]"
        }`}
      />
      <button
        onClick={check}
        disabled={loading}
        className="mt-4 bg-accent text-white font-semibold text-[0.95rem] py-3 px-8 rounded-xl w-[280px] hover:opacity-85 transition-opacity disabled:opacity-50"
      >
        {loading ? "Wird geprüft..." : "Anmelden"}
      </button>
    </div>
  );
}
