import { useCallback, useMemo } from "react";

interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

interface UseShareResult {
  /** Whether the Web Share API is available in this browser */
  isSupported: boolean;
  /**
   * Share content using the Web Share API with fallback to clipboard/copy.
   * Returns true if the content was successfully shared/copied, false if
   * the user aborted or the operation failed.
   */
  share: (options: ShareOptions) => Promise<boolean>;
  /**
   * Share a file (Blob) using the Web Share API with fallback to download.
   * Returns true if the file was successfully shared/downloaded, false if
   * the user aborted the operation.
   */
  shareFile: (blob: Blob, fileName: string, title?: string) => Promise<boolean>;
}

/**
 * Hook that wraps the Web Share API (navigator.share) with automatic
 * fallback for unsupported browsers.
 *
 * Falls back to:
 * - `navigator.clipboard.writeText` for text/URL sharing
 * - Creating a download link for file sharing
 */
export function useShare(): UseShareResult {
  const isSupported = useMemo(
    () =>
      typeof navigator !== "undefined" &&
      "share" in navigator &&
      typeof navigator.share === "function",
    [],
  );

  const share = useCallback(
    async (options: ShareOptions): Promise<boolean> => {
      if (isSupported) {
        try {
          await navigator.share(options);
          return true;
        } catch (error) {
          // AbortError means the user cancelled the share dialog — not a failure
          if (error instanceof DOMException && error.name === "AbortError") {
            return false;
          }
          // Other error (e.g. not supported on insecure context) — fall through to fallback
        }
      }

      // Fallback: try clipboard for text/URL
      const text = options.url || options.text || "";
      if (text) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch {
          return false;
        }
      }

      return false;
    },
    [isSupported],
  );

  const shareFile = useCallback(
    async (blob: Blob, fileName: string, title?: string): Promise<boolean> => {
      if (isSupported) {
        try {
          const file = new File([blob], fileName, { type: blob.type });
          await navigator.share({
            title: title || fileName,
            files: [file],
          });
          return true;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return false;
          }
          // Fall through to download fallback
        }
      }

      // Fallback: trigger a file download
      try {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
        return true;
      } catch {
        return false;
      }
    },
    [isSupported],
  );

  return { isSupported, share, shareFile };
}
