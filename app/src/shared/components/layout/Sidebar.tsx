import { HardDrive, Usb, Cloud, ServerCrash } from "lucide-react";
import { cn } from "../ui/utils";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "recovery" | "advanced";
}

const NAV_ITEMS: NavItem[] = [
  { id: "hard-disk", label: "Hard Disk", icon: HardDrive, group: "recovery" },
  { id: "usb", label: "USB Drive", icon: Usb, group: "recovery" },
  { id: "cloud", label: "Cloud", icon: Cloud, group: "recovery" },
  { id: "crashed-pc", label: "Crashed PC", icon: ServerCrash, group: "advanced" },
];

interface SidebarProps {
  activeId: string;
  onSelect: (id: string) => void;
}

export function Sidebar({ activeId, onSelect }: SidebarProps) {
  const recovery = NAV_ITEMS.filter((i) => i.group === "recovery");
  const advanced = NAV_ITEMS.filter((i) => i.group === "advanced");

  return (
    <aside className="w-56 flex-shrink-0 bg-sidebar flex flex-col py-4 gap-1">
      <NavGroup label="Data Recovery" items={recovery} activeId={activeId} onSelect={onSelect} />
      <NavGroup label="Advanced Features" items={advanced} activeId={activeId} onSelect={onSelect} />
    </aside>
  );
}

function NavGroup({
  label,
  items,
  activeId,
  onSelect,
}: {
  label: string;
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mb-2">
      <p className="px-4 py-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
        {label}
      </p>
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
              active
                ? "bg-sidebar-active text-sidebar-active-foreground font-medium"
                : "text-sidebar-foreground hover:bg-white/5"
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
