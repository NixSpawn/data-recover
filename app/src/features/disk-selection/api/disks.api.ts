import { apiClient } from "@/shared/api/client";
import type { Disk } from "@/shared/types/common.types";

export const disksApi = {
  list: () => apiClient.get<Disk[]>("/disks/"),
};
