import { clsx } from "clsx";
import { CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";

interface MergeCandidate {
  id: string;
  name: string;
  duplicates: { id: string; name: string; matchScore: number }[];
}

interface MergeDedupToolProps {
  candidates: MergeCandidate[];
  onMerge: (keepId: string, removeId: string) => void;
  onSkip: (id: string) => void;
  className?: string;
}

export function MergeDedupTool({
  candidates,
  onMerge,
  onSkip,
  className,
}: MergeDedupToolProps) {
  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-gray-400">
        <CheckCircle className="w-8 h-8 mb-2" />
        <p className="text-sm">No duplicates found</p>
      </div>
    );
  }

  return (
    <div className={clsx("space-y-4", className)}>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <AlertTriangle className="w-4 h-4 text-yellow-500" />
        Found {candidates.length} potential duplicate{candidates.length > 1 ? "s" : ""}
      </div>
      {candidates.map((candidate) => (
        <div
          key={candidate.id}
          className="border border-gray-200 rounded-lg p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">
              {candidate.name}
            </span>
            <button
              type="button"
              onClick={() => onSkip(candidate.id)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Skip
            </button>
          </div>
          {candidate.duplicates.map((dup) => (
            <div
              key={dup.id}
              className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-700">{dup.name}</span>
                <span className="text-[10px] text-gray-400 bg-white px-1.5 py-0.5 rounded">
                  {Math.round(dup.matchScore * 100)}% match
                </span>
              </div>
              <button
                type="button"
                onClick={() => onMerge(candidate.id, dup.id)}
                className="text-xs text-primary-600 hover:text-primary-800 font-medium"
              >
                Merge & keep "{candidate.name}"
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
