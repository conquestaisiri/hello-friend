import { useState } from "react";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useRoute, useLocation, Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useTasksStore } from "@/stores/tasks-store";
import { useWalletLocalStore } from "@/stores/wallet-local-store";
import { useLocalizationStore } from "@/stores/localization-store";
import { useProfileStore } from "@/stores/profile-store";
import { 
  MapPin, Calendar, Clock, Star, ChevronLeft, User, Check, X, 
  Globe, Shield, Users, CheckCircle2, CircleDot, Circle, Play,
  MessageSquare, Send, TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const categoryLabels: Record<string, string> = {
  physical_help: "Physical Help", errands: "Errands", tech_help: "Tech Help",
  guidance: "Guidance", transportation: "Transportation", home_repairs: "Home Repairs",
  childcare: "Childcare", pet_care: "Pet Care", tutoring: "Tutoring", other: "Other",
};

const statusLabels: Record<string, string> = {
  created: "Draft", published: "Looking for Help", accepted: "Helper Assigned",
  in_progress: "In Progress", completed: "Completed", reviewed: "Reviewed", cancelled: "Cancelled",
};

const statusColors: Record<string, string> = {
  created: "bg-slate-100 text-slate-800", published: "bg-blue-100 text-blue-800",
  accepted: "bg-amber-100 text-amber-800", in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800", reviewed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusOrder = ["published", "accepted", "in_progress", "completed"];

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  if (currentStatus === "cancelled" || currentStatus === "created") return null;
  let currentIndex = statusOrder.indexOf(currentStatus);
  if (currentIndex === -1) currentIndex = statusOrder.length - 1;
  return (
    <div className="flex items-center justify-between px-2">
      {statusOrder.map((status, index) => {
        const isCompleted = index < currentIndex || currentStatus === "reviewed" || currentStatus === "completed";
        const isCurrent = index === currentIndex;
        return (
          <div key={status} className="flex flex-col items-center flex-1">
            <div className="flex items-center w-full">
              {index > 0 && <div className={`h-0.5 flex-1 ${isCompleted || isCurrent ? 'bg-primary' : 'bg-muted'}`} />}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                isCompleted ? 'bg-primary text-primary-foreground' : isCurrent ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' : 'bg-muted text-muted-foreground'
              }`}>
                {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : isCurrent ? <CircleDot className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
              </div>
              {index < statusOrder.length - 1 && <div className={`h-0.5 flex-1 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
            <span className={`text-[10px] mt-1 text-center ${isCurrent ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
              {statusLabels[status]?.split(' ')[0]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function RequestDetails() {
  const [, params] = useRoute("/request/:id");
  const [, navigate] = useLocation();
  const { user } = useFirebaseAuth();
  const { toast } = useToast();
  const taskId = params?.id;
  
  const task = useTasksStore((s) => s.getTaskById(taskId || ""));
  const { updateApplicationStatus, submitApplication, updateTaskStatus } = useTasksStore();
  const { lockEscrow, releaseEscrow } = useWalletLocalStore();
  const { formatLocal } = useLocalizationStore();
  const { getProfileByUserId } = useProfileStore();
  
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [pitchText, setPitchText] = useState("");
  const [offerAmount, setOfferAmount] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState("");
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  if (!task) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 pt-20 text-center">
          <p className="text-muted-foreground mb-4">Request not found</p>
          <Link href="/discover"><Button>Browse Tasks</Button></Link>
        </div>
      </div>
    );
  }

  const creatorProfile = getProfileByUserId(task.creatorId);
  const isCreator = user?.uid === task.creatorId;
  const hasApplied = task.applications.some(a => a.workerId === user?.uid);
  const isBatch = task.workerCount > 1;

  const handleSubmitOffer = () => {
    if (pitchText.length < 200) {
      toast({ title: "Pitch too short", description: "Minimum 200 characters required.", variant: "destructive" });
      return;
    }
    submitApplication(task.id, {
      taskId: task.id,
      workerId: user?.uid || "anon",
      workerName: user?.displayName || "Anonymous",
      workerAvatar: user?.photoURL || "",
      workerRating: 4.5,
      workerReputation: 500,
      pitchText,
      portfolioTaskIds: [],
      offerAmount: offerAmount || task.rewardAmount || 0,
      estimatedTime: estimatedTime || "TBD",
    });
    toast({ title: "Offer Submitted!", description: "The task owner will review your pitch." });
    setShowOfferDialog(false);
    setPitchText("");
    setOfferAmount(0);
    setEstimatedTime("");
  };

  const handleAcceptOffer = (appId: string) => {
    const app = task.applications.find(a => a.id === appId);
    if (!app) return;
    updateApplicationStatus(task.id, appId, "hired");
    lockEscrow(app.offerAmount, `Escrow for ${app.workerName}`);
    toast({ title: "Worker Hired!", description: `${formatLocal(app.offerAmount)} locked in escrow.` });
  };

  const handleDeclineOffer = (appId: string) => {
    updateApplicationStatus(task.id, appId, "rejected");
    toast({ title: "Offer Declined" });
  };

  const handleCompleteTask = () => {
    updateTaskStatus(task.id, "completed");
    task.applications.filter(a => a.status === "hired").forEach(a => {
      releaseEscrow(a.offerAmount, a.workerId);
    });
    toast({ title: "Task Completed!", description: "Payment has been released." });
    setShowReviewDialog(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <motion.div className="py-4" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </motion.div>

        {/* Main Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-lg mb-4">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className={statusColors[task.status]}>{statusLabels[task.status]}</Badge>
                <Badge variant="outline">{categoryLabels[task.category] || task.category}</Badge>
                {task.verificationTierRequired >= 2 && (
                  <Badge variant="outline"><Shield className="w-3 h-3 mr-1" /> Tier {task.verificationTierRequired}</Badge>
                )}
                {task.sector === "web3_digital" && (
                  <Badge className="bg-purple-100 text-purple-700"><Globe className="w-3 h-3 mr-1" /> Digital</Badge>
                )}
              </div>
              
              <h1 className="text-2xl font-bold mb-3">{task.title}</h1>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
                {task.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{task.location}</span>}
                {task.isVirtual && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />Remote</span>}
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(task.createdAt), "MMM d")}</span>
              </div>
              
              {task.rewardAmount && (
                <div className="bg-primary/5 px-4 py-3 rounded-lg mb-4">
                  <p className="text-2xl font-bold text-primary">{formatLocal(task.rewardAmount)}</p>
                  <p className="text-xs text-primary/70">{task.rewardDescription || "Reward"}{isBatch ? ` × ${task.workerCount} workers` : ""}</p>
                </div>
              )}

              {/* Batch Progress */}
              {isBatch && (
                <div className="mb-4 p-4 bg-accent/5 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4 text-accent" /> Hiring Progress
                    </span>
                    <span className="text-sm font-bold">{task.slotsFilled}/{task.workerCount}</span>
                  </div>
                  <Progress value={(task.slotsFilled / task.workerCount) * 100} className="h-2.5" />
                  {isCreator && (
                    <Link href={`/batch/${task.id}`}>
                      <Button variant="outline" size="sm" className="mt-3 w-full">
                        <Users className="w-4 h-4 mr-2" /> Open Batch Command Center
                      </Button>
                    </Link>
                  )}
                </div>
              )}

              {task.status !== "cancelled" && task.status !== "created" && (
                <div className="mb-4 py-3 bg-muted/50 rounded-lg">
                  <StatusTimeline currentStatus={task.status} />
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="font-semibold text-sm mb-2">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{task.description}</p>
              </div>

              {task.scheduledTime && (
                <div className="flex items-center gap-2 text-sm bg-muted/50 p-3 rounded-lg mb-4">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{format(new Date(task.scheduledTime), "MMMM d, yyyy 'at' h:mm a")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Creator Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-0 shadow-sm mb-4">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3">Posted by</h3>
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={creatorProfile?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">{task.creatorName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">{creatorProfile?.fullName || task.creatorName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {creatorProfile?.rating && (
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{creatorProfile.rating.toFixed(1)}</span>
                    )}
                    {creatorProfile?.reputationScore && (
                      <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />Rep: {creatorProfile.reputationScore}</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Applications */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-sm mb-4">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3">
                Offers ({task.applications.length})
              </h3>
              {task.applications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No offers yet. Be the first!</p>
              ) : (
                <div className="space-y-3">
                  {task.applications.map((app) => (
                    <div key={app.id} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={app.workerAvatar} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">{app.workerName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-medium text-sm">{app.workerName}</p>
                            <Badge className={`text-xs ${
                              app.status === "hired" ? "bg-green-100 text-green-700" :
                              app.status === "shortlisted" ? "bg-amber-100 text-amber-700" :
                              app.status === "rejected" ? "bg-red-100 text-red-700" :
                              app.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                              "bg-slate-100 text-slate-700"
                            }`}>{app.status}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{app.workerRating}</span>
                            <span>•</span>
                            <Shield className="w-3 h-3" />
                            <span>Rep: {app.workerReputation}</span>
                            <span>•</span>
                            <span className="font-semibold text-primary">{formatLocal(app.offerAmount)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{app.pitchText}</p>
                          
                          {isCreator && (app.status === "sent" || app.status === "reviewed" || app.status === "shortlisted") && (
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleAcceptOffer(app.id)}>
                                <Check className="w-3 h-3 mr-1" /> Hire
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={() => handleDeclineOffer(app.id)}>
                                <X className="w-3 h-3 mr-1" /> Decline
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="space-y-3">
          {!isCreator && !hasApplied && task.status === "published" && (
            <Button className="w-full h-12 text-base" onClick={() => { setOfferAmount(task.rewardAmount || 0); setShowOfferDialog(true); }}>
              <Send className="w-4 h-4 mr-2" /> Submit Your Offer
            </Button>
          )}
          {hasApplied && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="font-semibold text-primary">You've submitted an offer!</p>
                <p className="text-xs text-muted-foreground">Check back for updates.</p>
              </CardContent>
            </Card>
          )}
          {isCreator && task.status === "accepted" && (
            <Button className="w-full" onClick={() => updateTaskStatus(task.id, "in_progress")}>
              <Play className="w-4 h-4 mr-2" /> Start Task
            </Button>
          )}
          {isCreator && task.status === "in_progress" && (
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleCompleteTask}>
              <CheckCircle2 className="w-4 h-4 mr-2" /> Complete & Release Payment
            </Button>
          )}
        </motion.div>
      </div>

      {/* Submit Offer Dialog */}
      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit Your Offer</DialogTitle>
            <DialogDescription>Write a compelling pitch (min. 200 characters)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Your Pitch *</label>
              <Textarea
                placeholder="Explain why you're the best fit for this task. Share your experience, skills, and availability..."
                value={pitchText}
                onChange={(e) => setPitchText(e.target.value)}
                className="min-h-[150px] mt-1"
              />
              <p className={`text-xs mt-1 ${pitchText.length < 200 ? 'text-red-500' : 'text-green-600'}`}>
                {pitchText.length}/200 characters {pitchText.length < 200 ? '(minimum required)' : '✓'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Your Price ({useLocalizationStore.getState().currency.symbol})</label>
                <Input type="number" value={offerAmount || ""} onChange={(e) => setOfferAmount(parseInt(e.target.value) || 0)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Estimated Time</label>
                <Input placeholder="e.g., 4 hours" value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowOfferDialog(false)}>Cancel</Button>
              <Button onClick={handleSubmitOffer} disabled={pitchText.length < 200}>
                <Send className="w-4 h-4 mr-2" /> Submit Offer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
            <DialogDescription>How was your experience?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-8 h-8 cursor-pointer transition-colors ${s <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`}
                  onClick={() => setReviewRating(s)}
                />
              ))}
            </div>
            <Textarea placeholder="Share your experience..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
            <Button className="w-full" onClick={() => { setShowReviewDialog(false); toast({ title: "Review submitted!" }); }}>
              Submit Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
