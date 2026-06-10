import { useState, useCallback } from "react";

interface LeaveBalance {
  total: number;
  used: number;
  remaining: number;
  carryOver: number;
}

export function useLeaveBalance(initialTotal = 15) {
  const [balance, setBalance] = useState<LeaveBalance>({
    total: initialTotal,
    used: 0,
    remaining: initialTotal,
    carryOver: 0,
  });

  const applyLeave = useCallback(
    (days: number) => {
      setBalance((prev) => {
        const newUsed = prev.used + days;
        return {
          ...prev,
          used: newUsed,
          remaining: prev.total + prev.carryOver - newUsed,
        };
      });
    },
    [],
  );

  const setCarryOver = useCallback((days: number) => {
    setBalance((prev) => ({
      ...prev,
      carryOver: days,
      remaining: prev.total + days - prev.used,
    }));
  }, []);

  const reset = useCallback(
    (newTotal: number) => {
      setBalance({
        total: newTotal,
        used: 0,
        remaining: newTotal + balance.carryOver,
        carryOver: balance.carryOver,
      });
    },
    [balance.carryOver],
  );

  return { balance, applyLeave, setCarryOver, reset };
}
