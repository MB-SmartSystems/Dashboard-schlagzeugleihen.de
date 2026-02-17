export default function DetailRow({ label, value, mono = false, children }) {
  return (
    <div className="flex flex-col">
      <span className="text-[0.7rem] text-gray-500 uppercase tracking-wide">
        {label}
      </span>
      {children || (
        <span className={`text-sm font-medium mt-0.5 ${mono ? "font-mono text-[0.85rem]" : ""}`}>
          {value}
        </span>
      )}
    </div>
  );
}
