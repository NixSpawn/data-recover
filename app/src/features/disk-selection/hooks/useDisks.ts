import { useCallback, useEffect, useState } from "react";
import type { Disk } from "@/shared/types/common.types";
import { disksApi } from "../api/disks.api";

interface UseDisksState {
  disks: Disk[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDisks(): UseDisksState {
  const [disks, setDisks] = useState<Disk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await disksApi.list();
      setDisks(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load disks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { disks, loading, error, refresh: fetch };
}
