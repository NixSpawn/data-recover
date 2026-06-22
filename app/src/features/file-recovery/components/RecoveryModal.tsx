import { useState } from "react";
import { FolderOpen, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/shared/components/ui/utils";

interface RecoveryModalProps {
  selectedCount: number;
  sessionId: string;
  onRecover: (sessionId: string, destinationPath: string) => Promise<void>;
  onClose: () => void;
  recovering: boolean;
  recoveredFiles: string[];
  error: string | null;
}

export function RecoveryModal({
  selectedCount,
  sessionId,
  onRecover,
  onClose,
  recovering,
  recoveredFiles,
  error,
}: RecoveryModalProps) {
  const [destination, setDestination] = useState("");
  const done = recoveredFiles.length > 0;

  const handleRecover = async () => {
    if (!destination.trim()) return;
    await onRecover(sessionId, destination.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-[480px] p-6 flex flex-col gap-5">
        {done ? (
          <>
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <h2 className="text-lg font-semibold">Recovery Complete</h2>
              <p className="text-sm text-muted-foreground text-center">
                {recoveredFiles.length} file{recoveredFiles.length !== 1 ? "s" : ""} recovered successfully.
              </p>
              <p className="text-xs font-mono text-muted-foreground truncate max-w-full">
                {destination}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Done
            </button>
          </>
        ) : (
          <>
            <div>
              <h2 className="text-lg font-semibold">Recover Files</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Recovering <span className="text-foreground font-medium">{selectedCount}</span> selected file{selectedCount !== 1 ? "s" : ""}.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Destination folder</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="/Users/you/Recovered"
                  className={cn(
                    "flex-1 px-3 py-2 text-sm rounded-lg border bg-background",
                    "focus:outline-none focus:ring-2 focus:ring-ring",
                    "placeholder:text-muted-foreground"
                  )}
                />
                <button
                  className="px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                  title="Browse"
                >
                  <FolderOpen className="w-4 h-4" />
                </button>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-xs text-red-500">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={recovering}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRecover}
                disabled={recovering || !destination.trim()}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {recovering && <Loader2 className="w-4 h-4 animate-spin" />}
                {recovering ? "Recovering..." : "Recover"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
