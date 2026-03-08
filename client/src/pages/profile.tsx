import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useProfileStore } from "@/stores/profile-store";
import { useToast } from "@/hooks/use-toast";
import {
  Star, ShieldCheck, Edit2, MapPin, Calendar, CheckCircle,
  Briefcase, Clock, TrendingUp, Camera, Award
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

function ProfilePageContent() {
  const [editOpen, setEditOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useFirebaseAuth();
  const { getCurrentProfile, updateProfile, createProfile, setCurrentUser } = useProfileStore();

  useEffect(() => {
    if (user) {
      setCurrentUser(user.uid);
      const existing = useProfileStore.getState().getProfileByUserId(user.uid);
      if (!existing) {
        createProfile({
          id: `prof-${user.uid}`, userId: user.uid,
          fullName: user.displayName || "User", email: user.email || "",
          bio: "", avatarUrl: user.photoURL, location: "", country: "NG",
          baseCurrency: "NGN", rating: 0, ratingCount: 0, reputationScore: 100,
          verificationTier: 1, helpsGiven: 0, helpsReceived: 0,
          successRate: 0, onTimeRate: 0, responseTime: "N/A",
          joinedAt: new Date().toISOString().split("T")[0], skills: [], isFeatured: false,
        });
      }
    }
  }, [user]);

  const profile = getCurrentProfile();
  const displayName = profile?.fullName || user?.displayName || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => {
    const saved = localStorage.getItem("profilePicture");
    if (saved) setProfileImage(saved);
  }, []);

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result as string;
        setProfileImage(data);
        localStorage.setItem("profilePicture", data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    if (user) {
      updateProfile(user.uid, {
        fullName: (formData.get("fullName") as string) || displayName,
        bio: (formData.get("bio") as string) || "",
        location: (formData.get("location") as string) || "",
        skills: (formData.get("skills") as string)?.split(",").map((s) => s.trim()).filter(Boolean) || [],
      });
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    }
    setEditOpen(false);
  };

  const statsData = [
    { label: "Tasks Completed", value: profile?.helpsGiven || 0, icon: CheckCircle, color: "text-chart-2" },
    { label: "Success Rate", value: `${profile?.successRate || 0}%`, icon: TrendingUp, color: "text-primary" },
    { label: "On-Time Rate", value: `${profile?.onTimeRate || 0}%`, icon: Clock, color: "text-chart-4" },
    { label: "Response Time", value: profile?.responseTime || "N/A", icon: Briefcase, color: "text-accent" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border mb-6">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-background shadow-xl cursor-pointer" onClick={() => profileImageInputRef.current?.click()}>
                    <AvatarImage src={profileImage || profile?.avatarUrl || user?.photoURL || undefined} />
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-accent text-primary-foreground">{initials}</AvatarFallback>
                  </Avatar>
                  <button onClick={() => profileImageInputRef.current?.click()} className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-2 rounded-full border-2 border-background shadow-md">
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input ref={profileImageInputRef} type="file" accept="image/*" onChange={handleProfileImageUpload} className="hidden" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
                    {(profile?.verificationTier || 0) >= 2 && <ShieldCheck className="w-5 h-5 text-primary" />}
                  </div>
                  <p className="text-muted-foreground text-sm mb-2">{user?.email}</p>
                  {profile?.location && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <MapPin className="w-4 h-4" /> {profile.location}
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-chart-4 text-chart-4" />
                      <span className="text-sm font-semibold">{profile?.rating?.toFixed(1) || "0.0"}</span>
                      <span className="text-xs text-muted-foreground">({profile?.ratingCount || 0} reviews)</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <Award className="w-3 h-3 mr-1" />
                      Tier {profile?.verificationTier || 1}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Joined {profile?.joinedAt || "recently"}
                    </span>
                  </div>
                </div>

                <Button variant="outline" onClick={() => setEditOpen(true)} className="gap-2 rounded-xl">
                  <Edit2 size={14} /> Edit Profile
                </Button>
              </div>

              {profile?.bio && (
                <p className="mt-4 text-sm text-muted-foreground border-t border-border pt-4">{profile.bio}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {statsData.map((stat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{stat.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Reputation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Reputation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Reputation Score</span>
                  <span className="text-sm font-bold text-primary">{profile?.reputationScore || 0}</span>
                </div>
                <Progress value={Math.min((profile?.reputationScore || 0) / 10, 100)} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Reliability</span>
                  <span className="text-sm font-semibold">{profile?.onTimeRate || 0}%</span>
                </div>
                <Progress value={profile?.onTimeRate || 0} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skills */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Skills</CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.skills && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="rounded-full px-3 py-1">{skill}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No skills added yet. Edit your profile to add skills.</p>
            )}
          </CardContent>
        </Card>

        {/* Reviews placeholder */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Star className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-muted-foreground text-sm">No reviews yet</p>
              <p className="text-xs text-muted-foreground mt-1">Complete tasks to receive your first review</p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditProfile}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" name="fullName" defaultValue={profile?.fullName || user?.displayName || ""} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" placeholder="e.g., London, UK" defaultValue={profile?.location || ""} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" name="bio" placeholder="Tell us about yourself..." defaultValue={profile?.bio || ""} className="mt-1.5 min-h-[100px]" />
              </div>
              <div>
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Input id="skills" name="skills" placeholder="e.g., React, Design, Writing" defaultValue={profile?.skills?.join(", ") || ""} className="mt-1.5" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
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
