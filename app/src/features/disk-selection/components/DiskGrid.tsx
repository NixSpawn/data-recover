import { RefreshCw } from "lucide-react";
import type { Disk } from "@/shared/types/common.types";
import { DiskCard } from "./DiskCard";

interface DiskGridProps {
  disks: Disk[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  onSelect: (disk: Disk) => void;
  onRefresh: () => void;
}

export function DiskGrid({ disks, loading, error, selectedId, onSelect, onRefresh }: DiskGridProps) {
  const internal = disks.filter((d) => d.disk_type === "internal");
  const external = disks.filter((d) => d.disk_type !== "internal");

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Detecting drives...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={onRefresh}
            className="text-xs text-primary underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {external.length > 0 && (
        <DiskSection label={`External Drives (${external.length})`} disks={external} selectedId={selectedId} onSelect={onSelect} />
      )}
      {internal.length > 0 && (
        <DiskSection label={`Internal Drives (${internal.length})`} disks={internal} selectedId={selectedId} onSelect={onSelect} />
      )}
    </div>
  );
}

function DiskSection({
  label,
  disks,
  selectedId,
  onSelect,
}: {
  label: string;
  disks: Disk[];
  selectedId: string | null;
  onSelect: (disk: Disk) => void;
}) {
  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-3">{label}</h3>
      <div className="flex flex-wrap gap-3">
        {disks.map((disk) => (
          <DiskCard
            key={disk.id}
            disk={disk}
            selected={disk.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
