import { Link, useLocation } from "wouter";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useMobileMenu } from "@/contexts/mobile-menu-context";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, X, Bell, LogOut, User, MessageCircle, Search, Plus, Home, Sparkles, ChevronDown, Globe, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useSectorStore } from "@/stores/sector-store";

function SectorToggle({ shouldBeTransparent }: { shouldBeTransparent: boolean }) {
  const { sector, toggleSector } = useSectorStore();
  return (
    <div className="hidden md:flex items-center">
      <button
        onClick={toggleSector}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
          shouldBeTransparent
            ? "border-white/20 text-white/80 hover:bg-white/10"
            : sector === "real_world"
              ? "border-primary/20 bg-primary/5 text-primary"
              : "border-purple-500/20 bg-purple-500/5 text-purple-600 dark:text-purple-400"
        )}
      >
        {sector === "real_world" ? <MapPin className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
        {sector === "real_world" ? "Local" : "Global"}
      </button>
    </div>
  );
}

interface NavbarProps {
  variant?: 'default' | 'transparent';
}

export function Navbar({ variant = 'default' }: NavbarProps) {
  const { user, logout, loading } = useFirebaseAuth();
  const [location, setLocation] = useLocation();
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu();
  const [scrolled, setScrolled] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  const isLandingPage = location === '/';
  
  // Only use transparent mode on landing page AND when not scrolled past hero
  const shouldBeTransparent = (variant === 'transparent' || isLandingPage) && !scrolled;

  useEffect(() => {
    const handleScroll = () => {
      // Hero section is roughly 85vh, so trigger at about 80% of viewport height
      const heroHeight = window.innerHeight * 0.75;
      setScrolled(window.scrollY > heroHeight);
    };
    // Check initial scroll position on mount
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const savedImage = localStorage.getItem("profilePicture");
    if (savedImage) {
      setProfileImage(savedImage);
    }
    const handleStorageChange = () => {
      const updatedImage = localStorage.getItem("profilePicture");
      setProfileImage(updatedImage);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const publicNavLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/discover", label: "Find Tasks", icon: Search },
  ];

  const authNavLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/dashboard", label: "Dashboard", icon: User },
    { href: "/discover", label: "Find Tasks", icon: Search },
    { href: "/create-request", label: "Post Task", icon: Plus },
    { href: "/messages", label: "Messages", icon: MessageCircle },
  ];

  const navLinks = user ? authNavLinks : publicNavLinks;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-500",
          shouldBeTransparent 
            ? "bg-transparent" 
            : "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-lg shadow-slate-900/5 border-b border-slate-200/50 dark:border-slate-700/50"
        )}
      >
        <div className="container mx-auto px-4">
          <div className={cn(
            "flex items-center justify-between transition-all duration-300",
            shouldBeTransparent ? "py-2" : "py-1.5"
          )}>
            <Link href="/">
              <motion.div 
                className="flex items-center gap-2 cursor-pointer group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative">
                  <div className="h-8 w-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
                    <Sparkles size={18} />
                  </div>
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-primary to-accent rounded-lg blur opacity-30 group-hover:opacity-50 transition-opacity -z-10" />
                </div>
                <span className={cn(
                  "text-lg font-bold tracking-tight transition-colors duration-300",
                  shouldBeTransparent ? "text-white" : "text-foreground"
                )}>
                  HelpChain
                </span>
              </motion.div>
            </Link>

            {/* Sector Toggle */}
            <SectorToggle shouldBeTransparent={shouldBeTransparent} />

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <motion.span 
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer flex items-center gap-2",
                      shouldBeTransparent 
                        ? location === link.href 
                          ? "bg-white/20 text-white" 
                          : "text-white/80 hover:text-white hover:bg-white/10"
                        : location === link.href 
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <link.icon size={16} />
                    {link.label}
                  </motion.span>
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              {loading ? (
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
              ) : user ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn(
                          "relative rounded-full transition-colors duration-300",
                          shouldBeTransparent 
                            ? "hover:bg-white/10" 
                            : "hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                      >
                        <Bell className={cn(
                          "h-5 w-5 transition-colors duration-300",
                          shouldBeTransparent ? "text-white" : "text-muted-foreground"
                        )} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl shadow-xl border-slate-200 dark:border-slate-700">
                      <div className="p-4 border-b font-semibold text-sm bg-slate-50 dark:bg-slate-800 rounded-t-2xl">
                        Notifications
                      </div>
                      <div className="p-8 text-center text-muted-foreground text-sm">
                        <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        No new notifications
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className={cn(
                          "relative h-10 gap-2 px-2 rounded-full transition-colors duration-300",
                          shouldBeTransparent 
                            ? "hover:bg-white/10" 
                            : "hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                      >
                        <Avatar className={cn(
                          "h-8 w-8 border-2 transition-colors duration-300",
                          shouldBeTransparent ? "border-white/30" : "border-primary/20"
                        )}>
                          <AvatarImage src={user.photoURL || profileImage || undefined} alt={user.displayName || 'User'} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm font-medium">
                            {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-colors duration-300",
                          shouldBeTransparent ? "text-white" : "text-muted-foreground"
                        )} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 rounded-2xl shadow-xl border-slate-200 dark:border-slate-700" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal p-4 bg-slate-50 dark:bg-slate-800 rounded-t-xl">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-semibold leading-none">{user.displayName || 'User'}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <div className="p-1">
                        <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                          <Link href="/profile" className="w-full flex items-center gap-2 py-2">
                            <User className="h-4 w-4" />
                            My Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                          <Link href="/dashboard" className="w-full flex items-center gap-2 py-2">
                            <Home className="h-4 w-4" />
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </div>
                      <DropdownMenuSeparator />
                      <div className="p-1">
                        <DropdownMenuItem 
                          onClick={handleLogout} 
                          className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer rounded-lg"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Log out
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth">
                    <Button 
                      variant="ghost" 
                      className={cn(
                        "font-medium rounded-full px-5 transition-colors duration-300",
                        shouldBeTransparent 
                          ? "text-white hover:bg-white/10" 
                          : "text-foreground hover:bg-slate-100"
                      )}
                    >
                      Log in
                    </Button>
                  </Link>
                  <Link href="/auth?mode=signup">
                    <Button 
                      className={cn(
                        "font-semibold rounded-full px-6 transition-all hover:-translate-y-0.5 btn-shine",
                        shouldBeTransparent
                          ? "bg-white text-primary hover:bg-white/90 shadow-lg shadow-black/10"
                          : "bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                      )}
                    >
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            <div className="flex md:hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "rounded-full transition-colors duration-300",
                  shouldBeTransparent ? "text-white hover:bg-white/10" : "hover:bg-slate-100"
                )}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "-100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed left-0 top-0 h-screen w-[280px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 z-50 md:hidden shadow-2xl"
              >
                <div className="p-6 space-y-6 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white">
                        <Sparkles size={18} />
                      </div>
                      <span className="text-lg font-bold">HelpChain</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="space-y-1">
                    {navLinks.map((link) => (
                      <Link key={link.href} href={link.href}>
                        <motion.div
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "py-3 px-4 rounded-xl transition-colors cursor-pointer text-sm font-medium flex items-center gap-3",
                            location === link.href
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                          )}
                        >
                          <link.icon size={18} />
                          {link.label}
                        </motion.div>
                      </Link>
                    ))}
                  </div>

                  <div className="h-px bg-slate-200 dark:bg-slate-700" />

                  <div className="space-y-1 flex-1">
                    {user ? (
                      <>
                        <Link href="/profile">
                          <motion.div
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-sm font-medium"
                          >
                            <User className="w-5 h-5 text-muted-foreground" />
                            <span>My Profile</span>
                          </motion.div>
                        </Link>
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            handleLogout();
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium text-red-600"
                        >
                          <LogOut className="w-5 h-5" />
                          <span>Log out</span>
                        </motion.button>
                      </>
                    ) : (
                      <div className="space-y-3 mt-auto pt-4">
                        <Link href="/auth">
                          <Button 
                            variant="outline" 
                            className="w-full justify-center font-medium rounded-xl h-12"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Log in
                          </Button>
                        </Link>
                        <Link href="/auth?mode=signup">
                          <Button 
                            className="w-full justify-center bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold rounded-xl h-12"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Get Started
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
