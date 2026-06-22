import { useState } from "react";
import { RefreshCw } from "lucide-react";
import type { Disk } from "@/shared/types/common.types";
import { useDisks } from "@/features/disk-selection/hooks/useDisks";
import { DiskGrid } from "@/features/disk-selection/components/DiskGrid";
import { useSettings } from "@/shared/context/SettingsContext";

interface DiskSelectionPageProps {
  onScan: (disk: Disk) => void;
}

export function DiskSelectionPage({ onScan }: DiskSelectionPageProps) {
  const { disks, loading, error, refresh } = useDisks();
  const [selectedDisk, setSelectedDisk] = useState<Disk | null>(null);
  const { t } = useSettings();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t.diskSelection.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t.diskSelection.subtitle}</p>
          </div>
          <button
            onClick={refresh}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title={t.diskSelection.refresh}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Disk grid */}
      <DiskGrid
        disks={disks}
        loading={loading}
        error={error}
        selectedId={selectedDisk?.id ?? null}
        onSelect={setSelectedDisk}
        onRefresh={refresh}
      />

      {/* Footer */}
      <div className="px-8 py-4 border-t border-border flex items-center justify-end flex-shrink-0 bg-card/50">
        <button
          disabled={!selectedDisk}
          onClick={() => selectedDisk && onScan(selectedDisk)}
          className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t.diskSelection.scan} &gt;
        </button>
      </div>
    </div>
  );
}
