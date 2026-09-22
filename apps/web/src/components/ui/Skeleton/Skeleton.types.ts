export interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  lines?: number;
  animation?: "pulse" | "wave" | "none";
}

export interface CardSkeletonProps {
  lines?: number;
  showHeader?: boolean;
  className?: string;
}

export interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export interface PageSkeletonProps {
  sections?: number;
}
