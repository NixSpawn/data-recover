export type DiskType = "internal" | "external" | "removable" | "network";
export type FilesystemType = "NTFS" | "APFS" | "HFS+" | "FAT32" | "exFAT" | "ext4" | "unknown";
export type FileCategory = "picture" | "video" | "document" | "audio" | "archive" | "other";
export type ScanStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface Disk {
  id: string;
  name: string;
  device_path: string;
  total_size: number;
  used_size: number;
  free_size: number;
  usage_percent: number;
  filesystem: FilesystemType;
  disk_type: DiskType;
  mount_point: string | null;
  label: string | null;
  is_system: boolean;
}

export interface DeletedFile {
  inode: number;
  name: string;
  original_path: string;
  size: number;
  extension: string;
  category: FileCategory;
  filesystem: string;
  disk_id: string;
  is_recoverable: boolean;
  recovery_confidence: number;
  modified_at: string | null;
  created_at: string | null;
}

export interface ScanSession {
  id: string;
  disk_id: string;
  status: ScanStatus;
  files_found: number;
  bytes_scanned: number;
  total_bytes: number;
  progress_percent: number;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
}
