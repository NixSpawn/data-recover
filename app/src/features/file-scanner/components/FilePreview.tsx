import type { DeletedFile } from "@/shared/types/common.types";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

interface FilePreviewProps {
  file: DeletedFile | null;
}

export function FilePreview({ file }: FilePreviewProps) {
  if (!file) {
    return (
      <div className="w-56 flex-shrink-0 border-l border-border bg-card flex items-center justify-center">
        <p className="text-xs text-muted-foreground text-center px-4">
          Select a file to see details
        </p>
      </div>
    );
  }

  return (
    <div className="w-56 flex-shrink-0 border-l border-border bg-card flex flex-col">
      {/* Thumbnail area */}
      <div className="h-36 bg-muted flex items-center justify-center border-b border-border">
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-xl bg-card border border-border flex items-center justify-center">
            <span className="text-xl font-bold text-muted-foreground">
              {file.extension ? `.${file.extension}` : "?"}
            </span>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        <MetaRow label="Name" value={file.name} />
        <MetaRow label="Size" value={formatBytes(file.size)} />
        {file.modified_at && (
          <MetaRow label="Modified" value={new Date(file.modified_at).toLocaleDateString()} />
        )}
        <MetaRow
          label="Type"
          value={file.extension ? `${file.extension.toUpperCase()} File` : file.category}
        />
        <MetaRow label="Path" value={file.original_path} mono />
        <MetaRow
          label="Recoverable"
          value={file.is_recoverable ? "Yes" : "Partial"}
          highlight={!file.is_recoverable}
        />
        <MetaRow label="Confidence" value={`${(file.recovery_confidence * 100).toFixed(0)}%`} />
      </div>
    </div>
  );
}

function MetaRow({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p
        className={`text-xs break-all ${mono ? "font-mono" : ""} ${
          highlight ? "text-amber-500" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
