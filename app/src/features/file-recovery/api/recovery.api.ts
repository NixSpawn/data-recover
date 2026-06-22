import { apiClient } from "@/shared/api/client";

interface RecoverRequest {
  session_id: string;
  inode_ids: number[];
  destination_path: string;
}

interface RecoverResponse {
  recovered_files: string[];
  total_recovered: number;
}

export const recoveryApi = {
  recover: (req: RecoverRequest) =>
    apiClient.post<RecoverResponse>("/recovery/", req),
};
