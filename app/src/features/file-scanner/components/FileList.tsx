import { useState } from "react";
import { ArrowUpDown, ScanSearch } from "lucide-react";
import { cn } from "@/shared/components/ui/utils";
import type { DeletedFile, ScanSession } from "@/shared/types/common.types";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

interface FileListProps {
  files: DeletedFile[];
  selectedInodes: Set<number>;
  onToggleSelect: (inode: number) => void;
  onSelectAll: (files: DeletedFile[]) => void;
  onPreview: (file: DeletedFile) => void;
  session: ScanSession | null;
  currentPath: string;
}

type SortKey = "name" | "size" | "modified_at" | "category";

export function FileList({ files, selectedInodes, onToggleSelect, onSelectAll, onPreview, session, currentPath }: FileListProps) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = [...files].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "name") cmp = a.name.localeCompare(b.name);
    else if (sortKey === "size") cmp = a.size - b.size;
    else if (sortKey === "category") cmp = a.category.localeCompare(b.category);
    else if (sortKey === "modified_at") {
      cmp = (a.modified_at ?? "").localeCompare(b.modified_at ?? "");
    }
    return sortAsc ? cmp : -cmp;
  });

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  };

  const allSelected = files.length > 0 && files.every((f) => selectedInodes.has(f.inode));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center border-b border-border bg-muted/40 px-2 py-2 gap-2 text-xs font-medium text-muted-foreground flex-shrink-0">
        <div className="w-8 flex-shrink-0 flex items-center justify-center">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => onSelectAll(allSelected ? [] : files)}
            className="accent-primary w-3.5 h-3.5"
          />
        </div>
        <ColHeader label="Name" flex="flex-1" sortKey="name" current={sortKey} asc={sortAsc} onSort={toggleSort} />
        <ColHeader label="Date Modified" flex="w-36" sortKey="modified_at" current={sortKey} asc={sortAsc} onSort={toggleSort} />
        <ColHeader label="Size" flex="w-24" sortKey="size" current={sortKey} asc={sortAsc} onSort={toggleSort} />
        <ColHeader label="Type" flex="w-28" sortKey="category" current={sortKey} asc={sortAsc} onSort={toggleSort} />
        <div className="w-48 flex-shrink-0 text-xs">Path</div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
            {session?.status === "running" || session?.status === "pending" ? (
              <>
                <div className="relative">
                  <ScanSearch className="w-10 h-10 text-primary animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium">Scanning for deleted files...</p>
                  {currentPath && (
                    <p className="text-xs font-mono text-muted-foreground max-w-xs truncate px-4">
                      {currentPath}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No deleted files found</p>
            )}
          </div>
        ) : (
          sorted.map((file) => (
            <FileRow
              key={file.inode}
              file={file}
              selected={selectedInodes.has(file.inode)}
              onToggle={() => onToggleSelect(file.inode)}
              onPreview={() => onPreview(file)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ColHeader({
  label, flex, sortKey, current, asc, onSort,
}: {
  label: string; flex: string; sortKey: SortKey;
  current: SortKey; asc: boolean; onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={cn("flex items-center gap-1 hover:text-foreground transition-colors", flex)}
    >
      {label}
      <ArrowUpDown className={cn("w-3 h-3", active ? "text-primary" : "opacity-40")} />
    </button>
  );
}

function FileRow({ file, selected, onToggle, onPreview }: {
  file: DeletedFile; selected: boolean;
  onToggle: () => void; onPreview: () => void;
}) {
  return (
    <div
      onClick={onPreview}
      className={cn(
        "flex items-center border-b border-border/50 px-2 py-1.5 gap-2 text-sm cursor-pointer",
        "hover:bg-muted/50 transition-colors",
        selected && "bg-accent"
      )}
    >
      <div
        className="w-8 flex-shrink-0 flex items-center justify-center"
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
      >
        <input
          type="checkbox"
          checked={selected}
          readOnly
          className="accent-primary w-3.5 h-3.5"
        />
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <FileIcon extension={file.extension} />
        <span className="truncate text-sm">{file.name}</span>
        {!file.is_recoverable && (
          <span className="text-xs text-amber-500 flex-shrink-0">Partial</span>
        )}
      </div>
      <span className="w-36 flex-shrink-0 text-xs text-muted-foreground truncate">
        {file.modified_at ? new Date(file.modified_at).toLocaleString() : "—"}
      </span>
      <span className="w-24 flex-shrink-0 text-xs text-muted-foreground">
        {formatBytes(file.size)}
      </span>
      <span className="w-28 flex-shrink-0 text-xs text-muted-foreground capitalize">
        {file.extension ? `${file.extension.toUpperCase()} File` : file.category}
      </span>
      <span className="w-48 flex-shrink-0 text-xs text-muted-foreground truncate">
        {file.original_path}
      </span>
    </div>
  );
}

function FileIcon({ extension }: { extension: string }) {
  const colors: Record<string, string> = {
    jpg: "bg-rose-500", jpeg: "bg-rose-500", png: "bg-violet-500",
    gif: "bg-pink-500", pdf: "bg-red-600", doc: "bg-blue-600",
    docx: "bg-blue-600", xls: "bg-green-600", xlsx: "bg-green-600",
    mp4: "bg-orange-500", mov: "bg-orange-500", mp3: "bg-yellow-500",
    zip: "bg-amber-600", rar: "bg-amber-600",
  };
  const color = colors[extension.toLowerCase()] ?? "bg-slate-500";
  return (
    <div className={cn("w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-white", color)}>
      <span className="text-[8px] font-bold leading-none">
        {extension.slice(0, 3).toUpperCase() || "?"}
      </span>
    </div>
  );
}
