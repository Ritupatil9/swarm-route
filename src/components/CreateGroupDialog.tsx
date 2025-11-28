import { useState } from "react";
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
import { Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createGroup } from "@/lib/groups";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (groupId: string) => void;
}

const CreateGroupDialog = ({ open, onOpenChange, onCreated }: CreateGroupDialogProps) => {
  const [groupName, setGroupName] = useState("");
  const [destination, setDestination] = useState("");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!groupName || !destination) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // No auth in this app yet — pass null for creatorId
      const result = await createGroup({ name: groupName, destination, creatorId: null });
      const id = result.id;
      const code = result.code;
      toast({
        title: "Group created",
        description: `${groupName} has been created (code: ${code})`,
      });

      setGroupName("");
      setDestination("");
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
            <Input
              id="destination"
              placeholder="Enter destination address"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
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
