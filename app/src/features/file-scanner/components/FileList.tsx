import { useEffect, useRef, useState } from "react";
import { ArrowUpDown, FolderOpen, ScanSearch } from "lucide-react";
import { cn } from "@/shared/components/ui/utils";
import { useSettings } from "@/shared/context/SettingsContext";
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
  scannedPaths: string[];
  scanError?: string | null;
}

type SortKey = "name" | "size" | "modified_at" | "category";

export function FileList({ files, selectedInodes, onToggleSelect, onSelectAll, onPreview, session, currentPath, scannedPaths, scanError }: FileListProps) {
  const { t } = useSettings();
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
        <ColHeader label={t.fileList.name} flex="flex-1" sortKey="name" current={sortKey} onSort={toggleSort} />
        <ColHeader label={t.fileList.dateModified} flex="w-36" sortKey="modified_at" current={sortKey} onSort={toggleSort} />
        <ColHeader label={t.fileList.size} flex="w-24" sortKey="size" current={sortKey} onSort={toggleSort} />
        <ColHeader label={t.fileList.type} flex="w-28" sortKey="category" current={sortKey} onSort={toggleSort} />
        <div className="w-48 flex-shrink-0 text-xs">{t.fileList.path}</div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <ScanningState session={session} currentPath={currentPath} scannedPaths={scannedPaths} scanError={scanError} />
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
  label, flex, sortKey, current, onSort,
}: {
  label: string; flex: string; sortKey: SortKey;
  current: SortKey; onSort: (k: SortKey) => void;
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
  const { t } = useSettings();
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
          <span className="text-xs text-amber-500 flex-shrink-0">{t.scan.partial}</span>
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

function ScanningState({
  session,
  currentPath,
  scannedPaths,
  scanError,
}: {
  session: ScanSession | null;
  currentPath: string;
  scannedPaths: string[];
  scanError?: string | null;
}) {
  const { t } = useSettings();
  const isScanning = session?.status === "running" || session?.status === "pending";
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [scannedPaths.length]);

  if (scanError || session?.status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
          <span className="text-red-500 text-lg">!</span>
        </div>
        <p className="text-sm font-medium text-red-500">{t.scan.scanFailed}</p>
        <p className="text-xs text-muted-foreground font-mono break-all max-w-md">
          {scanError || session?.error_message || "Unknown error"}
        </p>
      </div>
    );
  }

  if (!isScanning) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">{t.scan.noFilesFound}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-muted/20 flex-shrink-0">
        <ScanSearch className="w-4 h-4 text-primary animate-pulse flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium">{t.scan.scanning}</p>
          {currentPath && (
            <p className="text-xs font-mono text-muted-foreground truncate">{currentPath}</p>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
        </div>
      </div>

      {/* Scrolling path feed */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-0.5">
        {scannedPaths.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">{t.scan.initializing}</p>
        ) : (
          scannedPaths.map((path, i) => {
            const isLatest = i === scannedPaths.length - 1;
            return (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-2 py-0.5 text-xs font-mono rounded px-2 transition-colors",
                  isLatest
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FolderOpen className={cn("w-3 h-3 flex-shrink-0", isLatest ? "text-primary" : "text-muted-foreground/50")} />
                <span className="truncate">{path}</span>
                {isLatest && (
                  <span className="ml-auto flex-shrink-0 text-[10px] text-primary/70">now</span>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
