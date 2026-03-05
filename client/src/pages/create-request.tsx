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
import { Loader2, ArrowLeft, ArrowRight, MapPin, AlertCircle, Wallet, CreditCard, Navigation, Check, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UrgencyBadge, UrgencyLevel } from "@/components/ui/urgency-badge";
import { useLocation } from "wouter";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTasksStore } from "@/stores/tasks-store";
import { useWalletLocalStore } from "@/stores/wallet-local-store";
import { useLocalizationStore } from "@/stores/localization-store";
import { useSectorStore } from "@/stores/sector-store";

const CATEGORIES = [
  { value: "physical_help", label: "Physical Help" },
  { value: "errands", label: "Errands / Groceries" },
  { value: "tech_help", label: "Tech Support" },
  { value: "guidance", label: "Guidance / Advice" },
  { value: "transportation", label: "Transportation" },
  { value: "home_repairs", label: "Home Repairs" },
  { value: "childcare", label: "Childcare" },
  { value: "pet_care", label: "Pet Care" },
  { value: "tutoring", label: "Tutoring / Education" },
  { value: "other", label: "Other" },
];

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(20, "Please provide more detail (min 20 chars)"),
  location: z.string().min(2, "Location is required"),
  category: z.string().min(1, "Please select a category"),
  otherCategory: z.string().optional(),
  urgency: z.enum(["low", "medium", "high", "urgent", "critical"] as const),
  amount: z.coerce.number().min(0, "Amount cannot be negative"),
  workerCount: z.coerce.number().min(1).max(100).default(1),
});

function CreateRequestContent() {
  const [step, setStep] = useState(1);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
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
      title: "", description: "", location: "", category: "",
      urgency: "medium", amount: 0, otherCategory: "", workerCount: 1,
    },
  });

  const watchAmount = form.watch("amount");
  const watchWorkerCount = form.watch("workerCount");
  const totalBudget = watchAmount * watchWorkerCount;
  const platformFee = totalBudget > 0 ? Math.round(totalBudget * 0.06) : 0;
  const totalCost = totalBudget + platformFee;
  const sufficientFunds = availableBalance >= totalCost;

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

    const taskId = createTask({
      creatorId: user.uid,
      creatorName: user.displayName || "User",
      title: values.title,
      description: values.description,
      category: values.category,
      location: values.location || null,
      isVirtual: !values.location,
      scheduledTime: null,
      isFlexible: true,
      estimatedDuration: null,
      rewardAmount: values.amount > 0 ? values.amount : null,
      rewardDescription: values.workerCount > 1 ? `Per worker × ${values.workerCount}` : null,
      status: "published",
      urgency: values.urgency,
      sector,
      workerCount: values.workerCount,
      unitBudgetUsdc: values.amount > 0 ? localToUsdc(values.amount) : 0,
      acceptedHelperId: null,
      verificationTierRequired: values.category === "physical_help" || values.category === "transportation" ? 2 : 1,
    });

    toast({ title: "Task Posted!", description: "Your help request is now live." });
    setLocation("/discover");
  };

  const nextStep = async () => {
    let valid = false;
    if (step === 1) valid = await form.trigger(["title", "description"]);
    if (step === 2) valid = await form.trigger(["category", "urgency"]);
    if (step === 3) valid = await form.trigger(["location"]);
    if (step === 4) valid = await form.trigger(["amount", "workerCount"]);
    if (valid) setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);
  const watchCategory = form.watch("category");

  const getCurrentLocation = () => {
    if (!navigator.geolocation) { toast({ title: "Geolocation not supported", variant: "destructive" }); return; }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocationCoords({ lat: latitude, lng: longitude });
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
          const data = await response.json();
          const address = data.address;
          let locationText = '';
          if (address) {
            const parts = [];
            if (address.suburb || address.neighbourhood) parts.push(address.suburb || address.neighbourhood);
            if (address.city || address.town || address.village) parts.push(address.city || address.town || address.village);
            if (address.state) parts.push(address.state);
            locationText = parts.join(', ') || data.display_name?.split(',').slice(0, 3).join(',');
          } else { locationText = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`; }
          form.setValue('location', locationText);
          toast({ title: "Location detected", description: locationText });
        } catch { form.setValue('location', `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`); }
        setIsGettingLocation(false);
      },
      () => { setIsGettingLocation(false); toast({ title: "Location Error", variant: "destructive" }); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <motion.div className="mb-8 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Badge className="mb-4 px-4 py-1.5 bg-primary/10 text-primary border-primary/20 rounded-full">Create Task</Badge>
          <h1 className="text-3xl font-bold mb-2">Post a Help Request</h1>
          <p className="text-muted-foreground">Let the community know what you need.</p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <span className={step >= 1 ? "text-primary" : ""}>Details</span>
            <span className={step >= 2 ? "text-primary" : ""}>Category</span>
            <span className={step >= 3 ? "text-primary" : ""}>Location</span>
            <span className={step >= 4 ? "text-primary" : ""}>Budget</span>
            <span className={step >= 5 ? "text-primary" : ""}>Review</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full bg-primary" initial={{ width: "0%" }} animate={{ width: `${(step / 5) * 100}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>

        <Card className="border-none shadow-xl overflow-hidden">
          <CardContent className="p-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="p-8">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <FormField control={form.control} name="title" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold">What do you need help with?</FormLabel>
                            <FormControl><Input placeholder="e.g., Need 5 workers to help with office move" className="h-12 text-lg" {...field} /></FormControl>
                            <FormDescription>Keep it short and clear.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold">Describe the task</FormLabel>
                            <FormControl><Textarea placeholder="Provide details about what you need..." className="min-h-[150px] text-base resize-none" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <FormField control={form.control} name="category" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold">Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="h-12"><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                              <SelectContent className="max-h-[300px]">
                                {CATEGORIES.map((cat) => (<SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="urgency" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold">Urgency Level</FormLabel>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                              {(["low", "medium", "high", "urgent", "critical"] as UrgencyLevel[]).map((level) => (
                                <div key={level}
                                  className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-primary/50 ${field.value === level ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-transparent bg-muted'}`}
                                  onClick={() => field.onChange(level)}
                                >
                                  <UrgencyBadge level={level} showIcon={true} className="mb-2" />
                                  <p className="text-xs text-muted-foreground">
                                    {level === 'critical' ? 'Life-threatening crisis.' : level === 'urgent' ? 'Within 24 hours.' : level === 'high' ? 'Within 3 days.' : 'Can wait a week+.'}
                                  </p>
                                </div>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <FormField control={form.control} name="location" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold">Where is help needed?</FormLabel>
                            <Button type="button" variant="outline" onClick={getCurrentLocation} disabled={isGettingLocation}
                              className="w-full h-14 mb-3 border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5">
                              {isGettingLocation ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Navigation className="w-5 h-5 mr-2 text-primary" />}
                              {isGettingLocation ? "Getting location..." : "Use My Current Location"}
                            </Button>
                            <div className="relative flex items-center gap-4 my-3">
                              <div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground uppercase">or enter manually</span><div className="flex-1 h-px bg-border" />
                            </div>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                              <Input placeholder="Enter address or city" className="pl-10 h-12 text-lg" {...field} />
                            </div>
                            {field.value && (
                              <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-start gap-3">
                                <Check className="w-4 h-4 text-primary mt-0.5" />
                                <div><p className="font-medium text-primary">Location Set</p><p className="text-sm text-muted-foreground">{field.value}</p></div>
                              </div>
                            )}
                            <FormDescription className="mt-3">Helpers will use this to find tasks near them.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </motion.div>
                    )}

                    {step === 4 && (
                      <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        {/* Worker Count - THE BATCH FEATURE */}
                        <FormField control={form.control} name="workerCount" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold flex items-center gap-2">
                              <Users className="w-5 h-5 text-accent" /> How many workers do you need?
                            </FormLabel>
                            <FormDescription>Set to 1 for a single helper, or up to 100 for batch hiring.</FormDescription>
                            <FormControl>
                              <div className="flex items-center gap-4">
                                <Input type="number" min="1" max="100" className="h-14 text-2xl font-mono w-28 text-center" {...field} />
                                <span className="text-muted-foreground text-sm">worker{Number(field.value) !== 1 ? 's' : ''}</span>
                              </div>
                            </FormControl>
                            {Number(field.value) > 1 && (
                              <div className="mt-2 p-3 bg-accent/10 rounded-lg flex items-center gap-2">
                                <Users className="w-4 h-4 text-accent" />
                                <span className="text-sm font-medium">Batch Mode: Hiring {field.value} workers</span>
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )} />

                        <FormField control={form.control} name="amount" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-semibold">Budget per worker ({currency.symbol})</FormLabel>
                            <FormDescription>Set your offer per worker. Enter 0 for volunteer/flexible tasks.</FormDescription>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-mono text-muted-foreground">{currency.symbol}</span>
                                <Input type="number" placeholder="0" className="h-14 text-2xl font-mono pl-10" {...field} />
                              </div>
                            </FormControl>
                            {totalBudget > 0 && (
                              <div className="mt-4 space-y-3">
                                <div className="bg-muted p-4 rounded-lg space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Per worker</span>
                                    <span className="font-medium">{formatLocal(watchAmount)}</span>
                                  </div>
                                  {watchWorkerCount > 1 && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">× {watchWorkerCount} workers</span>
                                      <span className="font-medium">{formatLocal(totalBudget)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-sm border-t border-border pt-2">
                                    <span className="text-muted-foreground">Platform fee (6%)</span>
                                    <span className="font-medium">{formatLocal(platformFee)}</span>
                                  </div>
                                  <div className="flex justify-between text-base border-t border-border pt-2">
                                    <span className="font-bold">Total</span>
                                    <span className="font-bold text-primary">{formatLocal(totalCost)}</span>
                                  </div>
                                </div>
                                <div className={`p-3 rounded-lg flex items-start gap-2 ${sufficientFunds ? 'bg-primary/5 border border-primary/20' : 'bg-destructive/5 border border-destructive/20'}`}>
                                  {sufficientFunds ? <Check className="w-4 h-4 text-primary mt-0.5" /> : <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />}
                                  <div>
                                    <p className={`font-medium text-sm ${sufficientFunds ? 'text-primary' : 'text-destructive'}`}>
                                      {sufficientFunds ? 'Ready to post' : 'Insufficient funds'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Balance: {formatLocal(availableBalance)}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )} />
                      </motion.div>
                    )}

                    {step === 5 && (
                      <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div className="bg-muted p-6 rounded-xl space-y-4 border">
                          <h3 className="font-bold text-xl border-b pb-4">Review Request</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><p className="text-sm text-muted-foreground uppercase tracking-wide font-bold mb-1">Title</p><p className="font-medium text-lg">{form.getValues("title")}</p></div>
                            <div><p className="text-sm text-muted-foreground uppercase tracking-wide font-bold mb-1">Category</p>
                              <Badge variant="secondary">{CATEGORIES.find(c => c.value === form.getValues("category"))?.label || form.getValues("category")}</Badge>
                            </div>
                            <div className="md:col-span-2"><p className="text-sm text-muted-foreground uppercase tracking-wide font-bold mb-1">Description</p>
                              <p className="text-muted-foreground bg-background p-4 rounded-lg border">{form.getValues("description")}</p>
                            </div>
                            <div><p className="text-sm text-muted-foreground uppercase tracking-wide font-bold mb-1">Location</p>
                              <p className="font-medium flex items-center gap-2"><MapPin className="w-4 h-4" />{form.getValues("location")}</p>
                            </div>
                            <div><p className="text-sm text-muted-foreground uppercase tracking-wide font-bold mb-1">Urgency</p>
                              <UrgencyBadge level={form.getValues("urgency")} />
                            </div>
                            <div><p className="text-sm text-muted-foreground uppercase tracking-wide font-bold mb-1">Workers Needed</p>
                              <p className="font-mono text-xl font-bold flex items-center gap-2"><Users className="w-5 h-5 text-accent" />{form.getValues("workerCount")}</p>
                            </div>
                            <div><p className="text-sm text-muted-foreground uppercase tracking-wide font-bold mb-1">Budget</p>
                              <p className="font-mono text-xl font-bold text-primary">{totalBudget > 0 ? formatLocal(totalCost) : 'Volunteer'}</p>
                              {watchWorkerCount > 1 && watchAmount > 0 && <p className="text-xs text-muted-foreground">{formatLocal(watchAmount)} per worker × {watchWorkerCount}</p>}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="bg-muted/50 p-6 border-t flex justify-between items-center">
                  <Button type="button" variant="ghost" onClick={prevStep} disabled={step === 1}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  {step < 5 ? (
                    <Button type="button" onClick={nextStep} className="px-8"><span>Next Step</span> <ArrowRight className="w-4 h-4 ml-2" /></Button>
                  ) : (
                    <Button type="submit" className="px-8 font-bold">
                      {totalBudget > 0 ? `Post Task (${formatLocal(totalCost)})` : "Post Task — Free"}
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
