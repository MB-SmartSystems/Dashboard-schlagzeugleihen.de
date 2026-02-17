import { useEffect } from "react";

export default function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-[420px] animate-fadeIn">
        {title && (
          <div className="text-lg font-semibold mb-4">{title}</div>
        )}
        {children}
        {footer && <div className="mt-5 flex gap-3 justify-end">{footer}</div>}
      </div>
    </div>
  );
}
