import MapView from "@/components/MapView";
import GroupPanel from "@/components/GroupPanel";

const GroupNavigation = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="font-bold">Group Navigation</div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        <aside className="w-80 border-r bg-card overflow-y-auto">
          <GroupPanel />
        </aside>
        <main className="flex-1 relative">
          <MapView />
        </main>
      </div>
    </div>
  );
};

export default GroupNavigation;
