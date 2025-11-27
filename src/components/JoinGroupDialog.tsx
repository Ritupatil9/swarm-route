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
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { getGroup, addMember } from "@/lib/groups";

interface JoinGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoined?: (groupId: string) => void;
}

const JoinGroupDialog = ({ open, onOpenChange, onJoined }: JoinGroupDialogProps) => {
  const [groupCode, setGroupCode] = useState("");
  const { toast } = useToast();
  const ensureLocalUserId = () => {
    try {
      const key = "swarm_user_id";
      let id = localStorage.getItem(key);
      if (!id) {
        id = "user_" + Math.random().toString(36).slice(2, 9);
        localStorage.setItem(key, id);
      }
      return id;
    } catch (e) {
      return "user_anonymous";
    }
  };

  const handleJoin = async () => {
    if (!groupCode) {
      toast({
        title: "Missing group code",
        description: "Please enter a valid group code",
        variant: "destructive",
      });
      return;
    }

    try {
      const group = await getGroup(groupCode);
      if (!group) {
        toast({
          title: "Group not found",
          description: "Please check the group code",
          variant: "destructive",
        });
        return;
      }

      const userId = ensureLocalUserId();
      await addMember(groupCode, userId);

      toast({
        title: "Joined successfully!",
        description: `You've been added to ${group.name}`,
      });

      setGroupCode("");
      onOpenChange(false);
      if (typeof onJoined === "function") onJoined(groupCode);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("joinGroup error", err);
      toast({
        title: "Could not join",
        description: "Something went wrong while joining the group.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-2">
            <UserPlus className="w-6 h-6 text-secondary" />
          </div>
          <DialogTitle className="text-center">Join Existing Group</DialogTitle>
          <DialogDescription className="text-center">
            Enter the group code shared by your friend to join their travel group
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-code">Group Code</Label>
            <Input
              id="group-code"
              placeholder="e.g., #WKD2024"
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value)}
              className="text-center text-lg tracking-wider"
            />
            <p className="text-xs text-muted-foreground text-center">
              Ask the group creator for the code
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            onClick={handleJoin}
            className="bg-secondary hover:bg-secondary/90 w-full"
          >
            Join Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JoinGroupDialog;
