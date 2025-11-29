import { useEffect, useState } from "react";
import MapView from "@/components/MapView";
import GroupPanel from "@/components/GroupPanel";
import Header from "@/components/Header";
import LocationSearch from "@/components/LocationSearch";

const GroupNavigation = () => {
  const [groupId, setGroupId] = useState<string | null>(null);

  useEffect(() => {
    // Load the last active group (set from the dashboard when you create/join)
    try {
      const stored = localStorage.getItem("swarm_last_group_id");
      if (stored) setGroupId(stored);
    } catch (e) {
      // ignore storage errors
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex h-[calc(100vh-73px)]">
        <aside className="w-80 border-r bg-card overflow-y-auto">
          {groupId ? (
            <GroupPanel groupId={groupId} />
          ) : (
            <div className="p-4 text-sm text-muted-foreground">
              No group selected. Create or join a group from the dashboard first.
            </div>
          )}
        </aside>
        <main className="flex-1 relative">
          <MapView groupId={groupId ?? undefined} />

          {/* Destination search overlay (like Google Maps search bar) */}
          <div className="absolute top-4 left-4 right-4 max-w-md z-20">
            <LocationSearch compact />
          </div>
        </main>
      </div>
    </div>
  );
};

export default GroupNavigation;
