import { FileImage, FileVideo, FileText, Music, Archive, File } from "lucide-react";
import { cn } from "@/shared/components/ui/utils";
import { useSettings } from "@/shared/context/SettingsContext";
import type { FileCategory } from "@/shared/types/common.types";
import type { Translations } from "@/shared/i18n/translations";

type CategoryKey = keyof Translations["categories"];

const CATEGORIES: { id: FileCategory; key: CategoryKey; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "picture", key: "pictures", icon: FileImage },
  { id: "video", key: "videos", icon: FileVideo },
  { id: "document", key: "documents", icon: FileText },
  { id: "audio", key: "audio", icon: Music },
  { id: "archive", key: "archives", icon: Archive },
  { id: "other", key: "others", icon: File },
];

interface FilterPanelProps {
  activeCategories: Set<FileCategory>;
  onToggle: (category: FileCategory) => void;
  fileCounts: Partial<Record<FileCategory, number>>;
}

export function FilterPanel({ activeCategories, onToggle, fileCounts }: FilterPanelProps) {
  const { t } = useSettings();

  return (
    <div className="w-48 flex-shrink-0 border-r border-border bg-card flex flex-col py-3 overflow-y-auto">
      <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        {t.categories.byFileType}
      </p>
      {CATEGORIES.map(({ id, key, icon: Icon }) => {
        const active = activeCategories.has(id);
        const count = fileCounts[id] ?? 0;
        return (
          <button
            key={id}
            onClick={() => onToggle(id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm transition-colors",
              active ? "text-primary bg-accent" : "text-foreground hover:bg-muted"
            )}
          >
            <input
              type="checkbox"
              checked={active}
              readOnly
              className="accent-primary w-3.5 h-3.5"
            />
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">{t.categories[key]}</span>
            {count > 0 && (
              <span className="text-xs text-muted-foreground">{count.toLocaleString()}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
