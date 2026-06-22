import { Square } from "lucide-react";
import { cn } from "@/shared/components/ui/utils";
import type { ScanSession } from "@/shared/types/common.types";

interface ScanProgressProps {
  session: ScanSession;
  currentPath: string;
  onCancel: () => void;
}

export function ScanProgress({ session, currentPath, onCancel }: ScanProgressProps) {
  const isRunning = session.status === "running" || session.status === "pending";
  const isCompleted = session.status === "completed";

  return (
    <div className="border-t border-border bg-card flex-shrink-0">
      {/* Path ticker */}
      {isRunning && currentPath && (
        <div className="px-6 pt-2 flex items-center gap-2 overflow-hidden">
          <span className="text-xs text-muted-foreground shrink-0">Scanning</span>
          <span className="text-xs font-mono text-primary truncate">{currentPath}</span>
        </div>
      )}

      {/* Bar row */}
      <div className="h-12 flex items-center px-6 gap-4">
        {/* Animated progress bar */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            {isRunning ? (
              session.progress_percent > 0 ? (
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${session.progress_percent}%` }}
                />
              ) : (
                // Indeterminate animation when progress unknown
                <div className="h-full w-full relative overflow-hidden rounded-full">
                  <div className="absolute inset-0 bg-primary/20" />
                  <div
                    className="absolute h-full w-1/3 bg-primary rounded-full animate-[slide_1.4s_ease-in-out_infinite]"
                    style={{
                      animation: "indeterminate 1.4s ease-in-out infinite",
                    }}
                  />
                </div>
              )
            ) : (
              <div
                className={cn(
                  "h-full rounded-full",
                  isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                )}
                style={{ width: isCompleted ? "100%" : `${session.progress_percent}%` }}
              />
            )}
          </div>
        </div>

        {/* Stats */}
        <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
          Found: {session.files_found.toLocaleString()} files
        </span>

        {/* Stop button */}
        {isRunning && (
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-border hover:border-foreground/30 shrink-0"
          >
            <Square className="w-3 h-3 fill-current" />
            Stop
          </button>
        )}

        {isCompleted && (
          <span className="text-xs text-primary shrink-0 font-medium">Scan complete</span>
        )}
      </div>
    </div>
  );
}
