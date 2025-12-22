import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import BasketballIcon from "@/components/ui/basketball-icon";
import NotificationBell from "@/components/notifications/NotificationBell";
import { User, LogOut, Settings, Menu, X } from "lucide-react";

const Header = () => {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <BasketballIcon className="text-accent text-2xl" />
            <h1 className="font-inter font-bold text-xl md:text-2xl">NCAA Pick'Em</h1>
          </Link>
        </div>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {user ? (
            <>
              <nav className="flex items-center space-x-4">
                <Link href="/dashboard" className={`hover:text-accent transition-colors ${location === "/dashboard" ? "text-accent" : ""}`}>
                  Dashboard
                </Link>
                <Link href="/leaderboard" className={`hover:text-accent transition-colors ${location === "/leaderboard" ? "text-accent" : ""}`}>
                  Leaderboard
                </Link>
                {user.isAdmin && (
                  <Link href="/admin" className={`hover:text-accent transition-colors ${location === "/admin" ? "text-accent" : ""}`}>
                    Admin
                  </Link>
                )}
              </nav>
              
              <NotificationBell />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 h-auto flex items-center space-x-2 hover:bg-transparent">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden md:inline-block text-white">{user.displayName || user.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => {}}>
                    <User className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => {}}>
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button 
                  variant="ghost" 
                  className="text-white hover:text-accent"
                >
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button 
                  className="bg-accent hover:bg-accent/90 text-primary"
                >
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button 
            variant="ghost" 
            className="text-white" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>

      {/* Mobile navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-primary border-t border-gray-700 p-4">
          {user ? (
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                </div>
                <span>{user.displayName || user.username}</span>
              </div>
              <Link 
                href="/dashboard" 
                className={`block py-2 hover:text-accent transition-colors ${location === "/dashboard" ? "text-accent" : ""}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                href="/leaderboard" 
                className={`block py-2 hover:text-accent transition-colors ${location === "/leaderboard" ? "text-accent" : ""}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Leaderboard
              </Link>
              {user.isAdmin && (
                <Link 
                  href="/admin" 
                  className={`block py-2 hover:text-accent transition-colors ${location === "/admin" ? "text-accent" : ""}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              <Button variant="ghost" className="justify-start px-0 text-white hover:text-accent" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </div>
          ) : (
            <div className="flex flex-col space-y-3">
              <Link href="/login" className="w-full">
                <Button 
                  variant="ghost" 
                  className="w-full justify-center text-white hover:text-accent" 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Button>
              </Link>
              <Link href="/register" className="w-full">
                <Button 
                  className="w-full bg-accent hover:bg-accent/90 text-primary" 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
