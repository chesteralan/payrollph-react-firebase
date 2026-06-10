import { clsx } from "clsx";
import { RefreshCw, ExternalLink } from "lucide-react";

interface DeployPreviewProps {
  url: string;
  branch: string;
  status: "building" | "ready" | "failed";
  commitSha: string;
}

export function DeployPreview({ url, branch, status, commitSha }: DeployPreviewProps) {
  return (
    <div className={clsx(
      "p-3 rounded-lg border text-sm",
      status === "ready" && "bg-green-50 border-green-200",
      status === "building" && "bg-blue-50 border-blue-200",
      status === "failed" && "bg-red-50 border-red-200",
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status === "building" && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
          <span className="font-medium text-gray-900">{branch}</span>
        </div>
        {status === "ready" && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800 text-xs">
            <ExternalLink className="w-3 h-3" /> Preview
          </a>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {status === "ready" && "Deploy preview ready"}
        {status === "building" && "Building deploy preview..."}
        {status === "failed" && "Deploy preview failed"}
      </p>
      <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{commitSha.slice(0, 7)}</p>
    </div>
  );
}
