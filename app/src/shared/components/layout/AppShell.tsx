import { useState } from "react";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [activeNav, setActiveNav] = useState("hard-disk");

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar activeId={activeNav} onSelect={setActiveNav} />
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}
