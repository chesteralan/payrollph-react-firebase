import { clsx } from "clsx";
import { CheckCircle, XCircle } from "lucide-react";
import { useMemo } from "react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface Rule {
  label: string;
  test: (pw: string) => boolean;
}

const RULES: Rule[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "Contains uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Contains lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "Contains a number", test: (pw) => /\d/.test(pw) },
  { label: "Contains special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const checks = useMemo(
    () => RULES.map((rule) => ({ ...rule, passed: rule.test(password) })),
    [password],
  );
  const score = checks.filter((c) => c.passed).length;
  const pct = (score / RULES.length) * 100;

  const barColor =
    pct <= 20
      ? "bg-red-500"
      : pct <= 40
        ? "bg-orange-500"
        : pct <= 60
          ? "bg-yellow-500"
          : pct <= 80
            ? "bg-blue-500"
            : "bg-green-500";

  const label =
    pct <= 20 ? "Weak" : pct <= 40 ? "Fair" : pct <= 60 ? "Good" : pct <= 80 ? "Strong" : "Very Strong";

  if (!password) return null;

  return (
    <div className="space-y-2 mt-1">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={clsx("h-full rounded-full transition-all", barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-500 min-w-12 text-right">
          {label}
        </span>
      </div>
      <ul className="space-y-0.5">
        {checks.map((check) => (
          <li
            key={check.label}
            className="flex items-center gap-1.5 text-xs"
          >
            {check.passed ? (
              <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
            ) : (
              <XCircle className="w-3 h-3 text-gray-300 shrink-0" />
            )}
            <span
              className={check.passed ? "text-green-700" : "text-gray-400"}
            >
              {check.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
