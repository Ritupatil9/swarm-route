import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
<<<<<<< HEAD
import { createGroup } from "@/lib/groups";
import LocationSearch from "@/components/LocationSearch";
import { Destination } from "@/contexts/MapContext";
=======
import { createGroup, DestinationObject } from "@/lib/groups";
import { useAuth } from "@/hooks/useAuth";
>>>>>>> 1e2875640d1f239eb348c59e9e0a8d32ce307f43

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (groupId: string) => void;
}

const CreateGroupDialog = ({ open, onOpenChange, onCreated }: CreateGroupDialogProps) => {
  const [groupName, setGroupName] = useState("");
<<<<<<< HEAD
  const [destination, setDestination] = useState<Destination | null>(null);
  const { toast } = useToast();
=======
  const [destination, setDestination] = useState<DestinationObject | null>(null);
  const [destinationQuery, setDestinationQuery] = useState("");
>>>>>>> 1e2875640d1f239eb348c59e9e0a8d32ce307f43
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const key = import.meta.env.VITE_TOMTOM_KEY as string | undefined;

  const searchDestination = async () => {
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
        setDestination({ lat, lng, label: title });
        toast({
          title: "Destination set",
          description: `Destination: ${title}`,
        });
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

  const handleCreate = async () => {
    if (!groupName || !destination) {
      toast({
        title: "Missing information",
        description: "Please fill in group name and set a destination",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
<<<<<<< HEAD
      // No auth in this app yet — pass null for creatorId
      const result = await createGroup({ name: groupName, destination: destination as any, creatorId: null });
=======
      const creatorId = user?.uid || null;
      const result = await createGroup({ 
        name: groupName, 
        destination, 
        creatorId 
      });
>>>>>>> 1e2875640d1f239eb348c59e9e0a8d32ce307f43
      const id = result.id;
      const code = result.code;
      toast({
        title: "Group created",
        description: `${groupName} has been created (code: ${code})`,
      });

      setGroupName("");
      setDestination(null);
<<<<<<< HEAD
=======
      setDestinationQuery("");
>>>>>>> 1e2875640d1f239eb348c59e9e0a8d32ce307f43
      onOpenChange(false);
      if (typeof onCreated === "function") onCreated(id);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("createGroup error", err);
      toast({
        title: "Could not create group",
        description: "Something went wrong while creating the group.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setGroupName("");
      setDestination(null);
      setDestinationQuery("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Create New Group</DialogTitle>
          <DialogDescription className="text-center">
            Start a new travel group and invite your friends to join
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              placeholder="Weekend Trip, Road Trip..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
<<<<<<< HEAD
            <LocationSearch onSelect={(d) => setDestination(d)} />
            {destination ? (
              <p className="text-xs text-muted-foreground mt-2">Selected: {destination.label ?? `${destination.lat.toFixed(5)}, ${destination.lng.toFixed(5)}`}</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">No destination selected</p>
=======
            <div className="flex gap-2">
              <Input
                id="destination"
                placeholder="Search for destination..."
                value={destinationQuery}
                onChange={(e) => setDestinationQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") searchDestination();
                }}
              />
              <Button 
                type="button"
                size="sm" 
                onClick={searchDestination} 
                disabled={searching || !destinationQuery.trim()}
                variant="outline"
              >
                {searching ? "..." : "Search"}
              </Button>
            </div>
            {destination && (
              <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-md border border-primary/20">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">{destination.label || `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`}</span>
              </div>
>>>>>>> 1e2875640d1f239eb348c59e9e0a8d32ce307f43
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            onClick={handleCreate}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 w-full"
          >
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;
