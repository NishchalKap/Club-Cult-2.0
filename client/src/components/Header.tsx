import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, Ticket, LayoutDashboard, LogOut, User, Sparkles } from "lucide-react";
import { useState } from "react";
import { AuthModal } from "@/components/AuthModal";

export function Header() {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated, refreshAuth } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  const isAdmin = user?.role === "club_admin" || user?.role === "super_admin";

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0].toUpperCase() || "U";
  };

  return (
    <header className="border-b border-border sticky top-0 z-50 backdrop-blur-lg bg-background/80">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover-elevate rounded-lg px-2 py-1 -mx-2"
            data-testid="logo-home"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Club Cult
            </span>
          </button>

          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              <Button
                variant={location === "/" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => navigate("/")}
                className="hover-elevate"
                data-testid="nav-events"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Events
              </Button>
              <Button
                variant={location === "/tickets" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => navigate("/tickets")}
                className="hover-elevate"
                data-testid="nav-tickets"
              >
                <Ticket className="h-4 w-4 mr-2" />
                My Tickets
              </Button>
              {isAdmin && (
                <Button
                  variant={location.startsWith("/admin") ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => navigate("/admin/dashboard")}
                  className="hover-elevate"
                  data-testid="nav-admin"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="h-10 w-10 rounded-full p-0 hover-elevate"
                  data-testid="button-user-menu"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.email || "User"} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => navigate("/profile")}
                  data-testid="menu-profile"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem 
                    onClick={() => navigate("/admin/dashboard")}
                    data-testid="menu-dashboard"
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => {
                    localStorage.removeItem("auth_token");
                    refreshAuth();
                    navigate("/");
                  }}
                  data-testid="menu-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button 
                className="hover-elevate active-elevate-2"
                data-testid="button-header-login"
                onClick={() => setAuthOpen(true)}
              >
                Sign In
              </Button>
              <AuthModal open={authOpen} onOpenChange={(o) => { setAuthOpen(o); if (!o) refreshAuth(); }} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
