import { HardDrive, Usb } from "lucide-react";
import { cn } from "@/shared/components/ui/utils";
import type { Disk } from "@/shared/types/common.types";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

interface DiskCardProps {
  disk: Disk;
  selected: boolean;
  onSelect: (disk: Disk) => void;
}

export function DiskCard({ disk, selected, onSelect }: DiskCardProps) {
  const Icon = disk.disk_type === "external" || disk.disk_type === "removable" ? Usb : HardDrive;

  return (
    <button
      onClick={() => onSelect(disk)}
      className={cn(
        "relative flex flex-col gap-3 p-4 rounded-xl border-2 text-left transition-all duration-150",
        "w-52 min-w-[200px]",
        selected
          ? "border-primary bg-accent"
          : "border-border bg-card hover:border-primary/50 hover:bg-accent/30"
      )}
    >
      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
          selected ? "bg-primary/20" : "bg-muted"
        )}>
          <Icon className={cn("w-5 h-5", selected ? "text-primary" : "text-muted-foreground")} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{disk.name}</p>
          <p className="text-xs text-muted-foreground">{disk.filesystem}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              selected ? "bg-primary" : "bg-primary/60"
            )}
            style={{ width: `${disk.usage_percent}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {formatBytes(disk.used_size)} / {formatBytes(disk.total_size)}
        </p>
      </div>
    </button>
  );
}
