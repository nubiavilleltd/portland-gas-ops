"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface CollapsibleTagListProps {
  title?: string;
  tags: string[];
}

export default function CollapsibleTagList({
  title = "Selected units",
  tags,
}: CollapsibleTagListProps) {
  const [expanded, setExpanded] = useState(false);

  if (tags.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-1 text-sm font-medium text-brand-purple hover:underline"
      >
        {expanded ? (
          <ChevronDown size={16} />
        ) : (
          <ChevronRight size={16} />
        )}

        {title} ({tags.length})
      </button>

      {expanded && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-lg bg-brand-purple/10 px-2 py-1 font-mono text-xs text-brand-purple"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}