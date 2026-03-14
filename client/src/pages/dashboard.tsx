import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  Plus, Search, ClipboardList, Wallet, TrendingUp,
  Star, Clock, CheckCircle, ArrowRight, Bell,
  BarChart3, Activity, Eye, EyeOff, ChevronRight
} from "lucide-react";
import { Link, Redirect } from "wouter";
import { motion } from "framer-motion";
import { useTasksStore } from "@/stores/tasks-store";
import { useProfileStore } from "@/stores/profile-store";
import { useLocalizationStore } from "@/stores/localization-store";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useWallet } from "@/hooks/use-wallet";
import { useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  published:   "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  accepted:    "bg-indigo-50 text-indigo-700 border-indigo-200",
  completed:   "bg-green-50 text-green-700 border-green-200",
  cancelled:   "bg-red-50 text-red-700 border-red-200",
  created:     "bg-gray-50 text-gray-600 border-gray-200",
  reviewed:    "bg-purple-50 text-purple-700 border-purple-200",
};

export default function Dashboard() {
  const { user } = useFirebaseAuth();
  const { availableBalance, escrowBalance } = useWallet();
  const { formatLocal } = useLocalizationStore();
  const tasks = useTasksStore((s) => s.tasks);
  const currentProfile = useProfileStore((s) => s.getCurrentProfile());
  const [hideBalance, setHideBalance] = useState(false);

  if (!user) return <Redirect to="/auth" />;

  const displayName = user.displayName || currentProfile?.fullName || "User";
  const firstName = displayName.split(" ")[0];
  const avatar = user.photoURL || null;
  const initials = displayName.charAt(0).toUpperCase();

  const myTasks = tasks.filter((t) => t.creatorId === user.uid);
  const myApplications = tasks.filter((t) => t.applications.some((a) => a.workerId === user.uid));
  const activeTasks = myTasks.filter((t) => ["published", "in_progress", "accepted"].includes(t.status));
  const completedTasks = myTasks.filter((t) => t.status === "completed");
  const pendingApps = myApplications.filter((t) => t.applications.some((a) => a.workerId === user.uid && a.status === "sent"));

  const recentTasks = [...myTasks, ...myApplications]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const masked = "₦ ••••••";

  const widgets = [
    { label: "Active Tasks",   value: activeTasks.length,   icon: Activity,      color: "#0C6B38" },
    { label: "Tasks Posted",   value: myTasks.length,       icon: ClipboardList, color: "#1d4ed8" },
    { label: "Completed",      value: completedTasks.length,icon: CheckCircle,   color: "#059669" },
    { label: "Pending Offers", value: pendingApps.length,   icon: Clock,         color: "#d97706" },
  ];

  const quickActions = [
    { label: "Post a Task",  href: "/create-request", icon: Plus,    sub: "Hire someone fast"    },
    { label: "Find Tasks",   href: "/discover",        icon: Search,  sub: "Browse opportunities" },
    { label: "My Wallet",    href: "/wallet",          icon: Wallet,  sub: "View & top up balance"},
    { label: "Messages",     href: "/messages",        icon: Bell,    sub: "Inbox & notifications"},
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF8]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">

        {/* ── Greeting Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-[#0C6B38] flex items-center justify-center shrink-0 shadow-lg shadow-[#0C6B38]/20">
              {avatar ? (
                <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-lg font-bold">{initials}</span>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 mb-0.5">Welcome back</p>
              <h1 className="text-xl font-bold text-[#0D0D0D]">Hey, {firstName} 👋</h1>
            </div>
          </div>
          <Link href="/create-request">
            <button
              className="flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
              style={{ background: "#0C6B38", boxShadow: "0 4px 12px rgba(12,107,56,0.25)" }}
            >
              <Plus className="w-4 h-4" /> Post a Task
            </button>
          </Link>
        </motion.div>

        {/* ── Balance Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-3xl p-7 mb-6 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0C6B38 0%, #0a5a30 60%, #084a27 100%)" }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: "white", transform: "translate(30%, -30%)" }} />
          <div className="absolute bottom-0 left-1/2 w-40 h-40 rounded-full opacity-5" style={{ background: "white", transform: "translateY(40%)" }} />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-white/60 text-sm">Available Balance</p>
                <button onClick={() => setHideBalance(!hideBalance)} className="text-white/50 hover:text-white/80 transition-colors">
                  {hideBalance ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-4xl font-bold tracking-tight">
                {hideBalance ? masked : formatLocal(availableBalance)}
              </p>
              {escrowBalance > 0 && (
                <p className="text-white/50 text-xs mt-1.5">
                  In escrow: {hideBalance ? "••••••" : formatLocal(escrowBalance)}
                </p>
              )}
            </div>
            <Link href="/wallet">
              <button className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all bg-white/15 hover:bg-white/25 text-white border border-white/20">
                <Wallet size={15} /> View Wallet <ArrowRight size={14} />
              </button>
            </Link>
          </div>
        </motion.div>

        {/* ── Stat widgets ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {widgets.map((w, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.05 }}>
              <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #F0F0F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: `${w.color}15` }}>
                  <w.icon className="w-4.5 h-4.5" style={{ color: w.color }} />
                </div>
                <p className="text-2xl font-bold text-[#0D0D0D]">{w.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{w.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">

          {/* ── Recent Tasks ── */}
          <div className="lg:col-span-2 space-y-5">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #F0F0F0" }}>
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #F5F5F5" }}>
                  <h2 className="font-semibold text-[#0D0D0D] text-sm">Recent Tasks</h2>
                  <Link href="/discover">
                    <span className="text-xs font-medium flex items-center gap-1 cursor-pointer" style={{ color: "#0C6B38" }}>
                      View all <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                </div>

                {recentTasks.length === 0 ? (
                  <div className="text-center py-14">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                      <ClipboardList className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-400 mb-4">No tasks yet — post your first!</p>
                    <Link href="/create-request">
                      <button
                        className="text-xs font-semibold px-5 py-2.5 rounded-xl text-white transition-all"
                        style={{ background: "#0C6B38" }}
                      >
                        Post a Task
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {recentTasks.map((task) => {
                      const statusClass = STATUS_COLORS[task.status] || STATUS_COLORS.created;
                      return (
                        <Link key={task.id} href={`/request/${task.id}`}>
                          <div className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#F8FAF8] transition-colors cursor-pointer">
                            <div className="w-8 h-8 rounded-xl bg-[#E8F5EF] flex items-center justify-center shrink-0">
                              <ClipboardList className="w-4 h-4 text-[#0C6B38]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#0D0D0D] truncate">{task.title}</p>
                              <p className="text-xs text-gray-400">{task.applications.length} offers · {task.category.replace(/_/g, " ")}</p>
                            </div>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${statusClass}`}>
                              {task.status.replace(/_/g, " ")}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── Performance ── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #F0F0F0" }}>
                <div className="flex items-center gap-2 mb-5">
                  <BarChart3 className="w-4 h-4 text-gray-400" />
                  <h2 className="font-semibold text-[#0D0D0D] text-sm">Performance</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Rating",      value: `${currentProfile?.rating?.toFixed(1) || "0.0"} ★`, color: "#f59e0b" },
                    { label: "Rep Score",   value: currentProfile?.reputationScore || 0,               color: "#0C6B38" },
                    { label: "Success",     value: `${currentProfile?.successRate || 0}%`,             color: "#1d4ed8" },
                    { label: "Done",        value: currentProfile?.helpsGiven || 0,                    color: "#059669" },
                  ].map((m) => (
                    <div key={m.label} className="text-center p-3 rounded-xl bg-[#F8FAF8]">
                      <p className="text-xl font-bold mb-0.5" style={{ color: m.color }}>{m.value}</p>
                      <p className="text-xs text-gray-400">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-5">
            {/* Quick Actions */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
              <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #F0F0F0" }}>
                <div className="px-5 py-4" style={{ borderBottom: "1px solid #F5F5F5" }}>
                  <h2 className="font-semibold text-[#0D0D0D] text-sm">Quick Actions</h2>
                </div>
                <div className="p-3 space-y-1">
                  {quickActions.map((action) => (
                    <Link key={action.href} href={action.href}>
                      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8FAF8] transition-colors cursor-pointer group">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(12,107,56,0.08)" }}>
                          <action.icon className="w-4 h-4" style={{ color: "#0C6B38" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#0D0D0D] leading-tight">{action.label}</p>
                          <p className="text-xs text-gray-400">{action.sub}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#0C6B38] transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Profile completion hint */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
              <div
                className="rounded-2xl p-5"
                style={{ background: "linear-gradient(135deg, #0C6B38 0%, #0a5a30 100%)" }}
              >
                <Star className="w-7 h-7 text-white/60 mb-3" />
                <h3 className="text-sm font-bold text-white mb-1">Complete your profile</h3>
                <p className="text-xs text-white/60 leading-relaxed mb-4">
                  Workers with complete profiles get 3× more offers.
                </p>
                <Link href="/profile">
                  <button className="text-xs font-semibold px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-all border border-white/20">
                    Edit Profile <ArrowRight className="inline w-3 h-3 ml-1" />
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
