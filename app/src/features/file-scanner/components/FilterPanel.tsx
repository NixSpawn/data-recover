import { FileImage, FileVideo, FileText, Music, Archive, File } from "lucide-react";
import { cn } from "@/shared/components/ui/utils";
import type { FileCategory } from "@/shared/types/common.types";

const CATEGORIES: { id: FileCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "picture", label: "Pictures", icon: FileImage },
  { id: "video", label: "Videos", icon: FileVideo },
  { id: "document", label: "Documents", icon: FileText },
  { id: "audio", label: "Audio", icon: Music },
  { id: "archive", label: "Archives", icon: Archive },
  { id: "other", label: "Others", icon: File },
];

interface FilterPanelProps {
  activeCategories: Set<FileCategory>;
  onToggle: (category: FileCategory) => void;
  fileCounts: Partial<Record<FileCategory, number>>;
}

export function FilterPanel({ activeCategories, onToggle, fileCounts }: FilterPanelProps) {
  return (
    <div className="w-48 flex-shrink-0 border-r border-border bg-card flex flex-col py-3 overflow-y-auto">
      <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        By File Type
      </p>
      {CATEGORIES.map(({ id, label, icon: Icon }) => {
        const active = activeCategories.has(id);
        const count = fileCounts[id] ?? 0;
        return (
          <button
            key={id}
            onClick={() => onToggle(id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm transition-colors",
              active
                ? "text-primary bg-accent"
                : "text-foreground hover:bg-muted"
            )}
          >
            <input
              type="checkbox"
              checked={active}
              readOnly
              className="accent-primary w-3.5 h-3.5"
            />
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">{label}</span>
            {count > 0 && (
              <span className="text-xs text-muted-foreground">{count.toLocaleString()}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
