import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Users, Plus, UserPlus, Navigation } from "lucide-react";
import { Link } from "react-router-dom";
import MapView from "@/components/MapView";
import GroupPanel from "@/components/GroupPanel";
import CreateGroupDialog from "@/components/CreateGroupDialog";
import JoinGroupDialog from "@/components/JoinGroupDialog";

const Dashboard = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Navigation className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl">TravelSync</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
              <Button
                onClick={() => setShowJoinDialog(true)}
                variant="outline"
                className="border-primary/20"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Join Group
              </Button>
            </div>
          </div>
        </div>
      </header>

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
          <MapView />
          
          {/* Floating Info Card */}
          <div className="absolute top-4 left-4 right-4 z-10">
            <Card className="p-4 bg-card/95 backdrop-blur shadow-lg border-primary/10">
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
      <CreateGroupDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      <JoinGroupDialog open={showJoinDialog} onOpenChange={setShowJoinDialog} />
    </div>
  );
};

export default Dashboard;
