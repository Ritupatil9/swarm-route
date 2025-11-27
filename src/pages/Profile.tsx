import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

const Profile = () => {
  // TODO: wire up real user data
  const user = { name: "Srushti", email: "srushtichaudhariii675@gmail.com" };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Profile</h2>
        <Card className="p-6">
          <div className="flex items-center gap-6">
            <Avatar className="w-16 h-16" />
            <div>
              <div className="text-lg font-medium">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
            <div className="ml-auto">
              <Button variant="outline">Edit</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
