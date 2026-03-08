import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { Loader2, ArrowLeft, ArrowRight, MapPin, Navigation, Check, Users, Globe, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTasksStore } from "@/stores/tasks-store";
import { useWalletLocalStore } from "@/stores/wallet-local-store";
import { useLocalizationStore } from "@/stores/localization-store";
import { useSectorStore } from "@/stores/sector-store";

const CATEGORIES = [
  { value: "digital_work", label: "Digital Work" },
  { value: "design", label: "Design" },
  { value: "writing", label: "Writing" },
  { value: "programming", label: "Programming" },
  { value: "marketing", label: "Marketing" },
  { value: "research", label: "Research" },
  { value: "education", label: "Education" },
  { value: "translation", label: "Translation" },
  { value: "consulting", label: "Consulting" },
  { value: "home_services", label: "Home Services" },
  { value: "errands", label: "Errands" },
  { value: "physical_help", label: "Physical Help" },
  { value: "transportation", label: "Transportation" },
  { value: "other", label: "Other" },
];

const DURATION_OPTIONS = [
  { value: "same_day", label: "Same-day completion" },
  { value: "1_3_days", label: "1-3 days" },
  { value: "4_7_days", label: "4-7 days" },
  { value: "1_2_weeks", label: "1-2 weeks" },
  { value: "flexible", label: "Flexible deadline" },
  { value: "milestone", label: "Milestone-based" },
];

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(20, "Please provide more detail (min 20 chars)"),
  category: z.string().min(1, "Please select a category"),
  locationType: z.enum(["remote", "local"]),
  location: z.string().optional(),
  duration: z.string().min(1, "Select expected duration"),
  deadline: z.string().optional(),
  skills: z.string().optional(),
  amount: z.coerce.number().min(0, "Amount cannot be negative"),
  workerCount: z.coerce.number().min(1).max(100).default(1),
});

function CreateRequestContent() {
  const [step, setStep] = useState(1);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useFirebaseAuth();
  const { createTask } = useTasksStore();
  const { availableBalance, lockEscrow } = useWalletLocalStore();
  const { formatLocal, currency, localToUsdc } = useLocalizationStore();
  const { sector } = useSectorStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "", description: "", category: "", locationType: "remote",
      location: "", duration: "", deadline: "", skills: "",
      amount: 0, workerCount: 1,
    },
  });

  const watchAmount = form.watch("amount");
  const watchWorkerCount = form.watch("workerCount");
  const watchLocationType = form.watch("locationType");
  const totalBudget = watchAmount * watchWorkerCount;
  const platformFee = totalBudget > 0 ? Math.round(totalBudget * 0.06) : 0;
  const totalCost = totalBudget + platformFee;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) { setLocation("/auth?mode=login"); return; }
    const total = values.amount * values.workerCount;
    const fee = Math.round(total * 0.06);
    const grandTotal = total + fee;

    if (total > 0) {
      if (availableBalance < grandTotal) {
        toast({ title: "Insufficient Balance", description: `You need ${formatLocal(grandTotal)} but only have ${formatLocal(availableBalance)}.`, variant: "destructive" });
        return;
      }
      lockEscrow(grandTotal, `Task escrow: ${values.title}`);
    }

    createTask({
      creatorId: user.uid,
      creatorName: user.displayName || "User",
      title: values.title,
      description: values.description,
      category: values.category,
      location: values.locationType === "local" ? values.location || null : null,
      isVirtual: values.locationType === "remote",
      scheduledTime: values.deadline || null,
      isFlexible: values.duration === "flexible",
      estimatedDuration: null,
      rewardAmount: values.amount > 0 ? values.amount : null,
      rewardDescription: values.workerCount > 1 ? `Per worker × ${values.workerCount}` : null,
      status: "published",
      urgency: "medium",
      sector,
      workerCount: values.workerCount,
      unitBudgetUsdc: values.amount > 0 ? localToUsdc(values.amount) : 0,
      acceptedHelperId: null,
      verificationTierRequired: 1,
    });

    toast({ title: "Task Posted!", description: "Your task is now live on the marketplace." });
    setLocation("/discover");
  };

  const totalSteps = 4;
  const nextStep = async () => {
    let valid = false;
    if (step === 1) valid = await form.trigger(["title", "description", "category"]);
    if (step === 2) valid = await form.trigger(["locationType", "duration"]);
    if (step === 3) valid = await form.trigger(["amount", "workerCount"]);
    if (valid) setStep((s) => s + 1);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) { toast({ title: "Geolocation not supported", variant: "destructive" }); return; }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&addressdetails=1`);
          const data = await res.json();
          const addr = data.address;
          const parts = [addr?.suburb || addr?.neighbourhood, addr?.city || addr?.town, addr?.state].filter(Boolean);
          form.setValue("location", parts.join(", ") || data.display_name?.split(",").slice(0, 3).join(","));
        } catch { form.setValue("location", `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`); }
        setIsGettingLocation(false);
      },
      () => { setIsGettingLocation(false); toast({ title: "Location Error", variant: "destructive" }); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <motion.div className="mb-8 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Badge className="mb-4 px-4 py-1.5 bg-primary/10 text-primary border-primary/20 rounded-full">Create Task</Badge>
          <h1 className="text-3xl font-bold mb-2 text-foreground">Post a new task</h1>
          <p className="text-muted-foreground">Describe your task and set your requirements</p>
        </motion.div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <span className={step >= 1 ? "text-primary" : ""}>Details</span>
            <span className={step >= 2 ? "text-primary" : ""}>Location & Duration</span>
            <span className={step >= 3 ? "text-primary" : ""}>Budget</span>
            <span className={step >= 4 ? "text-primary" : ""}>Review</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full bg-primary" animate={{ width: `${(step / totalSteps) * 100}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>

        <Card className="border-none shadow-xl">
          <CardContent className="p-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="p-8">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <FormField control={form.control} name="title" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold">Task Title</FormLabel>
                            <FormControl><Input placeholder="e.g., Build a landing page for my startup" className="h-12 text-lg" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold">Description</FormLabel>
                            <FormControl><Textarea placeholder="Describe what you need in detail..." className="min-h-[150px] text-base" {...field} /></FormControl>
                            <FormDescription>Include any specific requirements, deliverables, or preferences.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="category" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold">Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="h-12"><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div>
                          <FormLabel className="text-lg font-semibold">Required Skills (optional)</FormLabel>
                          <FormField control={form.control} name="skills" render={({ field }) => (
                            <FormItem>
                              <FormControl><Input placeholder="e.g., React, Photoshop, Writing" className="h-12 mt-2" {...field} /></FormControl>
                            </FormItem>
                          )} />
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <FormField control={form.control} name="locationType" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold">Work Type</FormLabel>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                              {[
                                { value: "remote", label: "Remote", icon: Globe, desc: "Worker can be anywhere" },
                                { value: "local", label: "On-site / Local", icon: MapPin, desc: "Worker must be nearby" },
                              ].map((opt) => (
                                <div key={opt.value}
                                  className={`cursor-pointer rounded-xl border-2 p-5 transition-all ${field.value === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                                  onClick={() => field.onChange(opt.value)}>
                                  <opt.icon className={`w-6 h-6 mb-2 ${field.value === opt.value ? "text-primary" : "text-muted-foreground"}`} />
                                  <p className="font-semibold text-foreground">{opt.label}</p>
                                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                                </div>
                              ))}
                            </div>
                          </FormItem>
                        )} />

                        {watchLocationType === "local" && (
                          <FormField control={form.control} name="location" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <Button type="button" variant="outline" onClick={getCurrentLocation} disabled={isGettingLocation}
                                className="w-full h-12 mb-3 border-2 border-dashed border-primary/30 hover:border-primary">
                                {isGettingLocation ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Navigation className="w-5 h-5 mr-2 text-primary" />}
                                {isGettingLocation ? "Getting location..." : "Use Current Location"}
                              </Button>
                              <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" /><Input placeholder="Or enter address" className="pl-10 h-12" {...field} /></div>
                              {field.value && (
                                <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-2">
                                  <Check className="w-4 h-4 text-primary" /><span className="text-sm text-foreground">{field.value}</span>
                                </div>
                              )}
                            </FormItem>
                          )} />
                        )}

                        <FormField control={form.control} name="duration" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold">Expected Duration</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="h-12"><SelectValue placeholder="Select duration" /></SelectTrigger></FormControl>
                              <SelectContent>{DURATION_OPTIONS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="deadline" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deadline (optional)</FormLabel>
                            <FormControl><Input type="date" className="h-12" {...field} /></FormControl>
                          </FormItem>
                        )} />
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <FormField control={form.control} name="workerCount" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold flex items-center gap-2"><Users className="w-5 h-5 text-accent" /> How many workers?</FormLabel>
                            <FormDescription>Set to 1 for a single worker, or more for batch hiring.</FormDescription>
                            <FormControl>
                              <div className="flex items-center gap-4">
                                <Input type="number" min="1" max="100" className="h-14 text-2xl font-mono w-28 text-center" {...field} />
                                <span className="text-muted-foreground text-sm">worker{Number(field.value) !== 1 ? "s" : ""}</span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="amount" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold">Budget per worker ({currency.symbol})</FormLabel>
                            <FormDescription>Enter 0 for volunteer/flexible pricing.</FormDescription>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-mono text-muted-foreground">{currency.symbol}</span>
                                <Input type="number" placeholder="0" className="h-14 text-2xl font-mono pl-10" {...field} />
                              </div>
                            </FormControl>
                            {totalBudget > 0 && (
                              <div className="mt-4 bg-muted p-4 rounded-lg space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">Per worker</span><span className="font-medium">{formatLocal(watchAmount)}</span></div>
                                {watchWorkerCount > 1 && <div className="flex justify-between"><span className="text-muted-foreground">× {watchWorkerCount} workers</span><span className="font-medium">{formatLocal(totalBudget)}</span></div>}
                                <div className="flex justify-between"><span className="text-muted-foreground">Platform fee (6%)</span><span className="font-medium">{formatLocal(platformFee)}</span></div>
                                <div className="flex justify-between pt-2 border-t border-border font-bold"><span>Total</span><span className="text-primary">{formatLocal(totalCost)}</span></div>
                                {availableBalance < totalCost && <p className="text-destructive text-xs mt-2">Insufficient balance. You have {formatLocal(availableBalance)}.</p>}
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )} />
                      </motion.div>
                    )}

                    {step === 4 && (
                      <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                        <h2 className="text-xl font-bold text-foreground mb-4">Review your task</h2>
                        {[
                          { label: "Title", value: form.getValues("title") },
                          { label: "Category", value: CATEGORIES.find((c) => c.value === form.getValues("category"))?.label },
                          { label: "Work Type", value: form.getValues("locationType") === "remote" ? "Remote" : `On-site: ${form.getValues("location")}` },
                          { label: "Duration", value: DURATION_OPTIONS.find((d) => d.value === form.getValues("duration"))?.label },
                          { label: "Workers", value: form.getValues("workerCount") },
                          { label: "Budget/Worker", value: watchAmount > 0 ? formatLocal(watchAmount) : "Flexible" },
                          { label: "Total Cost", value: totalCost > 0 ? formatLocal(totalCost) : "Free" },
                        ].map((item) => (
                          <div key={item.label} className="flex justify-between py-2 border-b border-border last:border-0">
                            <span className="text-muted-foreground text-sm">{item.label}</span>
                            <span className="text-sm font-medium text-foreground">{item.value}</span>
                          </div>
                        ))}
                        <div className="pt-4">
                          <p className="text-sm text-muted-foreground mb-2">Description:</p>
                          <p className="text-sm text-foreground bg-muted p-3 rounded-lg">{form.getValues("description")}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center justify-between px-8 py-5 bg-muted/50 border-t border-border">
                  {step > 1 ? (
                    <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)} className="gap-2">
                      <ArrowLeft size={16} /> Back
                    </Button>
                  ) : <div />}
                  {step < totalSteps ? (
                    <Button type="button" onClick={nextStep} className="gap-2 bg-primary text-primary-foreground">
                      Continue <ArrowRight size={16} />
                    </Button>
                  ) : (
                    <Button type="submit" className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground" disabled={totalCost > 0 && availableBalance < totalCost}>
                      <Check size={16} /> Post Task
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

export default function CreateRequest() {
  return (
    <ProtectedRoute>
      <CreateRequestContent />
    </ProtectedRoute>
  );
}
