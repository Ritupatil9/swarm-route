import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Users, Clock, Bell, Navigation, Target } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--secondary)))] opacity-5" />
        
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 animate-in fade-in slide-in-from-bottom-3 duration-700">
              <Navigation className="w-4 h-4" />
              <span className="text-sm font-medium">Real-time Group Navigation</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              Travel Together,
              <br />
              Arrive Together
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
              Stay connected with your group in real-time. Track locations, share routes, and never lose anyone along the way.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
              <Link to="/dashboard">
                <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity shadow-lg">
                  <MapPin className="w-5 h-5 mr-2" />
                  Start Tracking
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="border-primary/20 hover:bg-primary/5">
                  <Users className="w-5 h-5 mr-2" />
                  Join a Group
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="p-6 border-primary/10 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/50">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Live Location Sharing</h3>
            <p className="text-muted-foreground">
              See exactly where everyone in your group is on the map in real-time with continuous updates.
            </p>
          </Card>

          <Card className="p-6 border-secondary/10 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/50">
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart ETA Tracking</h3>
            <p className="text-muted-foreground">
              Get accurate arrival time estimates for all group members based on their current location and route.
            </p>
          </Card>

          <Card className="p-6 border-success/10 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/50">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Meeting Point Suggestions</h3>
            <p className="text-muted-foreground">
              Find the perfect central location that works best for everyone in your group automatically.
            </p>
          </Card>

          <Card className="p-6 border-accent/10 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/50">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <Bell className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Alerts</h3>
            <p className="text-muted-foreground">
              Get notified when someone takes a different route, is delayed, or arrives at the destination.
            </p>
          </Card>

          <Card className="p-6 border-primary/10 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/50">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Navigation className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Route Synchronization</h3>
            <p className="text-muted-foreground">
              Keep everyone on the same path with synchronized navigation and route sharing capabilities.
            </p>
          </Card>

          <Card className="p-6 border-secondary/10 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/50">
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Easy Group Management</h3>
            <p className="text-muted-foreground">
              Create groups quickly, invite friends with a simple code, and manage members effortlessly.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="p-12 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border-primary/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Navigate Together?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of groups traveling smarter and staying connected.
            </p>
            <Link to="/dashboard">
              <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity shadow-lg">
                <MapPin className="w-5 h-5 mr-2" />
                Get Started Now
              </Button>
            </Link>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
