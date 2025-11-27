import { Link, useLocation } from "react-router-dom";
import { Navigation, MessageSquare, Wind, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const Header = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { label: "Group Chat", icon: MessageSquare, href: "/group-chat" },
    { label: "Group Navigation", icon: Navigation, href: "/group-navigation" },
    { label: "Air Quality", icon: Wind, href: "/weather-alert" },
    { label: "Profile", icon: User, href: "/profile" },
  ];

  const isActive = (href: string) => location.pathname === href;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="border-b bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and branding */}
          <Link to="/home" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Navigation className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl hidden sm:inline">MeetMap</span>
          </Link>

          {/* Right side - Navigation menu */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link key={item.href} to={item.href}>
                  <Button
                    variant={active ? "default" : "ghost"}
                    size="sm"
                    className={`flex items-center gap-2 px-3 py-2 h-9 rounded-md transition-all duration-200 ${
                      active
                        ? "bg-primary text-white hover:bg-primary/90"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden md:inline text-sm font-medium">
                      {item.label}
                    </span>
                  </Button>
                </Link>
              );
            })}

            {/* Logout button */}
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="ml-2 text-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
            >
              <span className="hidden md:inline text-sm font-medium">Logout</span>
              <span className="md:hidden">Log out</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
