import { useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import type { DeletedFile, Disk } from "@/shared/types/common.types";
import { useScan } from "@/features/file-scanner/hooks/useScan";
import { useFileFilter } from "@/features/file-scanner/hooks/useFileFilter";
import { useRecovery } from "@/features/file-recovery/hooks/useRecovery";
import { FilterPanel } from "@/features/file-scanner/components/FilterPanel";
import { FileList } from "@/features/file-scanner/components/FileList";
import { FilePreview } from "@/features/file-scanner/components/FilePreview";
import { ScanProgress } from "@/features/file-scanner/components/ScanProgress";
import { RecoveryModal } from "@/features/file-recovery/components/RecoveryModal";
import { useEffect } from "react";

interface ScanResultsPageProps {
  disk: Disk;
  onBack: () => void;
}

export function ScanResultsPage({ disk, onBack }: ScanResultsPageProps) {
  const { session, files, loading, startScan, cancelScan } = useScan();
  const { filteredFiles, activeCategories, searchQuery, toggleCategory, setSearchQuery } =
    useFileFilter(files);
  const { recovering, recoveredFiles, error: recoveryError, recover, reset: resetRecovery } =
    useRecovery();

  const [selectedInodes, setSelectedInodes] = useState<Set<number>>(new Set());
  const [previewFile, setPreviewFile] = useState<DeletedFile | null>(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  useEffect(() => {
    startScan(disk.id);
  }, [disk.id]);

  const fileCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of files) {
      counts[f.category] = (counts[f.category] ?? 0) + 1;
    }
    return counts;
  }, [files]);

  const toggleSelect = (inode: number) => {
    setSelectedInodes((prev) => {
      const next = new Set(prev);
      if (next.has(inode)) next.delete(inode);
      else next.add(inode);
      return next;
    });
  };

  const handleSelectAll = (toSelect: DeletedFile[]) => {
    setSelectedInodes(new Set(toSelect.map((f) => f.inode)));
  };

  const handleRecover = async (sessionId: string, destinationPath: string) => {
    await recover(sessionId, Array.from(selectedInodes), destinationPath);
  };

  const handleCloseModal = () => {
    setShowRecoveryModal(false);
    resetRecovery();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-4 flex-shrink-0 bg-card/50">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Home
        </button>
        <span className="text-border">|</span>
        <span className="text-sm font-medium">{disk.name}</span>
        <div className="flex-1" />
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files or folders"
            className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring w-48"
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        <FilterPanel
          activeCategories={activeCategories}
          onToggle={toggleCategory}
          fileCounts={fileCounts}
        />

        <FileList
          files={filteredFiles}
          selectedInodes={selectedInodes}
          onToggleSelect={toggleSelect}
          onSelectAll={handleSelectAll}
          onPreview={setPreviewFile}
        />

        <FilePreview file={previewFile} />
      </div>

      {/* Progress bar */}
      {session && (
        <ScanProgress session={session} onCancel={cancelScan} />
      )}

      {/* Recover button */}
      {selectedInodes.size > 0 && session && (
        <div className="px-6 py-3 border-t border-border bg-card/50 flex items-center justify-between flex-shrink-0">
          <span className="text-sm text-muted-foreground">
            {selectedInodes.size.toLocaleString()} file{selectedInodes.size !== 1 ? "s" : ""} selected
          </span>
          <button
            onClick={() => setShowRecoveryModal(true)}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Recover
          </button>
        </div>
      )}

      {showRecoveryModal && session && (
        <RecoveryModal
          selectedCount={selectedInodes.size}
          sessionId={session.id}
          onRecover={handleRecover}
          onClose={handleCloseModal}
          recovering={recovering}
          recoveredFiles={recoveredFiles}
          error={recoveryError}
        />
      )}
    </div>
  );
}
