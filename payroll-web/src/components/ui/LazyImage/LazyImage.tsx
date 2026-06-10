import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";

interface LazyImageProps {
  src: string;
  alt: string;
  placeholderColor?: string;
  className?: string;
  width?: number;
  height?: number;
}

export function LazyImage({
  src,
  alt,
  placeholderColor = "#f3f4f6",
  className,
  width,
  height,
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  useEffect(() => {
    if (!imgRef.current) return;
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && imgRef.current) {
          imgRef.current.src = src;
          observerRef.current?.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observerRef.current.observe(imgRef.current);
    return () => observerRef.current?.disconnect();
  }, [src]);

  return (
    <div
      className={clsx("relative overflow-hidden", className)}
      style={{ width, height, backgroundColor: placeholderColor }}
    >
      {!loaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      )}
      <img
        ref={imgRef}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={clsx(
          "w-full h-full object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
          Failed to load image
        </div>
      )}
    </div>
  );
}
