import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Clock, Navigation2 } from "lucide-react";

interface GroupPanelProps {
  groupId: string;
}

const GroupPanel = ({ groupId }: GroupPanelProps) => {
  // Mock data - will be replaced with real data from backend
  const mockMembers = [
    {
      id: "1",
      name: "You",
      status: "active",
      eta: "Arrived",
      distance: "0 km",
      color: "hsl(var(--primary))",
    },
    {
      id: "2", 
      name: "Sarah Chen",
      status: "traveling",
      eta: "5 mins",
      distance: "2.3 km",
      color: "hsl(var(--secondary))",
    },
    {
      id: "3",
      name: "Mike Johnson", 
      status: "traveling",
      eta: "8 mins",
      distance: "3.7 km",
      color: "hsl(var(--accent))",
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Weekend Trip</h3>
          <Badge variant="secondary" className="bg-secondary/20">
            3 members
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">Group Code: #WKD2024</p>
      </Card>

      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Group Members</h4>
        <div className="space-y-3">
          {mockMembers.map((member) => (
            <Card key={member.id} className="p-3 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="border-2" style={{ borderColor: member.color }}>
                    <AvatarFallback style={{ backgroundColor: member.color + "20", color: member.color }}>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {member.status === "traveling" && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-success border-2 border-card animate-pulse" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm truncate">{member.name}</p>
                    {member.status === "traveling" && (
                      <Navigation2 className="w-3 h-3 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {member.eta}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {member.distance}
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
            <h4 className="font-medium text-sm mb-1">Suggested Meeting Point</h4>
            <p className="text-xs text-muted-foreground">Central Park Entrance</p>
            <p className="text-xs text-muted-foreground mt-1">Average distance: 2.8 km</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GroupPanel;
