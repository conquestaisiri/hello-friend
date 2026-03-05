import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MapPin, Clock, Search, Filter, Loader2, 
  Sparkles, ArrowRight, User, ChevronRight, Zap, Grid3X3, List,
  Globe, Shield, Star, Users
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useTasksStore, type HelpTask } from "@/stores/tasks-store";
import { useSectorStore } from "@/stores/sector-store";
import { useLocalizationStore } from "@/stores/localization-store";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";

const categoryLabels: Record<string, string> = {
  physical_help: "Physical Help",
  errands: "Errands",
  tech_help: "Tech Help",
  guidance: "Guidance",
  transportation: "Transportation",
  home_repairs: "Home Repairs",
  childcare: "Childcare",
  pet_care: "Pet Care",
  tutoring: "Tutoring",
  other: "Other",
};

const categoryColors: Record<string, string> = {
  physical_help: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  errands: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  tech_help: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  guidance: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  transportation: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  home_repairs: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  childcare: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  pet_care: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  tutoring: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  other: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

const urgencyColors: Record<string, string> = {
  critical: "bg-red-500 text-white",
  urgent: "bg-orange-500 text-white",
  high: "bg-amber-500 text-white",
  medium: "bg-blue-500 text-white",
  low: "bg-slate-400 text-white",
};

export default function DiscoverPage() {
  const { user } = useFirebaseAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { sector } = useSectorStore();
  const { formatLocal } = useLocalizationStore();
  const tasks = useTasksStore((s) => s.tasks);

  const publishedTasks = tasks.filter((t) => {
    if (t.status !== "published") return false;
    // Sector filter
    if (sector === "real_world" && t.sector !== "real_world") return false;
    if (sector === "web3_digital" && t.sector !== "web3_digital") return false;
    // Category filter
    if (categoryFilter && categoryFilter !== "all" && t.category !== categoryFilter) return false;
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    }
    return true;
  });

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className={`border-b ${sector === "web3_digital" ? "bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900" : "bg-gradient-to-br from-primary/5 via-accent/5 to-transparent"}`}>
        <div className="container mx-auto px-4 py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <Badge className={`mb-4 px-4 py-1.5 rounded-full ${sector === "web3_digital" ? "bg-purple-500/20 text-purple-300 border-purple-500/30" : "bg-primary/10 text-primary border-primary/20"}`}>
              {sector === "web3_digital" ? <Globe className="w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {sector === "web3_digital" ? "Global Digital Tasks" : "Local Community Tasks"}
            </Badge>
            <h1 className={`text-4xl font-bold mb-3 ${sector === "web3_digital" ? "text-white" : ""}`}>
              {sector === "web3_digital" ? "Find digital tasks worldwide" : "Find tasks to help with"}
            </h1>
            <p className={`text-lg ${sector === "web3_digital" ? "text-slate-400" : "text-muted-foreground"}`}>
              {sector === "web3_digital" 
                ? "Browse global tech opportunities • Payments in USDC" 
                : "Browse open tasks from people in your community who need help"}
            </p>
          </motion.div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col lg:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm"
            />
          </div>
          
          <div className="flex gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full lg:w-[200px] h-12 rounded-xl border-slate-200 dark:border-slate-700">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="rounded-none h-12 w-12" onClick={() => setViewMode("grid")}>
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="rounded-none h-12 w-12" onClick={() => setViewMode("list")}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {Object.entries(categoryLabels).slice(0, 6).map(([value, label]) => (
            <Badge
              key={value}
              variant={categoryFilter === value ? "default" : "secondary"}
              className={`cursor-pointer rounded-full px-4 py-2 transition-all ${
                categoryFilter === value ? "bg-primary text-white" : "hover:bg-primary/10 hover:text-primary"
              }`}
              onClick={() => setCategoryFilter(categoryFilter === value ? "" : value)}
            >
              {label}
            </Badge>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {publishedTasks.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="p-16 text-center border-dashed border-2">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Search className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">No tasks found</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  {searchQuery || categoryFilter
                    ? "Try adjusting your search or filters"
                    : "Be the first to post a task!"}
                </p>
                <Link href="/create-request">
                  <Button size="lg" className="rounded-full px-8">
                    Post a Task <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </Card>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{publishedTasks.length}</span> tasks available
                </p>
              </div>
              
              <div className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                {publishedTasks.map((task, index) => (
                  <TaskCard key={task.id} task={task} index={index} viewMode={viewMode} formatLocal={formatLocal} getTimeAgo={getTimeAgo} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <Footer />
    </div>
  );
}

function TaskCard({ task, index, viewMode, formatLocal, getTimeAgo }: { 
  task: HelpTask; index: number; viewMode: string; 
  formatLocal: (n: number) => string; getTimeAgo: (s: string) => string 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link href={`/request/${task.id}`}>
        <Card className={`group cursor-pointer border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 ${viewMode === "grid" ? "h-full" : ""}`}>
          <CardContent className={`p-6 ${viewMode === "list" ? "flex items-center gap-6" : ""}`}>
            <div className={viewMode === "list" ? "flex-1" : ""}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex flex-wrap gap-2">
                  <Badge className={categoryColors[task.category] || categoryColors.other}>
                    {categoryLabels[task.category] || task.category}
                  </Badge>
                  <Badge className={urgencyColors[task.urgency]}>
                    {task.urgency}
                  </Badge>
                  {task.verificationTierRequired >= 2 && (
                    <Badge variant="outline" className="text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      Tier {task.verificationTierRequired}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" />
                  {getTimeAgo(task.createdAt)}
                </span>
              </div>
              
              <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {task.title}
              </h3>
              
              <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                {task.description}
              </p>
              
              {/* Batch indicator */}
              {task.workerCount > 1 && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-accent/10 rounded-lg">
                  <Users className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">
                    {task.slotsFilled}/{task.workerCount} workers hired
                  </span>
                  <div className="flex-1 h-1.5 bg-accent/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${(task.slotsFilled / task.workerCount) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
                {task.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {task.location}
                  </span>
                )}
                {task.isVirtual && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    Remote
                  </span>
                )}
                {task.applications.length > 0 && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {task.applications.length} offers
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                {task.rewardAmount ? (
                  <div>
                    <div className="font-bold text-lg text-primary">
                      {formatLocal(task.rewardAmount)}
                    </div>
                    {task.workerCount > 1 && task.rewardDescription && (
                      <p className="text-xs text-muted-foreground">{task.rewardDescription}</p>
                    )}
                  </div>
                ) : (
                  <Badge variant="secondary" className="rounded-full">
                    <Zap className="w-3 h-3 mr-1" /> Flexible
                  </Badge>
                )}
                
                <span className="text-sm text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  View Details <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
