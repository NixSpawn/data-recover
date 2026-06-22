import { useState } from "react";
import { HardDrive, Usb, Cloud, ServerCrash, Settings } from "lucide-react";
import { cn } from "../ui/utils";
import { useSettings } from "../../context/SettingsContext";
import { SettingsMenu } from "./SettingsMenu";

interface NavItem {
  id: string;
  labelKey: keyof ReturnType<typeof useSettings>["t"]["nav"];
  icon: React.ComponentType<{ className?: string }>;
  group: "recovery" | "advanced";
}

const NAV_ITEMS: NavItem[] = [
  { id: "hard-disk", labelKey: "hardDisk", icon: HardDrive, group: "recovery" },
  { id: "usb", labelKey: "usbDrive", icon: Usb, group: "recovery" },
  { id: "cloud", labelKey: "cloud", icon: Cloud, group: "recovery" },
  { id: "crashed-pc", labelKey: "crashedPc", icon: ServerCrash, group: "advanced" },
];

interface SidebarProps {
  activeId: string;
  onSelect: (id: string) => void;
}

export function Sidebar({ activeId, onSelect }: SidebarProps) {
  const { t } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const recovery = NAV_ITEMS.filter((i) => i.group === "recovery");
  const advanced = NAV_ITEMS.filter((i) => i.group === "advanced");

  return (
    <>
      <aside className="w-56 flex-shrink-0 bg-sidebar flex flex-col py-4">
        <div className="flex-1 flex flex-col gap-1">
          <NavGroup
            label={t.nav.dataRecovery}
            items={recovery}
            activeId={activeId}
            onSelect={onSelect}
          />
          <NavGroup
            label={t.nav.advancedFeatures}
            items={advanced}
            activeId={activeId}
            onSelect={onSelect}
          />
        </div>

        {/* Settings button */}
        <div className="px-3 pt-2 border-t border-sidebar-border mt-2">
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              settingsOpen
                ? "bg-white/10 text-sidebar-foreground"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5"
            )}
          >
            <Settings className={cn("w-4 h-4 flex-shrink-0 transition-transform duration-200", settingsOpen && "rotate-45")} />
            {t.settings.title}
          </button>
        </div>
      </aside>

      <SettingsMenu open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
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
  const { t } = useSettings();

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
            {t.nav[item.labelKey]}
          </button>
        );
      })}
    </div>
  );
}
