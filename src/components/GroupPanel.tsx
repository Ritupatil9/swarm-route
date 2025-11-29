import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Clock, Navigation2 } from "lucide-react";
import { useEffect, useState } from "react";
import { subscribeToGroup, subscribeToMemberLocations, Group, DestinationObject } from "@/lib/groups";

interface GroupPanelProps {
  groupId: string;
}

const GroupPanel = ({ groupId }: GroupPanelProps) => {
  const [group, setGroup] = useState<Group | null>(null);
  const [membersInfo, setMembersInfo] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!groupId) return;
    const unsub = subscribeToGroup(groupId, (g) => setGroup(g));
    const unsubMembers = subscribeToMemberLocations(groupId, (list) => {
      const map: Record<string, any> = {};
      list.forEach((m) => (map[m.id] = m));
      setMembersInfo(map);
    });
    return () => {
      try {
        unsub();
      } catch (e) { }
      try {
        unsubMembers();
      } catch (e) { }
    };
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
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">Group Code: <span className="font-mono">{(group as any).code ?? group.id}</span></p>
          <button
            onClick={() => {
              try {
                const val = (group as any).code ?? group.id;
                navigator.clipboard.writeText(String(val));
              } catch (e) { }
            }}
            className="text-xs text-primary underline ml-2"
            aria-label="Copy group code"
          >
            Copy
          </button>
        </div>
      </Card>

      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Group Members</h4>
        <div className="space-y-3">
          {members.map((memberId) => {
            const info = membersInfo[memberId] ?? null;
            const name = info?.name ?? memberId;
            const coords = info && info.lat && info.lng ? `${Number(info.lat).toFixed(5)}, ${Number(info.lng).toFixed(5)}` : "--";
            const updated = info?.updatedAt ? new Date((info.updatedAt?.seconds ?? info.updatedAt) * 1000).toLocaleTimeString() : "--";
            return (
              <Card key={memberId} className="p-3 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="border-2">
                      <AvatarFallback>{(name || memberId).slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm truncate">{name}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {updated}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {coords}
                      </span>
                    </div>
                    {info?.description ? (
                      <p className="text-xs text-muted-foreground mt-2 truncate">{info.description}</p>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="p-4 bg-accent/5 border-accent/20">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h4 className="font-medium text-sm mb-1">Destination</h4>
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
    </div>
  );
};

export default GroupPanel;
