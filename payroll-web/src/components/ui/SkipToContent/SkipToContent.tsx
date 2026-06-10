import { clsx } from "clsx";

interface SkipToContentProps {
  className?: string;
}

export function SkipToContent({ className }: SkipToContentProps) {
  return (
    <a
      href="#main-content"
      className={clsx(
        "sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium",
        className,
      )}
    >
      Skip to main content
    </a>
  );
}
