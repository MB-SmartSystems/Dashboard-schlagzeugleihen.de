const colorMap = {
  green: "text-green-400",
  red: "text-red-400",
  yellow: "text-yellow-400",
  blue: "text-blue-400",
  orange: "text-orange-400",
  purple: "text-purple-400",
  white: "text-gray-100",
};

export default function StatCard({ label, value, color = "white" }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 min-w-[140px] flex-1">
      <div className="text-[0.75rem] text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </div>
      <div className={`text-2xl font-bold font-mono ${colorMap[color] || colorMap.white}`}>
        {value}
      </div>
    </div>
  );
}
