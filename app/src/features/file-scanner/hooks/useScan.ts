import { useCallback, useEffect, useRef, useState } from "react";
import type { DeletedFile, ScanSession } from "@/shared/types/common.types";
import { scanApi } from "../api/scan.api";

interface UseScanState {
  session: ScanSession | null;
  files: DeletedFile[];
  loading: boolean;
  error: string | null;
  startScan: (diskId: string) => Promise<void>;
  cancelScan: () => Promise<void>;
}

export function useScan(): UseScanState {
  const [session, setSession] = useState<ScanSession | null>(null);
  const [files, setFiles] = useState<DeletedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopStream = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startScan = useCallback(
    async (diskId: string) => {
      stopStream();
      setFiles([]);
      setError(null);
      setLoading(true);

      try {
        const newSession = await scanApi.start(diskId);
        setSession(newSession);

        // Poll session status
        pollRef.current = setInterval(async () => {
          try {
            const updated = await scanApi.getSession(newSession.id);
            setSession(updated);
            if (!["pending", "running"].includes(updated.status)) {
              stopStream();
            }
          } catch {
            // ignore transient errors
          }
        }, 1000);

        // Stream files via SSE
        const es = new EventSource(scanApi.streamUrl(newSession.id));
        eventSourceRef.current = es;

        es.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.event === "done") {
              stopStream();
              return;
            }
            setFiles((prev) => [...prev, data as DeletedFile]);
          } catch {
            // ignore parse errors
          }
        };

        es.onerror = () => {
          stopStream();
        };
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to start scan");
      } finally {
        setLoading(false);
      }
    },
    [stopStream]
  );

  const cancelScan = useCallback(async () => {
    if (!session) return;
    stopStream();
    try {
      const updated = await scanApi.cancelSession(session.id);
      setSession(updated);
    } catch {
      // ignore
    }
  }, [session, stopStream]);

  useEffect(() => () => stopStream(), [stopStream]);

  return { session, files, loading, error, startScan, cancelScan };
}
