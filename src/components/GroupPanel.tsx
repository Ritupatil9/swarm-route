import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Clock, Navigation2 } from "lucide-react";
import { useEffect, useState } from "react";
import { subscribeToGroup, Group } from "@/lib/groups";

interface GroupPanelProps {
  groupId: string;
}

const GroupPanel = ({ groupId }: GroupPanelProps) => {
  const [group, setGroup] = useState<Group | null>(null);

  useEffect(() => {
    if (!groupId) return;
    const unsub = subscribeToGroup(groupId, (g) => setGroup(g));
    return () => unsub();
  }, [groupId]);

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
          <h3 className="font-semibold">{group.name}</h3>
          <Badge variant="secondary" className="bg-secondary/20">
            {members.length} members
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">Group Code: {group.id}</p>
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
          <div>
            <h4 className="font-medium text-sm mb-1">Destination</h4>
            <p className="text-xs text-muted-foreground">{group.destination ?? "Not set"}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GroupPanel;
