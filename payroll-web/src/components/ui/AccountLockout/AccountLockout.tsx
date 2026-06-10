import { clsx } from "clsx";
import { Lock, AlertTriangle } from "lucide-react";
import { useMemo } from "react";

interface AccountLockoutProps {
  remainingAttempts: number;
  lockedUntil?: Date;
  className?: string;
}

export function AccountLockout({
  remainingAttempts,
  lockedUntil,
  className,
}: AccountLockoutProps) {
  const now = useMemo(() => new Date(), []);

  if (lockedUntil && lockedUntil > now) {
    const minutes = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000);
    return (
      <div className={clsx("flex flex-col items-center py-8 px-4 text-center", className)}>
        <div className="p-3 rounded-full bg-red-100 mb-4">
          <Lock className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Account Locked</h3>
        <p className="text-sm text-gray-500 max-w-xs">
          Too many failed attempts. Try again in {minutes} minute{minutes !== 1 ? "s" : ""}.
        </p>
      </div>
    );
  }

  if (remainingAttempts <= 3) {
    return (
      <div className={clsx("flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm", className)}>
        <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
        <span className="text-yellow-700">
          {remainingAttempts} attempt{remainingAttempts !== 1 ? "s" : ""} remaining before lockout
        </span>
      </div>
    );
  }

  return null;
}
