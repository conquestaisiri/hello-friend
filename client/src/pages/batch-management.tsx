import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useTasksStore, type HelpTask, type TaskApplication } from "@/stores/tasks-store";
import { useWalletLocalStore } from "@/stores/wallet-local-store";
import { useLocalizationStore } from "@/stores/localization-store";
import { useRoute, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Users, Check, X, MessageSquare, Star, Shield, Clock,
  CheckCircle2, ChevronLeft, Send, Eye, UserCheck, UserX,
  Megaphone, FileCheck, DollarSign, AlertCircle
} from "lucide-react";

export default function BatchManagementPage() {
  const [, params] = useRoute("/batch/:id");
  const taskId = params?.id;
  const task = useTasksStore((s) => s.getTaskById(taskId || ""));
  const { updateApplicationStatus, massApproveProofs } = useTasksStore();
  const { lockEscrow, releaseEscrow } = useWalletLocalStore();
  const { formatLocal } = useLocalizationStore();
  const { toast } = useToast();
  
  const [selectedApp, setSelectedApp] = useState<TaskApplication | null>(null);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [showPitchDialog, setShowPitchDialog] = useState(false);

  if (!task) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground mb-4">Task not found</p>
          <Link href="/dashboard"><Button>Back to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  const hired = task.applications.filter(a => a.status === "hired" || a.status === "completed");
  const pending = task.applications.filter(a => a.status === "sent" || a.status === "reviewed");
  const shortlisted = task.applications.filter(a => a.status === "shortlisted");
  const proofsSubmitted = hired.filter(a => a.proofSubmitted);
  const proofsApproved = hired.filter(a => a.status === "completed");
  const slotsRemaining = task.workerCount - task.slotsFilled;
  const fillPercentage = (task.slotsFilled / task.workerCount) * 100;

  const handleHire = (app: TaskApplication) => {
    if (slotsRemaining <= 0) {
      toast({ title: "All slots filled", description: "No more slots available for this task.", variant: "destructive" });
      return;
    }
    updateApplicationStatus(task.id, app.id, "hired");
    lockEscrow(app.offerAmount, `Escrow for ${app.workerName} — ${task.title}`);
    toast({ title: "Worker Hired!", description: `${app.workerName} has been hired. ${formatLocal(app.offerAmount)} locked in escrow.` });
  };

  const handleReject = (app: TaskApplication) => {
    updateApplicationStatus(task.id, app.id, "rejected");
    toast({ title: "Application Rejected", description: `${app.workerName}'s application was declined.` });
  };

  const handleShortlist = (app: TaskApplication) => {
    updateApplicationStatus(task.id, app.id, "shortlisted");
    toast({ title: "Shortlisted", description: `${app.workerName} has been shortlisted.` });
  };

  const handleMassApprove = () => {
    massApproveProofs(task.id);
    proofsSubmitted.forEach(app => {
      releaseEscrow(app.offerAmount, app.workerId);
    });
    toast({ title: "All Proofs Approved!", description: `Payments released for ${proofsSubmitted.length} workers.` });
  };

  const handleBroadcast = () => {
    toast({ title: "Message Broadcast!", description: `Sent to ${hired.length} hired workers.` });
    setShowBroadcast(false);
    setBroadcastMsg("");
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      sent: "bg-slate-100 text-slate-700",
      reviewed: "bg-blue-100 text-blue-700",
      shortlisted: "bg-amber-100 text-amber-700",
      hired: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      completed: "bg-emerald-100 text-emerald-700",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm"><ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard</Button>
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div>
              <Badge className="mb-2 bg-accent/10 text-accent"><Users className="w-3 h-3 mr-1" /> Batch Management</Badge>
              <h1 className="text-3xl font-bold mb-2">{task.title}</h1>
              <p className="text-muted-foreground">{task.description.slice(0, 120)}...</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowBroadcast(true)}>
                <Megaphone className="w-4 h-4 mr-2" /> Broadcast
              </Button>
              {proofsSubmitted.length > 0 && (
                <Button onClick={handleMassApprove} className="bg-green-600 hover:bg-green-700">
                  <FileCheck className="w-4 h-4 mr-2" /> Mass Approve ({proofsSubmitted.length})
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <UserCheck className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{task.slotsFilled}</p>
              <p className="text-xs text-muted-foreground">Hired</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-amber-500" />
              <p className="text-2xl font-bold">{slotsRemaining}</p>
              <p className="text-xs text-muted-foreground">Slots Left</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{task.applications.length}</p>
              <p className="text-xs text-muted-foreground">Applications</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <FileCheck className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{proofsSubmitted.length}</p>
              <p className="text-xs text-muted-foreground">Proofs</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <DollarSign className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{formatLocal(task.totalEscrowed)}</p>
              <p className="text-xs text-muted-foreground">Escrowed</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Progress Bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Hiring Progress</h3>
                <span className="text-sm font-medium">{task.slotsFilled}/{task.workerCount} workers</span>
              </div>
              <Progress value={fillPercentage} className="h-3 mb-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Hired: {hired.length}</span>
                <span>Shortlisted: {shortlisted.length}</span>
                <span>Pending: {pending.length}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Worker Table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 border-b bg-slate-50 dark:bg-slate-900">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  All Applications ({task.applications.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Worker</TableHead>
                      <TableHead>Trust Score</TableHead>
                      <TableHead>Rep</TableHead>
                      <TableHead>Offer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Proof</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {task.applications.map((app) => (
                      <TableRow key={app.id} className="hover:bg-slate-50/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9">
                              <AvatarImage src={app.workerAvatar} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {app.workerName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{app.workerName}</p>
                              <p className="text-xs text-muted-foreground">{app.estimatedTime}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-medium text-sm">{app.workerRating}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            {app.workerReputation}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-sm text-primary">{formatLocal(app.offerAmount)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(app.status)}>{app.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {app.proofSubmitted ? (
                            <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" /> Submitted</Badge>
                          ) : app.status === "hired" ? (
                            <Badge variant="outline" className="text-xs">Pending</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 justify-end">
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8"
                              onClick={() => { setSelectedApp(app); setShowPitchDialog(true); }}
                              title="View pitch"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            {(app.status === "sent" || app.status === "reviewed") && (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                  onClick={() => handleShortlist(app)} title="Shortlist">
                                  <Star className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleHire(app)} title="Hire">
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleReject(app)} title="Reject">
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            
                            {app.status === "shortlisted" && (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleHire(app)} title="Hire">
                                  <UserCheck className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleReject(app)} title="Reject">
                                  <UserX className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Footer />

      {/* Pitch Dialog */}
      <Dialog open={showPitchDialog} onOpenChange={setShowPitchDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedApp?.workerAvatar} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {selectedApp?.workerName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p>{selectedApp?.workerName}</p>
                <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {selectedApp?.workerRating} • Rep: {selectedApp?.workerReputation}
                </div>
              </div>
            </DialogTitle>
            <DialogDescription>Worker's pitch for this task</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">Pitch</h4>
              <p className="text-sm text-muted-foreground leading-relaxed bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                {selectedApp?.pitchText}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Offer Amount</p>
                <p className="font-bold text-primary">{selectedApp?.offerAmount ? formatLocal(selectedApp.offerAmount) : '-'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Est. Time</p>
                <p className="font-bold">{selectedApp?.estimatedTime}</p>
              </div>
            </div>
            {selectedApp?.portfolioTaskIds && selectedApp.portfolioTaskIds.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Portfolio References</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedApp.portfolioTaskIds.map((id) => (
                    <Badge key={id} variant="outline" className="text-xs">{id}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Broadcast Dialog */}
      <Dialog open={showBroadcast} onOpenChange={setShowBroadcast}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5" /> Broadcast to All Hired Workers
            </DialogTitle>
            <DialogDescription>Send a message to all {hired.length} hired workers</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Type your message to all workers..."
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              className="min-h-[120px]"
            />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowBroadcast(false)}>Cancel</Button>
              <Button onClick={handleBroadcast} disabled={!broadcastMsg.trim()}>
                <Send className="w-4 h-4 mr-2" /> Send to {hired.length} workers
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
