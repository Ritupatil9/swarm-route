import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Users, Plus, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import LocationSearch from "@/components/LocationSearch";
<<<<<<< HEAD
=======
import { MapProvider, useMap } from "@/contexts/MapContext";
>>>>>>> 1e2875640d1f239eb348c59e9e0a8d32ce307f43
import GroupPanel from "@/components/GroupPanel";
import CreateGroupDialog from "@/components/CreateGroupDialog";
import JoinGroupDialog from "@/components/JoinGroupDialog";
import { subscribeToGroup, Group, DestinationObject } from "@/lib/groups";
import { useMemberLocation } from "@/hooks/useMemberLocation";

// Component to sync group destination with map context
const GroupDestinationSync = ({ groupId }: { groupId: string | null }) => {
  const { setDestination } = useMap();
  const [group, setGroup] = useState<Group | null>(null);

  useEffect(() => {
    if (!groupId) {
      setGroup(null);
      return;
    }
    const unsub = subscribeToGroup(groupId, (g) => {
      setGroup(g);
      // Update map context with group destination
      if (g?.destination) {
        const d = g.destination as any;
        if (typeof d === "object" && d.lat && d.lng) {
          const dest = d as DestinationObject;
          setDestination({
            lat: dest.lat,
            lng: dest.lng,
            label: dest.label,
            createdAt: Date.now(),
          });
        }
      }
    });
    return () => unsub();
  }, [groupId, setDestination]);

  return null;
};

// Component to track location when in a group
const LocationTracker = ({ groupId }: { groupId: string | null }) => {
  useMemberLocation(groupId);
  return null;
};

const Dashboard = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <aside className="w-80 border-r bg-card overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Your Groups
            </h2>

            {!activeGroup ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">No active groups</p>
                <div className="space-y-2">
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Group
                  </Button>
                  <Button
                    onClick={() => setShowJoinDialog(true)}
                    variant="outline"
                    className="w-full border-primary/20"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Join Existing Group
                  </Button>
                </div>
              </div>
            ) : (
              <GroupPanel groupId={activeGroup} />
            )}
          </div>
        </aside>

        {/* Map Area */}
        <main className="flex-1 relative">
<<<<<<< HEAD
          <MapView groupId={activeGroup} />
          {/* Top-right stack */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-3 w-[320px]">
            {!activeGroup && <LocationSearch />}
            <Card className="p-4 bg-card/95 backdrop-blur shadow-lg border-primary/10">
=======
          <MapProvider>
            <GroupDestinationSync groupId={activeGroup} />
            <LocationTracker groupId={activeGroup} />
            <MapView groupId={activeGroup} />
            {/* Top-right stack */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-3 w-[320px]">
              {!activeGroup && <LocationSearch />}
              <Card className="p-4 bg-card/95 backdrop-blur shadow-lg border-primary/10">
>>>>>>> 1e2875640d1f239eb348c59e9e0a8d32ce307f43
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Live Tracking Active</h3>
                    <p className="text-xs text-muted-foreground">
                      {activeGroup ? "Group members visible on map" : "Create or join a group to start"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <CreateGroupDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={(id) => {
          setActiveGroup(id);
          try {
            localStorage.setItem("swarm_last_group_id", id);
          } catch (e) {}
          setShowCreateDialog(false);
        }}
      />
      <JoinGroupDialog
        open={showJoinDialog}
        onOpenChange={setShowJoinDialog}
        onJoined={(id: string) => {
          setActiveGroup(id);
          try {
            localStorage.setItem("swarm_last_group_id", id);
          } catch (e) {}
          setShowJoinDialog(false);
        }}
      />
    </div>
  );
};

export default Dashboard;
