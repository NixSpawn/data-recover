import { useCallback, useState } from "react";
import { recoveryApi } from "../api/recovery.api";

interface UseRecoveryState {
  recovering: boolean;
  recoveredFiles: string[];
  error: string | null;
  recover: (sessionId: string, inodeIds: number[], destinationPath: string) => Promise<void>;
  reset: () => void;
}

export function useRecovery(): UseRecoveryState {
  const [recovering, setRecovering] = useState(false);
  const [recoveredFiles, setRecoveredFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const recover = useCallback(
    async (sessionId: string, inodeIds: number[], destinationPath: string) => {
      setRecovering(true);
      setError(null);
      try {
        const result = await recoveryApi.recover({
          session_id: sessionId,
          inode_ids: inodeIds,
          destination_path: destinationPath,
        });
        setRecoveredFiles(result.recovered_files);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Recovery failed");
      } finally {
        setRecovering(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setRecoveredFiles([]);
    setError(null);
  }, []);

  return { recovering, recoveredFiles, error, recover, reset };
}
