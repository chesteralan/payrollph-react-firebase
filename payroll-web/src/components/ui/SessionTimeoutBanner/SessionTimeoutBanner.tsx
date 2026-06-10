import { useState, useEffect, useCallback } from "react";
import { Clock, RefreshCw, LogOut } from "lucide-react";
import { Button } from "../Button";

interface SessionTimeoutBannerProps {
  timeoutMs?: number;
  warningMs?: number;
  onExtend: () => void;
  onLogout: () => void;
}

export function SessionTimeoutBanner({
  timeoutMs = 30 * 60 * 1000,
  warningMs = 60 * 1000,
  onExtend,
  onLogout,
}: SessionTimeoutBannerProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const resetTimer = useCallback(() => {
    setTimeLeft(null);
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const timeout = setTimeout(() => {
      setTimeLeft(warningMs);
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1000) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }, timeoutMs - warningMs);

    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((ev) => document.addEventListener(ev, resetTimer));

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      events.forEach((ev) => document.removeEventListener(ev, resetTimer));
    };
  }, [timeoutMs, warningMs, resetTimer]);

  if (timeLeft === null || timeLeft <= 0) return null;

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-white border border-yellow-200 rounded-xl shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-yellow-100 shrink-0">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">
              Session expiring
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Your session will expire in{" "}
              <span className="font-medium text-yellow-700">
                {minutes}:{seconds.toString().padStart(2, "0")}
              </span>
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" onClick={onExtend}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Stay signed in
              </Button>
              <Button size="sm" variant="ghost" onClick={onLogout}>
                <LogOut className="w-3.5 h-3.5 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
