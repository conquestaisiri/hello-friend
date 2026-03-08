import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import {
  Plus, Search, ClipboardList, Users, Wallet, TrendingUp,
  Star, Clock, CheckCircle, ArrowRight, Bell, Briefcase,
  BarChart3, Activity
} from "lucide-react";
import { Link, Redirect } from "wouter";
import { motion } from "framer-motion";
import { useTasksStore } from "@/stores/tasks-store";
import { useWalletLocalStore } from "@/stores/wallet-local-store";
import { useProfileStore } from "@/stores/profile-store";
import { useLocalizationStore } from "@/stores/localization-store";

export default function Dashboard() {
  const { user } = useFirebaseAuth();
  const { availableBalance } = useWalletLocalStore();
  const { formatLocal } = useLocalizationStore();
  const tasks = useTasksStore((s) => s.tasks);
  const currentProfile = useProfileStore((s) => s.getCurrentProfile());

  if (!user) return <Redirect to="/auth" />;

  const displayName = user.displayName || currentProfile?.fullName || "User";
  const myTasks = tasks.filter((t) => t.creatorId === user.uid);
  const myApplications = tasks.filter((t) => t.applications.some((a) => a.workerId === user.uid));
  const activeTasks = myTasks.filter((t) => ["published", "in_progress", "accepted"].includes(t.status));
  const completedTasks = myTasks.filter((t) => t.status === "completed");
  const pendingApps = myApplications.filter((t) => t.applications.some((a) => a.workerId === user.uid && a.status === "sent"));

  const widgets = [
    { label: "Active Tasks", value: activeTasks.length, icon: Activity, color: "text-primary" },
    { label: "Tasks Posted", value: myTasks.length, icon: ClipboardList, color: "text-chart-4" },
    { label: "Completed", value: completedTasks.length, icon: CheckCircle, color: "text-chart-2" },
    { label: "Pending Offers", value: pendingApps.length, icon: Clock, color: "text-accent" },
  ];

  const recentTasks = [...myTasks, ...myApplications]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div className="flex items-center justify-between mb-8" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back, {displayName}</h1>
            <p className="text-muted-foreground text-sm mt-1">Here's an overview of your activity</p>
          </div>
          <div className="flex gap-2">
            <Link href="/create-request">
              <Button className="gap-2 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground">
                <Plus size={16} /> Post Task
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {widgets.map((w, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <w.icon className={`h-5 w-5 ${w.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{w.value}</p>
                  <p className="text-sm text-muted-foreground">{w.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Snapshot */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 shadow-xl">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-primary-foreground/70 text-sm">Available Balance</p>
                    <p className="text-3xl font-bold">{formatLocal(availableBalance)}</p>
                  </div>
                  <Link href="/wallet">
                    <Button variant="secondary" className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0 gap-2">
                      <Wallet size={16} /> View Wallet <ArrowRight size={14} />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Tasks */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Recent Tasks</CardTitle>
                  <Link href="/discover">
                    <Button variant="ghost" size="sm" className="text-primary gap-1">
                      View All <ArrowRight size={14} />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <ClipboardList className="h-12 w-12 mx-auto mb-3 text-muted-foreground/20" />
                    <p className="text-muted-foreground mb-4">No tasks yet</p>
                    <Link href="/create-request">
                      <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Post Your First Task</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTasks.map((task) => (
                      <Link key={task.id} href={`/request/${task.id}`}>
                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                            <p className="text-xs text-muted-foreground">{task.applications.length} offers · {task.category}</p>
                          </div>
                          <Badge variant={task.status === "completed" ? "default" : "secondary"} className="capitalize text-xs ml-3">
                            {task.status}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Performance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BarChart3 size={16} /> Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-chart-4 text-chart-4" />
                    <span className="text-sm font-semibold">{currentProfile?.rating?.toFixed(1) || "0.0"}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rep Score</span>
                  <span className="text-sm font-semibold">{currentProfile?.reputationScore || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="text-sm font-semibold">{currentProfile?.successRate || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tasks Completed</span>
                  <span className="text-sm font-semibold">{currentProfile?.helpsGiven || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Post a Task", href: "/create-request", icon: Plus },
                  { label: "Find Tasks", href: "/discover", icon: Search },
                  { label: "Messages", href: "/messages", icon: Bell },
                  { label: "My Wallet", href: "/wallet", icon: Wallet },
                ].map((action) => (
                  <Link key={action.href} href={action.href}>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <action.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{action.label}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Notifications Placeholder */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Bell size={16} /> Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">No new notifications</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
