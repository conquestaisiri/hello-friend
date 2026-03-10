import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin, Star, ShieldCheck, MessageSquare, Calendar, 
  ChevronLeft, Award, Briefcase, Users, Clock, TrendingUp, CheckCircle
} from "lucide-react";
import { useRoute, useLocation, Link } from "wouter";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function PublicProfilePage() {
  const { user, getIdToken } = useFirebaseAuth();
  const [, params] = useRoute("/public-profile/:userId");
  const [, navigate] = useLocation();
  const userId = params?.userId;

  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const handleSendMessage = async () => {
    if (!user) {
      navigate("/auth?mode=login");
      return;
    }
    navigate(`/messages?with=${userId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 pt-6">
          <Skeleton className="h-40 w-full rounded-xl mb-4" />
          <Skeleton className="h-24 w-full rounded-xl mb-4" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 pt-20 text-center">
          <p className="text-muted-foreground mb-4">Profile not found</p>
          <Link href="/discover">
            <Button>Back to Discover</Button>
          </Link>
        </div>
      </div>
    );
  }

  const displayName = profile.full_name || "User";
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const joinYear = profile.created_at ? new Date(profile.created_at).getFullYear() : new Date().getFullYear();
  const verificationTier = profile.verification_tier || 1;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-lg mx-auto px-4 pb-8">
        <motion.div className="py-4" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </motion.div>

        {/* Profile Header Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-lg mb-4 overflow-hidden">
            <div className="bg-gradient-to-br from-primary to-accent h-20" />
            <CardContent className="pt-0 pb-6 px-4 -mt-10">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-20 h-20 border-4 border-background shadow-lg mb-3">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
                  {verificationTier >= 2 && (
                    <Badge className="bg-primary/10 text-primary text-xs">
                      <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                    </Badge>
                  )}
                </div>
                
                {profile.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                    <MapPin className="w-3 h-3" /> {profile.location}
                  </p>
                )}
                
                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(Number(profile.rating) || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-bold">{(Number(profile.rating) || 0).toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">
                    ({profile.rating_count || 0} reviews)
                  </span>
                </div>
                
                {profile.bio && (
                  <p className="text-sm text-muted-foreground mb-4 max-w-xs">{profile.bio}</p>
                )}

                {/* Skills */}
                {profile.skills && profile.skills.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                    {profile.skills.map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                )}
                
                <Button onClick={handleSendMessage} className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" /> Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div className="grid grid-cols-3 gap-3 mb-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <Briefcase className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{(profile.helps_given || 0) + (profile.helps_received || 0)}</p>
              <p className="text-xs text-muted-foreground">Tasks</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{profile.success_rate || 100}%</p>
              <p className="text-xs text-muted-foreground">Success</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{profile.on_time_rate || 100}%</p>
              <p className="text-xs text-muted-foreground">On Time</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detailed Metrics */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-0 shadow-sm mb-4">
            <CardContent className="p-4 space-y-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Award className="w-4 h-4" /> Performance
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Response Time</p>
                  <p className="text-sm font-bold">{profile.response_time || "< 1 hour"}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Reputation Score</p>
                  <p className="text-sm font-bold">{profile.reputation_score || 0} pts</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Helps Given</p>
                  <p className="text-sm font-bold">{profile.helps_given || 0}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Member Since</p>
                  <p className="text-sm font-bold">{joinYear}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Reviews placeholder */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <h2 className="font-semibold flex items-center gap-2 mb-4">
                <Star className="w-4 h-4" /> Reviews
              </h2>
              <p className="text-sm text-muted-foreground text-center py-6">
                No reviews yet
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
