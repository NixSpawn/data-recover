import { Pause, Square } from "lucide-react";
import type { ScanSession } from "@/shared/types/common.types";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

interface ScanProgressProps {
  session: ScanSession;
  onCancel: () => void;
}

export function ScanProgress({ session, onCancel }: ScanProgressProps) {
  const isRunning = session.status === "running" || session.status === "pending";

  return (
    <div className="h-14 border-t border-border bg-card flex items-center px-6 gap-4 flex-shrink-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground capitalize">
            {session.status === "running" ? "Scanning..." : session.status}
          </span>
          <span className="text-xs text-muted-foreground">
            Found: {session.files_found.toLocaleString()} files
            {session.total_bytes > 0 &&
              ` · Scanned: ${session.progress_percent.toFixed(0)}%`}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{
              width: isRunning
                ? session.progress_percent > 0
                  ? `${session.progress_percent}%`
                  : "5%"
                : "100%",
            }}
          />
        </div>
      </div>

      {isRunning && (
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-border hover:border-foreground/30"
        >
          <Square className="w-3 h-3 fill-current" />
          Stop
        </button>
      )}
    </div>
  );
}
