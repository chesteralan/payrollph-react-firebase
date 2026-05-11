import { Suspense, type ReactNode } from "react";

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-gray-500">Loading...</div>
    </div>
  );
}

export function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>;
}
