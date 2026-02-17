import { useState, useRef } from "react";

export default function PinScreen({ onAuth }) {
  const [error, setError] = useState(false);
  const inputRef = useRef(null);

  const check = () => {
    const val = inputRef.current.value;
    if (val === import.meta.env.VITE_PIN) {
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
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") check();
    if (error) setError(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 animate-fadeIn">
      <div className="font-mono text-lg font-bold text-orange-400 tracking-tight mb-2">
        schlagzeugleihen.de
      </div>
      <div className="text-sm text-gray-500 mb-8">Dashboard Login</div>
      <input
        ref={inputRef}
        type="password"
        placeholder="PIN eingeben"
        autoComplete="off"
        onKeyDown={handleKeyDown}
        className={`bg-gray-900 border text-gray-100 font-sans text-base px-5 py-3.5 rounded-xl w-[280px] text-center outline-none transition-all ${
          error
            ? "border-red-500 animate-shake"
            : "border-gray-800 focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(240,136,62,0.15)]"
        }`}
      />
      <button
        onClick={check}
        className="mt-4 bg-orange-500 text-white font-semibold text-[0.95rem] py-3 px-8 rounded-xl w-[280px] hover:opacity-85 transition-opacity"
      >
        Anmelden
      </button>
    </div>
  );
}
