import { useState } from "react";
import type { Disk } from "@/shared/types/common.types";
import { AppShell } from "@/shared/components/layout/AppShell";
import { DiskSelectionPage } from "@/pages/DiskSelectionPage";
import { ScanResultsPage } from "@/pages/ScanResultsPage";

type AppView = "disk-selection" | "scan-results";

export default function App() {
  const [view, setView] = useState<AppView>("disk-selection");
  const [selectedDisk, setSelectedDisk] = useState<Disk | null>(null);

  const handleScan = (disk: Disk) => {
    setSelectedDisk(disk);
    setView("scan-results");
  };

  const handleBack = () => {
    setSelectedDisk(null);
    setView("disk-selection");
  };

  return (
    <AppShell>
      {view === "disk-selection" && <DiskSelectionPage onScan={handleScan} />}
      {view === "scan-results" && selectedDisk && (
        <ScanResultsPage disk={selectedDisk} onBack={handleBack} />
      )}
    </AppShell>
  );
}
