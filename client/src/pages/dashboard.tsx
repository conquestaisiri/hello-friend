import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { 
  Plus, MessageSquare, MapPin, Briefcase, 
  Star, Clock, Search, ClipboardList, Users, Wallet,
  TrendingUp, Shield, ArrowRight
} from "lucide-react";
import { Link, Redirect, useLocation } from "wouter";
import { useState } from "react";
import { motion } from "framer-motion";
import { useTasksStore } from "@/stores/tasks-store";
import { useWalletLocalStore } from "@/stores/wallet-local-store";
import { useProfileStore } from "@/stores/profile-store";
import { useLocalizationStore } from "@/stores/localization-store";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const { availableBalance, escrowBalance } = useWalletLocalStore();
  const { formatLocal } = useLocalizationStore();
  const tasks = useTasksStore((s) => s.tasks);
  const currentProfile = useProfileStore((s) => s.getCurrentProfile());
  const [activeTab, setActiveTab] = useState<'requests' | 'offers' | 'batch'>('requests');
  
  if (!user) {
    return <Redirect to="/auth" />;
  }

  const displayName = user.displayName || currentProfile?.fullName || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const reputation = currentProfile?.reputationScore || 0;

  // Find tasks where user is creator or applicant
  const myTasks = tasks.filter(t => t.creatorId === user.uid);
  const myApplications = tasks.filter(t => t.applications.some(a => a.workerId === user.uid));
  const batchTasks = myTasks.filter(t => t.workerCount > 1);

  const quickActions = [
    { icon: Plus, label: "Post Task", href: "/create-request", color: "bg-primary text-white" },
    { icon: Search, label: "Find Tasks", href: "/discover", color: "bg-blue-500 text-white" },
    { icon: MessageSquare, label: "Messages", href: "/messages", color: "bg-purple-500 text-white" },
    { icon: Wallet, label: "Wallet", href: "/profile", color: "bg-amber-500 text-white" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-lg mx-auto px-4 pb-24">
        {/* Header */}
        <motion.div className="pt-6 pb-4" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Welcome back,</p>
              <h1 className="text-2xl font-bold">{displayName}</h1>
            </div>
            <Link href="/profile">
              <Avatar className="w-12 h-12 border-2 border-white shadow-lg cursor-pointer">
                <AvatarImage src={currentProfile?.avatarUrl || user.photoURL || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </motion.div>

        {/* Wallet Balance Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-primary via-primary to-accent text-white border-0 shadow-xl mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white/70 text-sm">Available Balance</p>
                  <p className="text-2xl font-bold font-mono">{formatLocal(availableBalance)}</p>
                </div>
                <Link href="/profile">
                  <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                    <Wallet className="w-4 h-4 mr-1" /> Manage
                  </Button>
                </Link>
              </div>
              {escrowBalance > 0 && (
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Shield className="w-3.5 h-3.5" />
                  <span>{formatLocal(escrowBalance)} locked in escrow</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div className="grid grid-cols-4 gap-2 mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          {quickActions.map((action, i) => (
            <Link key={i} href={action.href}>
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white dark:hover:bg-zinc-900 transition-colors cursor-pointer">
                <div className={`p-3 rounded-full ${action.color}`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-center">{action.label}</span>
              </div>
            </Link>
          ))}
        </motion.div>

        {/* Stats Row */}
        <motion.div className="grid grid-cols-3 gap-3 mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{reputation}</p>
              <p className="text-xs text-muted-foreground">Rep Score</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <ClipboardList className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <p className="text-lg font-bold">{myTasks.length}</p>
              <p className="text-xs text-muted-foreground">My Tasks</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <Star className="w-5 h-5 mx-auto mb-1 text-amber-500" />
              <p className="text-lg font-bold">{currentProfile?.rating?.toFixed(1) || '0.0'}</p>
              <p className="text-xs text-muted-foreground">Rating</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tab Switcher */}
        <motion.div className="flex gap-2 mb-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Button variant={activeTab === 'requests' ? 'default' : 'outline'} className="flex-1" size="sm" onClick={() => setActiveTab('requests')}>
            <Briefcase className="w-4 h-4 mr-1" /> Tasks
          </Button>
          <Button variant={activeTab === 'offers' ? 'default' : 'outline'} className="flex-1" size="sm" onClick={() => setActiveTab('offers')}>
            <Users className="w-4 h-4 mr-1" /> Offers
          </Button>
          {batchTasks.length > 0 && (
            <Button variant={activeTab === 'batch' ? 'default' : 'outline'} className="flex-1" size="sm" onClick={() => setActiveTab('batch')}>
              <Users className="w-4 h-4 mr-1" /> Batch
            </Button>
          )}
        </motion.div>

        {/* Content */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          {activeTab === 'requests' ? (
            <div className="space-y-3">
              {myTasks.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground mb-4">No tasks posted yet</p>
                    <Link href="/create-request">
                      <Button><Plus className="w-4 h-4 mr-2" /> Post Your First Task</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                myTasks.map((task) => (
                  <Link key={task.id} href={`/request/${task.id}`}>
                    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-sm line-clamp-1 flex-1 mr-2">{task.title}</h3>
                          <Badge variant={task.status === 'completed' ? 'default' : 'secondary'} className="capitalize text-xs">
                            {task.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-xs line-clamp-2 mb-3">{task.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {task.workerCount > 1 && (
                              <span className="flex items-center gap-1 text-accent font-medium">
                                <Users className="w-3 h-3" />
                                {task.slotsFilled}/{task.workerCount}
                              </span>
                            )}
                            {task.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {task.location.length > 15 ? task.location.slice(0, 15) + '...' : task.location}
                              </span>
                            )}
                          </div>
                          <p className="text-primary font-bold text-sm">
                            {task.rewardAmount ? formatLocal(task.rewardAmount) : 'Volunteer'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          ) : activeTab === 'offers' ? (
            <div className="space-y-3">
              {myApplications.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground mb-4">No offers made yet</p>
                    <Link href="/discover">
                      <Button><Search className="w-4 h-4 mr-2" /> Find Tasks to Help</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                myApplications.map((task) => {
                  const myApp = task.applications.find(a => a.workerId === user.uid);
                  return (
                    <Link key={task.id} href={`/request/${task.id}`}>
                      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-sm line-clamp-1 flex-1 mr-2">{task.title}</h3>
                            <Badge variant={myApp?.status === 'hired' ? 'default' : 'secondary'} className="capitalize text-xs">
                              {myApp?.status || 'pending'}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-xs line-clamp-1 mb-2">{myApp?.pitchText}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{task.creatorName}</span>
                            <p className="text-primary font-bold text-sm">
                              {myApp?.offerAmount ? formatLocal(myApp.offerAmount) : ''}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {batchTasks.map((task) => (
                <Link key={task.id} href={`/batch/${task.id}`}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm line-clamp-1 flex-1 mr-2">{task.title}</h3>
                        <Badge className="bg-accent/10 text-accent text-xs">
                          <Users className="w-3 h-3 mr-1" /> Batch
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-1 h-2 bg-accent/20 rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${(task.slotsFilled / task.workerCount) * 100}%` }} />
                        </div>
                        <span className="text-sm font-medium">{task.slotsFilled}/{task.workerCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{task.applications.length} applications</span>
                        <span className="text-primary font-bold">{formatLocal(task.totalEscrowed)} escrowed</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* FAB */}
        <Link href="/create-request">
          <motion.button
            className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center z-40"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        </Link>
      </div>
    </div>
  );
}
