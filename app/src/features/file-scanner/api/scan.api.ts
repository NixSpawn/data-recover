import { apiClient, buildSSEUrl } from "@/shared/api/client";
import type { DeletedFile, ScanSession } from "@/shared/types/common.types";

export const scanApi = {
  start: (diskId: string) =>
    apiClient.post<ScanSession>("/scan/start", { disk_id: diskId }),

  getSession: (sessionId: string) =>
    apiClient.get<ScanSession>(`/scan/${sessionId}`),

  cancelSession: (sessionId: string) =>
    apiClient.delete<ScanSession>(`/scan/${sessionId}`),

  getFiles: (
    sessionId: string,
    params?: { category?: string; extension?: string; limit?: number; offset?: number }
  ) => {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.extension) query.set("extension", params.extension);
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.offset !== undefined) query.set("offset", String(params.offset));
    return apiClient.get<DeletedFile[]>(`/scan/${sessionId}/files?${query}`);
  },

  streamUrl: (sessionId: string) => buildSSEUrl(`/scan/${sessionId}/stream`),
};
