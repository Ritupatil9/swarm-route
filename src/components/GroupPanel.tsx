import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Clock, Navigation2, Settings, Crown } from "lucide-react";
import { useEffect, useState } from "react";
import { subscribeToGroup, Group, DestinationObject, updateGroupDestination } from "@/lib/groups";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface GroupPanelProps {
  groupId: string;
}

const GroupPanel = ({ groupId }: GroupPanelProps) => {
  const [group, setGroup] = useState<Group | null>(null);
  const [showDestinationDialog, setShowDestinationDialog] = useState(false);
  const [destinationQuery, setDestinationQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const key = import.meta.env.VITE_TOMTOM_KEY as string | undefined;

  useEffect(() => {
    if (!groupId) return;
    const unsub = subscribeToGroup(groupId, (g) => setGroup(g));
    return () => unsub();
  }, [groupId]);

  const isAdmin = user?.uid === group?.creatorId || (!user?.uid && localStorage.getItem("swarm_user_id") === group?.creatorId);

  const searchAndSetDestination = async () => {
    const q = destinationQuery.trim();
    if (!q || !key) return;
    setSearching(true);
    try {
      const url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(q)}.json?key=${key}&limit=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("search failed");
      const json = await res.json();
      const r = json?.results?.[0];
      const lat = r?.position?.lat;
      const lng = r?.position?.lon;
      if (typeof lat === "number" && typeof lng === "number") {
        const title = r?.poi?.name || r?.address?.freeformAddress || q;
        const destination: DestinationObject = { lat, lng, label: title };
        await updateGroupDestination(groupId, destination);
        toast({
          title: "Destination updated",
          description: `New destination: ${title}`,
        });
        setShowDestinationDialog(false);
        setDestinationQuery("");
      } else {
        toast({
          title: "Location not found",
          description: "Please try a different search term",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: "Search failed",
        description: "Could not search for location",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  if (!group) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Loading group...</p>
      </Card>
    );
  }

  const members = group.members ?? [];

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{group.name}</h3>
            {isAdmin && (
              <Crown className="w-4 h-4 text-yellow-500" title="You are the admin" />
            )}
          </div>
          <Badge variant="secondary" className="bg-secondary/20">
            {members.length} members
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">Group Code: {group.code || group.id}</p>
      </Card>

      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Group Members</h4>
        <div className="space-y-3">
          {members.map((memberId) => (
            <Card key={memberId} className="p-3 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="border-2">
                    <AvatarFallback>{memberId.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm truncate">{memberId}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      --
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      --
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="p-4 bg-accent/5 border-accent/20">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium text-sm">Destination</h4>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => setShowDestinationDialog(true)}
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Change
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {(() => {
                const d = group.destination as any;
                if (!d) return "Not set";
                // object form
                if (typeof d === "object" && d.lat && d.lng) {
                  const obj = d as DestinationObject;
                  return obj.label ? `${obj.label}` : `${obj.lat.toFixed(5)}, ${obj.lng.toFixed(5)}`;
                }
                // legacy string
                return String(d);
              })()}
            </p>
          </div>
        </div>
      </Card>

      {/* Destination Update Dialog */}
      <Dialog open={showDestinationDialog} onOpenChange={setShowDestinationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Group Destination</DialogTitle>
            <DialogDescription>
              Search for a location to set as the common destination for all group members
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Search for destination..."
                  value={destinationQuery}
                  onChange={(e) => setDestinationQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") searchAndSetDestination();
                  }}
                />
                <Button
                  onClick={searchAndSetDestination}
                  disabled={searching || !destinationQuery.trim()}
                >
                  {searching ? "..." : "Search"}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDestinationDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupPanel;
