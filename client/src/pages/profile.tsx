import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MapPin, Calendar, Star, ShieldCheck, Edit2, Wallet, 
  ArrowUpRight, ArrowDownLeft, ChevronRight, User, 
  CreditCard, FileText, Settings, LogOut, Camera, HelpCircle,
  Bell, History, Shield, Phone, Loader2
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useProfileStore } from "@/stores/profile-store";
import { useWalletLocalStore } from "@/stores/wallet-local-store";
import { useLocalizationStore } from "@/stores/localization-store";

function ProfilePageContent() {
  const [editOpen, setEditOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const { user, logout } = useFirebaseAuth();
  const { availableBalance, escrowBalance, transactions } = useWalletLocalStore();
  const { formatLocal } = useLocalizationStore();
  const { getCurrentProfile, updateProfile, createProfile, setCurrentUser } = useProfileStore();
  
  // Sync Firebase user to profile store
  useEffect(() => {
    if (user) {
      setCurrentUser(user.uid);
      const existing = useProfileStore.getState().getProfileByUserId(user.uid);
      if (!existing) {
        createProfile({
          id: `prof-${user.uid}`,
          userId: user.uid,
          fullName: user.displayName || 'User',
          email: user.email || '',
          bio: '',
          avatarUrl: user.photoURL,
          location: '',
          country: 'NG',
          baseCurrency: 'NGN',
          rating: 0,
          ratingCount: 0,
          reputationScore: 100,
          verificationTier: 1,
          helpsGiven: 0,
          helpsReceived: 0,
          successRate: 0,
          onTimeRate: 0,
          responseTime: 'N/A',
          joinedAt: new Date().toISOString().split('T')[0],
          skills: [],
          isFeatured: false,
        });
      }
    }
  }, [user]);
  
  const profile = getCurrentProfile();
  const displayName = profile?.fullName || user?.displayName || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  
  useEffect(() => {
    const savedProfile = localStorage.getItem("profilePicture");
    if (savedProfile) setProfileImage(savedProfile);
  }, []);

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setProfileImage(imageData);
        localStorage.setItem("profilePicture", imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const recentTransactions = transactions.slice(0, 5);

  const menuSections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Personal Information", onClick: () => setEditOpen(true) },
        { icon: Shield, label: "Verification Status", badge: profile?.verificationTier ? `Tier ${profile.verificationTier}` : "Tier 1", badgeColor: "bg-emerald-500", onClick: () => {} },
        { icon: Bell, label: "Notifications", onClick: () => {} },
      ]
    },
    {
      title: "Wallet & Payments",
      items: [
        { icon: CreditCard, label: "Bank Accounts", onClick: () => {} },
        { icon: History, label: "Transaction History", onClick: () => {} },
      ]
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center", onClick: () => setLocation('/help') },
        { icon: Phone, label: "Contact Support", onClick: () => setLocation('/contact') },
      ]
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleEditProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    if (user) {
      updateProfile(user.uid, {
        fullName: formData.get('fullName') as string || displayName,
        bio: formData.get('bio') as string || '',
        location: formData.get('location') as string || '',
      });
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    }
    setEditOpen(false);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <div className="max-w-lg mx-auto px-4 pb-24">
        {/* Profile Header */}
        <motion.div 
          className="pt-6 pb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar 
                className="w-20 h-20 border-4 border-background shadow-lg cursor-pointer" 
                onClick={() => profileImageInputRef.current?.click()}
              >
                <AvatarImage src={profileImage || profile?.avatarUrl || user?.photoURL || undefined} />
                <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button 
                onClick={() => profileImageInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-1.5 rounded-full border-2 border-background shadow-md"
              >
                <Camera className="w-3 h-3" />
              </button>
              <input 
                ref={profileImageInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleProfileImageUpload} 
                className="hidden" 
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold truncate">{displayName}</h1>
                {(profile?.verificationTier || 0) >= 2 && (
                  <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-chart-4 fill-current" />
                  <span className="text-sm font-medium">{profile?.rating?.toFixed(1) || '0.0'}</span>
                </div>
                <span className="text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground">{profile?.helpsGiven || 0} tasks done</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Wallet Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground border-0 shadow-xl mb-4 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  <span className="font-medium">My Wallet</span>
                </div>
                <Badge className="bg-primary-foreground/20 text-primary-foreground border-0">
                  Active
                </Badge>
              </div>
              
              <div className="mb-5">
                <p className="text-primary-foreground/70 text-sm mb-1">Available Balance</p>
                <p className="text-3xl font-bold font-mono">{formatLocal(availableBalance)}</p>
              </div>
              
              {escrowBalance > 0 && (
                <div className="flex items-center gap-2 text-sm text-primary-foreground/60 mb-4">
                  <Shield className="w-3.5 h-3.5" />
                  <span>{formatLocal(escrowBalance)} locked in escrow</span>
                </div>
              )}
              
              <div className="flex gap-3">
                <Button 
                  className="flex-1 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold h-11"
                  onClick={() => toast({ title: "Coming soon", description: "Deposit functionality will be available soon." })}
                >
                  <ArrowDownLeft className="w-4 h-4 mr-2" />
                  Add Money
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-semibold h-11"
                  onClick={() => toast({ title: "Coming soon", description: "Withdraw functionality will be available soon." })}
                >
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Withdraw
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          className="grid grid-cols-3 gap-3 mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {[
            { label: "Rating", value: profile?.rating?.toFixed(1) || "0.0", icon: Star, color: "text-chart-4" },
            { label: "Tasks", value: profile?.helpsGiven || 0, icon: FileText, color: "text-chart-2" },
            { label: "Rep Score", value: profile?.reputationScore || 0, icon: Shield, color: "text-chart-3" },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-sm mb-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Recent Activity</h3>
                </div>
                <div className="space-y-3">
                  {recentTransactions.map((txn) => (
                    <div key={txn.id} className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        txn.type === 'deposit' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {txn.type === 'deposit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{txn.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(txn.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className={`text-sm font-bold ${
                        txn.type === 'deposit' ? 'text-primary' : 'text-destructive'
                      }`}>
                        {txn.type === 'deposit' ? '+' : '-'}{formatLocal(txn.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + sectionIndex * 0.05 }}
            className="mb-4"
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">{section.title}</h3>
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {section.items.map((item, itemIndex) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left ${
                      itemIndex < section.items.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-muted">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="flex-1 font-medium text-sm">{item.label}</span>
                    {'badge' in item && item.badge && (
                      <Badge className={`${(item as any).badgeColor} text-primary-foreground text-xs`}>
                        {item.badge}
                      </Badge>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button 
            variant="ghost" 
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 h-12"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </motion.div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditProfile}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  name="fullName"
                  defaultValue={profile?.fullName || user?.displayName || ''} 
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  name="location"
                  placeholder="e.g., Lagos, Nigeria"
                  defaultValue={profile?.location || ''} 
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  name="bio"
                  placeholder="Tell us about yourself..."
                  defaultValue={profile?.bio || ''}
                  className="mt-1.5 min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}
