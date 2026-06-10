import { clsx } from "clsx";
import { ChevronRight, ChevronDown, FileText, Folder } from "lucide-react";
import { useState } from "react";

interface DocTreeNode {
  id: string;
  label: string;
  type: "folder" | "file";
  children?: DocTreeNode[];
}

interface DocumentExplorerProps {
  tree: DocTreeNode[];
  onSelect: (node: DocTreeNode) => void;
  className?: string;
}

function TreeNode({
  node,
  depth,
  onSelect,
}: {
  node: DocTreeNode;
  depth: number;
  onSelect: (node: DocTreeNode) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          else onSelect(node);
        }}
        className={clsx(
          "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-gray-50 transition-colors",
          depth > 0 && "ml-4",
        )}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          )
        ) : (
          <span className="w-3.5" />
        )}
        {node.type === "folder" ? (
          <Folder className="w-4 h-4 text-yellow-500" />
        ) : (
          <FileText className="w-4 h-4 text-blue-500" />
        )}
        <span className="text-gray-700">{node.label}</span>
      </button>
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DocumentExplorer({
  tree,
  onSelect,
  className,
}: DocumentExplorerProps) {
  return (
    <div className={clsx("border border-gray-200 rounded-lg p-2", className)}>
      {tree.map((node) => (
        <TreeNode key={node.id} node={node} depth={0} onSelect={onSelect} />
      ))}
    </div>
  );
}
