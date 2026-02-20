const colorMap = {
  green: "bg-green-500/15 text-green-400",
  red: "bg-red-500/15 text-red-400",
  yellow: "bg-yellow-500/15 text-yellow-400",
  blue: "bg-blue-500/15 text-blue-400",
  accent: "bg-accent/15 text-accent",
  purple: "bg-purple-500/15 text-purple-400",
  gray: "bg-gray-500/15 text-gray-400",
};

export default function Badge({ children, color = "gray" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[0.7rem] font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full whitespace-nowrap ${colorMap[color] || colorMap.gray}`}
    >
      {children}
    </span>
  );
}
