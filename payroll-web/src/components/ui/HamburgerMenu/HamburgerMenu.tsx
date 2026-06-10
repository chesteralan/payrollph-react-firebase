import { Menu, X } from "lucide-react";
import { clsx } from "clsx";

interface HamburgerMenuProps {
  open: boolean;
  onToggle: () => void;
  className?: string;
}

export function HamburgerMenu({
  open,
  onToggle,
  className,
}: HamburgerMenuProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={clsx(
        "lg:hidden p-2 rounded-lg transition-colors",
        open
          ? "bg-primary-100 text-primary-600"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
        className,
      )}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
    >
      {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
    </button>
  );
}
