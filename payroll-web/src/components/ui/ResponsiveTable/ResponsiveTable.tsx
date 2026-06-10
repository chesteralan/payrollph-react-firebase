import { clsx } from "clsx";
import type { ReactNode } from "react";

interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
  breakpoint?: "md" | "lg" | "xl";
}

export function ResponsiveTable({
  children,
  className,
  breakpoint = "md",
}: ResponsiveTableProps) {
  const breakClass =
    breakpoint === "md"
      ? "max-md:block"
      : breakpoint === "lg"
        ? "max-lg:block"
        : "max-xl:block";

  return (
    <div className={clsx("overflow-x-auto", className)}>
      <div className={`${breakClass} hidden`}>
        <p className="text-sm text-gray-500 py-4 text-center">
          Scroll horizontally to view full table
        </p>
      </div>
      <table className="w-full min-w-[600px]">{children}</table>
    </div>
  );
}

interface ResponsiveFormProps {
  children: ReactNode;
  columns?: 1 | 2;
  className?: string;
}

export function ResponsiveForm({
  children,
  columns = 2,
  className,
}: ResponsiveFormProps) {
  return (
    <div
      className={clsx(
        "grid gap-4",
        columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
        className,
      )}
    >
      {children}
    </div>
  );
}
