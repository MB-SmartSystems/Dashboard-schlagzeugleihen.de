export default function Tab({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
        active
          ? "bg-orange-500/20 text-orange-400"
          : "text-gray-500 hover:text-gray-300"
      }`}
    >
      {label}
      {count !== undefined && (
        <span
          className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[0.7rem] font-bold ml-1.5 ${
            active
              ? "bg-white/20 text-orange-300"
              : "bg-orange-500/15 text-orange-400"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
