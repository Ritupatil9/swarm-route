import MapView from "@/components/MapView";
import GroupPanel from "@/components/GroupPanel";
import Header from "@/components/Header";

const GroupNavigation = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

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
