import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { Clock, AlertTriangle } from "lucide-react";

interface DeadlineCountdownProps {
  targetDate: Date;
  label: string;
  variant?: "blue" | "yellow" | "red";
  onDeadlinePassed?: () => void;
}

export function DeadlineCountdown({
  targetDate,
  label,
  variant = "blue",
  onDeadlinePassed,
}: DeadlineCountdownProps) {
  const [remaining, setRemaining] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const diff = targetDate.getTime() - now;
      if (diff <= 0) {
        setRemaining("Overdue");
        setExpired(true);
        onDeadlinePassed?.();
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      if (days > 0) setRemaining(`${days}d ${hours}h`);
      else setRemaining(`${hours}h`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [targetDate, onDeadlinePassed]);

  const variantStyles = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    red: "bg-red-50 border-red-200 text-red-700",
  };

  return (
    <div
      className={clsx(
        "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm",
        variantStyles[variant],
      )}
    >
      {expired ? (
        <AlertTriangle className="w-4 h-4 shrink-0" />
      ) : (
        <Clock className="w-4 h-4 shrink-0" />
      )}
      <div>
        <span className="font-medium">{remaining}</span>
        <span className="ml-1 text-xs opacity-75">{label}</span>
      </div>
    </div>
  );
}
