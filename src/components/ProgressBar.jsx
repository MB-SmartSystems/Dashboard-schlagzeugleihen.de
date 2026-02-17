export default function ProgressBar({ percent }) {
  let color = "bg-green-400";
  if (percent > 85) color = "bg-red-400";
  else if (percent > 65) color = "bg-yellow-400";

  return (
    <div>
      <div className="mt-3.5 bg-white/5 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <div className="text-[0.7rem] text-gray-500 mt-1 text-right">
        {percent}% der Mindestlaufzeit
      </div>
    </div>
  );
}
