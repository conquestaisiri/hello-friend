import { useState } from "react";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useRoute, useLocation, Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useTasksStore } from "@/stores/tasks-store";
import { useWalletLocalStore } from "@/stores/wallet-local-store";
import { useLocalizationStore } from "@/stores/localization-store";
import { useProfileStore } from "@/stores/profile-store";
import {
  MapPin, Calendar, Clock, Star, ChevronLeft, Check, X,
  Globe, Shield, Users, CheckCircle2, CircleDot, Circle, Play,
  Send, TrendingUp, AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

/* ── helpers ───────────────────────────────────────────────── */
const CATEGORY_LABELS: Record<string, string> = {
  physical_help:"Physical Help", errands:"Errands", tech_help:"Tech Help",
  guidance:"Guidance", transportation:"Transportation", home_repairs:"Home Repairs",
  childcare:"Childcare", pet_care:"Pet Care", tutoring:"Tutoring",
  digital_work:"Digital Work", design:"Design", writing:"Writing",
  programming:"Programming", marketing:"Marketing", research:"Research",
  education:"Education", translation:"Translation", consulting:"Consulting",
  home_services:"Home Services", photography:"Photography",
  event_planning:"Event Planning", fitness:"Fitness & Health",
  cooking:"Cooking & Catering", personal_shopping:"Personal Shopping",
  legal:"Legal & Finance", other:"Other",
};

const CATEGORY_IMAGES: Record<string, string> = {
  design:"https://picsum.photos/seed/design-creative/1200/400",
  writing:"https://picsum.photos/seed/writing-desk/1200/400",
  programming:"https://picsum.photos/seed/code-laptop/1200/400",
  digital_work:"https://picsum.photos/seed/digital-laptop/1200/400",
  marketing:"https://picsum.photos/seed/marketing-team/1200/400",
  tech_help:"https://picsum.photos/seed/tech-support/1200/400",
  physical_help:"https://picsum.photos/seed/moving-help/1200/400",
  home_repairs:"https://picsum.photos/seed/home-repair/1200/400",
  home_services:"https://picsum.photos/seed/home-cleaning/1200/400",
  errands:"https://picsum.photos/seed/errands-shopping/1200/400",
  transportation:"https://picsum.photos/seed/delivery-transport/1200/400",
  education:"https://picsum.photos/seed/study-classroom/1200/400",
  tutoring:"https://picsum.photos/seed/tutoring-student/1200/400",
  photography:"https://picsum.photos/seed/photography-camera/1200/400",
  event_planning:"https://picsum.photos/seed/event-party/1200/400",
  fitness:"https://picsum.photos/seed/fitness-gym/1200/400",
  cooking:"https://picsum.photos/seed/cooking-chef/1200/400",
};

const STATUS_LABELS: Record<string, string> = {
  created:"Draft", published:"Looking for Help", accepted:"Helper Assigned",
  in_progress:"In Progress", completed:"Completed", reviewed:"Reviewed", cancelled:"Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  created:"bg-gray-50 text-gray-600 border-gray-200",
  published:"bg-blue-50 text-blue-700 border-blue-200",
  accepted:"bg-amber-50 text-amber-700 border-amber-200",
  in_progress:"bg-indigo-50 text-indigo-700 border-indigo-200",
  completed:"bg-green-50 text-green-700 border-green-200",
  reviewed:"bg-purple-50 text-purple-700 border-purple-200",
  cancelled:"bg-red-50 text-red-700 border-red-200",
};

const APP_STATUS_COLORS: Record<string, string> = {
  hired:"bg-green-50 text-green-700 border-green-200",
  shortlisted:"bg-amber-50 text-amber-700 border-amber-200",
  rejected:"bg-red-50 text-red-700 border-red-200",
  completed:"bg-emerald-50 text-emerald-700 border-emerald-200",
  sent:"bg-gray-50 text-gray-600 border-gray-200",
  reviewed:"bg-purple-50 text-purple-700 border-purple-200",
};

const statusOrder = ["published","accepted","in_progress","completed"];

function StatusTimeline({ current }: { current: string }) {
  if (current === "cancelled" || current === "created") return null;
  let idx = statusOrder.indexOf(current);
  if (idx === -1) idx = statusOrder.length - 1;
  return (
    <div className="flex items-center justify-between px-2 py-4">
      {statusOrder.map((s, i) => {
        const done = i < idx || current === "reviewed" || current === "completed";
        const now  = i === idx;
        return (
          <div key={s} className="flex flex-col items-center flex-1">
            <div className="flex items-center w-full">
              {i > 0 && <div className={`h-0.5 flex-1 ${done||now ? "bg-[#0C6B38]" : "bg-gray-200"}`} />}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                done ? "bg-[#0C6B38] text-white" : now ? "bg-[#0C6B38] text-white ring-4 ring-[#0C6B38]/20" : "bg-gray-100 text-gray-400"
              }`}>
                {done ? <CheckCircle2 className="w-3 h-3" /> : now ? <CircleDot className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
              </div>
              {i < statusOrder.length - 1 && <div className={`h-0.5 flex-1 ${done ? "bg-[#0C6B38]" : "bg-gray-200"}`} />}
            </div>
            <span className={`text-[10px] mt-1.5 font-medium text-center ${now ? "text-[#0C6B38]" : "text-gray-400"}`}>
              {STATUS_LABELS[s]?.split(" ")[0]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
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
      <div className="min-h-screen bg-[#F8FAF8]">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 pt-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-7 h-7 text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-[#0D0D0D] mb-2">Task not found</h2>
          <p className="text-gray-400 text-sm mb-6">This task may have been removed or the link is invalid.</p>
          <Link href="/discover">
            <button className="text-sm font-semibold px-6 py-3 rounded-xl text-white" style={{ background: "#0C6B38" }}>
              Browse Tasks
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const creatorProfile = getProfileByUserId(task.creatorId);
  const isCreator = user?.uid === task.creatorId;
  const hasApplied = task.applications.some(a => a.workerId === user?.uid);
  const isBatch = task.workerCount > 1;
  const coverImage = CATEGORY_IMAGES[task.category] || `https://picsum.photos/seed/${task.id}/1200/400`;
  const catLabel = CATEGORY_LABELS[task.category] || task.category;
  const statusClass = STATUS_COLORS[task.status] || STATUS_COLORS.created;

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
    setPitchText(""); setOfferAmount(0); setEstimatedTime("");
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
    task.applications.filter(a => a.status === "hired").forEach(a => releaseEscrow(a.offerAmount, a.workerId));
    toast({ title: "Task Completed!", description: "Payment has been released to the worker." });
    setShowReviewDialog(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8]">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 pb-10">

        {/* Back nav */}
        <div className="py-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0C6B38] transition-colors font-medium"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        </div>

        {/* ── Cover image ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="relative rounded-2xl overflow-hidden h-52 mb-4 bg-gray-100">
            <img src={coverImage} alt={catLabel} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 60%)" }} />
            <div className="absolute top-4 left-4">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border bg-white/90 backdrop-blur-sm ${statusClass}`}>
                {STATUS_LABELS[task.status]}
              </span>
            </div>
            <div className="absolute top-4 right-4">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-white/90 backdrop-blur-sm text-gray-700 border-gray-200">
                {catLabel}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Main task card ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <div className="bg-white rounded-2xl p-6 mb-4" style={{ border: "1px solid #F0F0F0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>

            <h1 className="text-2xl font-bold text-[#0D0D0D] mb-3 leading-snug">{task.title}</h1>

            {/* Meta */}
            <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-5">
              {task.location && (
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{task.location}</span>
              )}
              {task.isVirtual && (
                <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />Remote</span>
              )}
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />
                {format(new Date(task.createdAt), "MMM d, yyyy")}
              </span>
              {task.verificationTierRequired >= 2 && (
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-[#0C6B38]" />Tier {task.verificationTierRequired} required</span>
              )}
            </div>

            {/* Budget */}
            {task.rewardAmount && (
              <div className="rounded-xl px-5 py-4 mb-5" style={{ background: "rgba(12,107,56,0.06)", border: "1px solid rgba(12,107,56,0.12)" }}>
                <p className="text-3xl font-bold" style={{ color: "#0C6B38" }}>{formatLocal(task.rewardAmount)}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {task.rewardDescription || "Budget"}{isBatch ? ` × ${task.workerCount} workers` : ""}
                </p>
              </div>
            )}

            {/* Batch progress */}
            {isBatch && (
              <div className="mb-5 p-4 rounded-xl bg-[#F8FAF8] border border-gray-100">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-sm font-medium text-[#0D0D0D] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#0C6B38]" /> Hiring Progress
                  </span>
                  <span className="text-sm font-bold text-[#0C6B38]">{task.slotsFilled}/{task.workerCount}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(task.slotsFilled / task.workerCount) * 100}%`, background: "#0C6B38" }}
                  />
                </div>
                {isCreator && (
                  <Link href={`/batch/${task.id}`}>
                    <button className="w-full mt-3 py-2 text-xs font-semibold rounded-xl border text-[#0C6B38] border-[#0C6B38]/30 hover:bg-[#0C6B38]/5 transition-colors">
                      Open Batch Command Center
                    </button>
                  </Link>
                )}
              </div>
            )}

            {/* Status timeline */}
            {task.status !== "cancelled" && task.status !== "created" && (
              <div className="rounded-xl bg-[#F8FAF8] mb-5 px-3">
                <StatusTimeline current={task.status} />
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-[#0D0D0D] mb-2">Description</h3>
              <p className="text-sm text-gray-500 whitespace-pre-line leading-relaxed">{task.description}</p>
            </div>

            {task.scheduledTime && (
              <div className="flex items-center gap-2 text-sm mt-4 px-4 py-3 rounded-xl bg-[#F8FAF8]">
                <Calendar className="w-4 h-4 text-[#0C6B38]" />
                <span className="font-medium">{format(new Date(task.scheduledTime), "MMMM d, yyyy 'at' h:mm a")}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Posted By ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-white rounded-2xl p-5 mb-4" style={{ border: "1px solid #F0F0F0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">Posted by</h3>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-[#0C6B38] flex items-center justify-center shrink-0">
                {creatorProfile?.avatarUrl ? (
                  <img src={creatorProfile.avatarUrl} alt={task.creatorName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-sm">{task.creatorName?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-[#0D0D0D]">{creatorProfile?.fullName || task.creatorName}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                  {creatorProfile?.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{creatorProfile.rating.toFixed(1)}
                    </span>
                  )}
                  {creatorProfile?.reputationScore && (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />Rep {creatorProfile.reputationScore}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Offers ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <div className="bg-white rounded-2xl mb-4 overflow-hidden" style={{ border: "1px solid #F0F0F0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #F5F5F5" }}>
              <h3 className="text-sm font-semibold text-[#0D0D0D]">Offers ({task.applications.length})</h3>
            </div>

            {task.applications.length === 0 ? (
              <div className="text-center py-10">
                <Send className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No offers yet — be the first!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {task.applications.map((app) => {
                  const appStatusClass = APP_STATUS_COLORS[app.status] || APP_STATUS_COLORS.sent;
                  return (
                    <div key={app.id} className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#0C6B38] overflow-hidden flex items-center justify-center shrink-0">
                          {app.workerAvatar ? (
                            <img src={app.workerAvatar} alt={app.workerName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white text-xs font-bold">{app.workerName[0]}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-semibold text-sm text-[#0D0D0D]">{app.workerName}</p>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${appStatusClass}`}>
                              {app.status}
                            </span>
                          </div>
                          <div className="flex items-center flex-wrap gap-2 text-xs text-gray-400 mb-2">
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{app.workerRating}
                            </span>
                            <span>·</span>
                            <span className="font-bold" style={{ color: "#0C6B38" }}>{formatLocal(app.offerAmount)}</span>
                            <span>·</span>
                            <span>{app.estimatedTime}</span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{app.pitchText}</p>

                          {isCreator && (app.status === "sent" || app.status === "reviewed" || app.status === "shortlisted") && (
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleAcceptOffer(app.id)}
                                className="flex items-center gap-1 text-xs font-semibold px-3.5 py-1.5 rounded-lg text-white transition-all"
                                style={{ background: "#0C6B38" }}
                              >
                                <Check className="w-3 h-3" /> Hire
                              </button>
                              <button
                                onClick={() => handleDeclineOffer(app.id)}
                                className="flex items-center gap-1 text-xs font-semibold px-3.5 py-1.5 rounded-lg text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                              >
                                <X className="w-3 h-3" /> Decline
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Action Buttons ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="space-y-3">
          {!isCreator && !hasApplied && task.status === "published" && (
            <button
              className="w-full flex items-center justify-center gap-2 py-3.5 text-base font-semibold rounded-2xl text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #0C6B38, #0a5a30)", boxShadow: "0 4px 14px rgba(12,107,56,0.3)" }}
              onClick={() => { setOfferAmount(task.rewardAmount || 0); setShowOfferDialog(true); }}
            >
              <Send className="w-4 h-4" /> Submit Your Offer
            </button>
          )}

          {hasApplied && (
            <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(12,107,56,0.06)", border: "1px solid rgba(12,107,56,0.15)" }}>
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color: "#0C6B38" }} />
              <p className="font-semibold text-sm" style={{ color: "#0C6B38" }}>You've submitted an offer!</p>
              <p className="text-xs text-gray-400 mt-1">Check back soon for updates from the task owner.</p>
            </div>
          )}

          {isCreator && task.status === "accepted" && (
            <button
              className="w-full flex items-center justify-center gap-2 py-3.5 font-semibold rounded-2xl text-white transition-all"
              style={{ background: "#0C6B38" }}
              onClick={() => updateTaskStatus(task.id, "in_progress")}
            >
              <Play className="w-4 h-4" /> Mark as In Progress
            </button>
          )}

          {isCreator && task.status === "in_progress" && (
            <button
              className="w-full flex items-center justify-center gap-2 py-3.5 font-semibold rounded-2xl text-white transition-all"
              style={{ background: "linear-gradient(135deg, #059669, #047857)" }}
              onClick={handleCompleteTask}
            >
              <CheckCircle2 className="w-4 h-4" /> Complete & Release Payment
            </button>
          )}
        </motion.div>
      </div>

      {/* ── Submit Offer Dialog ── */}
      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Submit Your Offer</DialogTitle>
            <DialogDescription className="text-sm text-gray-400">
              Write a compelling pitch (minimum 200 characters)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-1">
            <div>
              <label className="text-sm font-semibold text-[#0D0D0D] block mb-1.5">Your Pitch *</label>
              <Textarea
                placeholder="Explain why you're the best fit — share your experience, skills, and availability..."
                value={pitchText}
                onChange={e => setPitchText(e.target.value)}
                className="min-h-[140px] text-sm resize-none rounded-xl border-gray-200"
              />
              <p className={`text-xs mt-1 ${pitchText.length < 200 ? "text-red-500" : "text-[#0C6B38]"}`}>
                {pitchText.length}/200 {pitchText.length < 200 ? "characters needed" : "✓ Good to go"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-[#0D0D0D] block mb-1.5">
                  Your Price (₦)
                </label>
                <Input
                  type="number"
                  value={offerAmount || ""}
                  onChange={e => setOfferAmount(parseInt(e.target.value) || 0)}
                  className="rounded-xl border-gray-200 text-sm"
                  placeholder="e.g. 50000"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#0D0D0D] block mb-1.5">Est. Time</label>
                <Input
                  placeholder="e.g. 4 hours"
                  value={estimatedTime}
                  onChange={e => setEstimatedTime(e.target.value)}
                  className="rounded-xl border-gray-200 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowOfferDialog(false)}
                className="flex-1 py-3 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitOffer}
                disabled={pitchText.length < 200}
                className="flex-1 py-3 text-sm font-semibold rounded-xl text-white transition-all disabled:opacity-40"
                style={{ background: "#0C6B38" }}
              >
                Submit Offer
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Review Dialog ── */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-sm rounded-3xl text-center">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Leave a Review</DialogTitle>
            <DialogDescription className="text-sm text-gray-400">How was your experience?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex justify-center gap-2">
              {[1,2,3,4,5].map(s => (
                <Star
                  key={s}
                  className={`w-9 h-9 cursor-pointer transition-colors ${s <= reviewRating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                  onClick={() => setReviewRating(s)}
                />
              ))}
            </div>
            <Textarea
              placeholder="Share your experience with this worker..."
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              className="rounded-xl border-gray-200 text-sm"
            />
            <button
              className="w-full py-3 text-sm font-semibold rounded-xl text-white"
              style={{ background: "#0C6B38" }}
              onClick={() => { setShowReviewDialog(false); toast({ title: "Review submitted! Thank you." }); }}
            >
              Submit Review
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
