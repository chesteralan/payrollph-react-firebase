import { useMemo } from "react";

interface EmployeeDay {
  date: Date;
  type: "working" | "holiday" | "special" | "weekend" | "workday";
  hoursWorked: number;
}

export function useHolidayPremiumPay() {
  const calculatePremium = useMemo(
    () => (days: EmployeeDay[], regularRate: number) => {
      let totalPremium = 0;
      const details: { date: string; type: string; premium: number }[] = [];

      for (const day of days) {
        let multiplier = 1;
        if (day.type === "holiday") {
          multiplier = day.hoursWorked > 0 ? 2 : 1; // 200% for worked holiday
        } else if (day.type === "special") {
          multiplier = day.hoursWorked > 0 ? 1.3 : 1; // 130% for special
        } else if (day.type === "workday" && day.hoursWorked > 0) {
          multiplier = 1; // rest day work
        }
        const premium = regularRate * (multiplier - 1);
        totalPremium += premium;
        details.push({
          date: day.date.toLocaleDateString(),
          type: day.type,
          premium,
        });
      }

      return { totalPremium, details };
    },
    [],
  );

  return { calculatePremium };
}
