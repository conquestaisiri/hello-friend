import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useProfileStore } from "@/stores/profile-store";
import { useToast } from "@/hooks/use-toast";
import {
  Star, ShieldCheck, Edit2, MapPin, Calendar, CheckCircle,
  Clock, TrendingUp, Camera, Award, Briefcase
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

/* ── Green progress bar ── */
function GreenBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(value, 100)}%`, background: "#0C6B38" }} />
    </div>
  );
}

/* ── Sample reviews for new users ── */
const SAMPLE_REVIEWS = [
  { name: "Tunde A.", avatar: "https://i.pravatar.cc/40?img=11", text: "Very responsive and professional. Got the job done ahead of schedule.", rating: 5, ago: "2w ago" },
  { name: "Chioma B.", avatar: "https://i.pravatar.cc/40?img=25", text: "Great communicator, highly recommend for anyone who needs a reliable helper.", rating: 5, ago: "1mo ago" },
];

/* ═══════════════════════════════════════════════════════════ */
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

  useEffect(() => {
    const saved = localStorage.getItem("profilePicture");
    if (saved) setProfileImage(saved);
  }, []);

  const profile = getCurrentProfile();
  const displayName = profile?.fullName || user?.displayName || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const avatarSrc = profileImage || profile?.avatarUrl || user?.photoURL;

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = evt.target?.result as string;
        setProfileImage(data);
        localStorage.setItem("profilePicture", data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    if (user) {
      updateProfile(user.uid, {
        fullName: (fd.get("fullName") as string) || displayName,
        bio: (fd.get("bio") as string) || "",
        location: (fd.get("location") as string) || "",
        skills: (fd.get("skills") as string)?.split(",").map(s => s.trim()).filter(Boolean) || [],
      });
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    }
    setEditOpen(false);
  };

  const tier = profile?.verificationTier || 1;
  const repScore = profile?.reputationScore || 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF8]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full">

        {/* ── Profile Header ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-white rounded-3xl overflow-hidden mb-6" style={{ border: "1px solid #F0F0F0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            {/* Cover banner */}
            <div className="h-28 w-full relative" style={{ background: "linear-gradient(135deg, #0C6B38 0%, #0a5a30 60%, #084a27 100%)" }}>
              <div className="absolute top-0 right-0 w-60 h-60 rounded-full opacity-10 bg-white" style={{ transform: "translate(30%,-30%)" }} />
            </div>

            <div className="px-6 pb-6">
              {/* Avatar */}
              <div className="flex items-end justify-between -mt-12 mb-4">
                <div className="relative">
                  <div
                    className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-xl cursor-pointer bg-[#0C6B38] flex items-center justify-center"
                    onClick={() => profileImageInputRef.current?.click()}
                  >
                    {avatarSrc ? (
                      <img src={avatarSrc} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-2xl font-bold">{initials}</span>
                    )}
                  </div>
                  <button
                    onClick={() => profileImageInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-md border-2 border-white"
                    style={{ background: "#0C6B38" }}
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input ref={profileImageInputRef} type="file" accept="image/*" onChange={handleProfileImageUpload} className="hidden" />
                </div>

                <button
                  onClick={() => setEditOpen(true)}
                  className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border border-gray-200 text-[#0D0D0D] hover:bg-gray-50 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                </button>
              </div>

              {/* Name + badges */}
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-[#0D0D0D]">{displayName}</h1>
                {tier >= 2 && <ShieldCheck className="w-5 h-5" style={{ color: "#0C6B38" }} />}
              </div>
              <p className="text-sm text-gray-400 mb-3">{user?.email}</p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-4">
                {profile?.location && (
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.location}</span>
                )}
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Joined {profile?.joinedAt || "recently"}</span>
                <span className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-[#0D0D0D]">{profile?.rating?.toFixed(1) || "0.0"}</span>
                  <span>({profile?.ratingCount || 0} reviews)</span>
                </span>
                <span
                  className="flex items-center gap-1 font-semibold px-2.5 py-1 rounded-full text-white text-[11px]"
                  style={{ background: "#0C6B38" }}
                >
                  <Award className="w-3 h-3" /> Tier {tier}
                </span>
              </div>

              {profile?.bio && (
                <p className="text-sm text-gray-500 leading-relaxed">{profile.bio}</p>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5 mb-5">
          {/* ── Performance stats ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
            <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #F0F0F0" }}>
              <h2 className="text-sm font-semibold text-[#0D0D0D] mb-4">Performance</h2>
              <div className="space-y-4">
                {[
                  { label: "Tasks Completed", value: profile?.helpsGiven || 0, icon: CheckCircle, color: "#059669" },
                  { label: "Success Rate",    value: `${profile?.successRate || 0}%`, icon: TrendingUp, color: "#0C6B38" },
                  { label: "On-Time Rate",    value: `${profile?.onTimeRate || 0}%`,  icon: Clock,      color: "#1d4ed8" },
                  { label: "Response Time",   value: profile?.responseTime || "N/A",  icon: Briefcase,  color: "#d97706" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                        <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                      </div>
                      <span className="text-sm text-gray-500">{s.label}</span>
                    </div>
                    <span className="text-sm font-bold text-[#0D0D0D]">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Reputation ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #F0F0F0" }}>
              <h2 className="text-sm font-semibold text-[#0D0D0D] mb-4">Reputation</h2>
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Reputation Score</span>
                    <span className="text-sm font-bold" style={{ color: "#0C6B38" }}>{repScore}</span>
                  </div>
                  <GreenBar value={Math.min(repScore / 10, 100)} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Reliability</span>
                    <span className="text-sm font-bold text-[#0D0D0D]">{profile?.onTimeRate || 0}%</span>
                  </div>
                  <GreenBar value={profile?.onTimeRate || 0} />
                </div>

                {/* Tier progress */}
                <div className="rounded-xl p-4 mt-2" style={{ background: "rgba(12,107,56,0.06)", border: "1px solid rgba(12,107,56,0.12)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold" style={{ color: "#0C6B38" }}>Verification Tier {tier}</span>
                    {tier < 3 && <span className="text-xs text-gray-400">Next: Tier {tier + 1}</span>}
                  </div>
                  <GreenBar value={(tier / 3) * 100} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Skills ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-white rounded-2xl p-5 mb-5" style={{ border: "1px solid #F0F0F0" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#0D0D0D]">Skills</h2>
              <button onClick={() => setEditOpen(true)} className="text-xs font-medium" style={{ color: "#0C6B38" }}>Add skills</button>
            </div>
            {profile?.skills && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="text-xs font-medium px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(12,107,56,0.08)", color: "#0C6B38", border: "1px solid rgba(12,107,56,0.15)" }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-400">No skills yet.</p>
                <button
                  onClick={() => setEditOpen(true)}
                  className="mt-2 text-xs font-semibold underline"
                  style={{ color: "#0C6B38" }}
                >
                  Add your skills
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Reviews ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #F0F0F0" }}>
            <h2 className="text-sm font-semibold text-[#0D0D0D] mb-4">Reviews</h2>
            {(profile?.ratingCount || 0) === 0 ? (
              <div className="space-y-4">
                {SAMPLE_REVIEWS.map((r, i) => (
                  <div key={i} className="p-4 rounded-xl bg-[#F8FAF8]">
                    <div className="flex items-center gap-3 mb-2">
                      <img src={r.avatar} alt={r.name} className="w-8 h-8 rounded-full object-cover" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-[#0D0D0D]">{r.name}</p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: r.rating }).map((_, s) => (
                            <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                          <span className="text-xs text-gray-400 ml-1">{r.ago}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{r.text}</p>
                  </div>
                ))}
                <p className="text-xs text-gray-400 text-center pt-1">Sample reviews — complete tasks to earn real ones.</p>
              </div>
            ) : (
              <div className="text-center py-10">
                <Star className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                <p className="text-sm text-gray-400">No reviews yet</p>
                <p className="text-xs text-gray-400 mt-1">Complete tasks to receive your first review</p>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      <Footer />

      {/* ── Edit Profile Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditProfile}>
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="fullName" className="text-sm font-semibold text-[#0D0D0D]">Full Name</Label>
                <Input id="fullName" name="fullName" defaultValue={profile?.fullName || user?.displayName || ""} className="mt-1.5 rounded-xl border-gray-200" />
              </div>
              <div>
                <Label htmlFor="location" className="text-sm font-semibold text-[#0D0D0D]">Location</Label>
                <Input id="location" name="location" placeholder="e.g., Lagos, Nigeria" defaultValue={profile?.location || ""} className="mt-1.5 rounded-xl border-gray-200" />
              </div>
              <div>
                <Label htmlFor="bio" className="text-sm font-semibold text-[#0D0D0D]">Bio</Label>
                <Textarea id="bio" name="bio" placeholder="Tell people about yourself, your experience and skills..." defaultValue={profile?.bio || ""} className="mt-1.5 min-h-[100px] rounded-xl border-gray-200" />
              </div>
              <div>
                <Label htmlFor="skills" className="text-sm font-semibold text-[#0D0D0D]">Skills <span className="font-normal text-gray-400">(comma-separated)</span></Label>
                <Input id="skills" name="skills" placeholder="e.g., React, Design, Writing" defaultValue={profile?.skills?.join(", ") || ""} className="mt-1.5 rounded-xl border-gray-200" />
              </div>
            </div>
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="flex-1 py-3 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 text-sm font-semibold rounded-xl text-white transition-all hover:opacity-90"
                style={{ background: "#0C6B38" }}
              >
                Save Changes
              </button>
            </div>
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
