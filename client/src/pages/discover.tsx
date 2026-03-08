import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  MapPin, Clock, Search, Filter, ArrowRight, ChevronRight,
  Globe, Shield, Star, Users, Grid3X3, List, X, SlidersHorizontal
} from "lucide-react";
import { Link, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useTasksStore, type HelpTask } from "@/stores/tasks-store";
import { useSectorStore } from "@/stores/sector-store";
import { useLocalizationStore } from "@/stores/localization-store";

const CATEGORY_MAP: Record<string, string> = {
  physical_help: "Physical Help", errands: "Errands", tech_help: "Tech Help",
  guidance: "Guidance", transportation: "Transportation", home_repairs: "Home Repairs",
  childcare: "Childcare", pet_care: "Pet Care", tutoring: "Tutoring",
  digital_work: "Digital Work", design: "Design", writing: "Writing",
  programming: "Programming", marketing: "Marketing", research: "Research",
  education: "Education", translation: "Translation", consulting: "Consulting",
  home_services: "Home Services", other: "Other",
};

const DURATION_LABELS: Record<string, string> = {
  same_day: "Same Day", "1_3_days": "1-3 Days", "4_7_days": "4-7 Days",
  "1_2_weeks": "1-2 Weeks", flexible: "Flexible", milestone: "Milestone",
};

export default function DiscoverPage() {
  const searchParams = useSearch();
  const initialQuery = new URLSearchParams(searchParams).get("query") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState<"all" | "remote" | "local">("all");
  const [budgetRange, setBudgetRange] = useState([0, 1000000]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  const { sector } = useSectorStore();
  const { formatLocal } = useLocalizationStore();
  const tasks = useTasksStore((s) => s.tasks);

  const publishedTasks = tasks.filter((t) => {
    if (t.status !== "published") return false;
    if (categoryFilter && categoryFilter !== "all" && t.category !== categoryFilter) return false;
    if (locationFilter === "remote" && !t.isVirtual) return false;
    if (locationFilter === "local" && t.isVirtual) return false;
    if (t.rewardAmount && (t.rewardAmount < budgetRange[0] || t.rewardAmount > budgetRange[1])) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
    }
    return true;
  });

  const getTimeAgo = (dateString: string) => {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    return `${days}d ago`;
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setLocationFilter("all");
    setBudgetRange([0, 1000000]);
  };

  const hasActiveFilters = categoryFilter || locationFilter !== "all" || searchQuery;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-transparent border-b border-border">
        <div className="container mx-auto px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-3 text-foreground">Find tasks</h1>
            <p className="text-lg text-muted-foreground">Browse opportunities from clients around the world</p>
          </motion.div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Search & Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-12 h-12 rounded-xl border-border" />
          </div>
          <div className="flex gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full lg:w-[200px] h-12 rounded-xl"><Filter className="h-4 w-4 mr-2 text-muted-foreground" /><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Categories</SelectItem>{Object.entries(CATEGORY_MAP).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
            </Select>

            <Select value={locationFilter} onValueChange={(v) => setLocationFilter(v as any)}>
              <SelectTrigger className="w-[140px] h-12 rounded-xl"><SelectValue placeholder="Location" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="local">On-site</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex rounded-xl border border-border overflow-hidden">
              <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="rounded-none h-12 w-12" onClick={() => setViewMode("grid")}><Grid3X3 className="h-4 w-4" /></Button>
              <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="rounded-none h-12 w-12" onClick={() => setViewMode("list")}><List className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        {/* Quick category pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(CATEGORY_MAP).slice(0, 8).map(([v, l]) => (
            <Badge key={v} variant={categoryFilter === v ? "default" : "secondary"}
              className={`cursor-pointer rounded-full px-4 py-2 transition-all ${categoryFilter === v ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"}`}
              onClick={() => setCategoryFilter(categoryFilter === v ? "" : v)}>
              {l}
            </Badge>
          ))}
          {hasActiveFilters && (
            <Badge variant="outline" className="cursor-pointer rounded-full px-4 py-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={clearFilters}>
              <X className="w-3 h-3 mr-1" /> Clear
            </Badge>
          )}
        </div>

        {/* Results */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground"><span className="font-semibold text-foreground">{publishedTasks.length}</span> tasks available</p>
        </div>

        <AnimatePresence mode="wait">
          {publishedTasks.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="p-16 text-center border-dashed border-2">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
                <h3 className="text-2xl font-bold mb-3 text-foreground">No tasks found</h3>
                <p className="text-muted-foreground mb-6">{hasActiveFilters ? "Try adjusting your filters" : "Be the first to post a task!"}</p>
                <Link href="/create-request"><Button size="lg" className="rounded-full px-8">Post a Task <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              </Card>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                {publishedTasks.map((task, i) => (
                  <motion.div key={task.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Link href={`/request/${task.id}`}>
                      <Card className="group cursor-pointer border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300 h-full">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <Badge variant="secondary" className="text-xs">{CATEGORY_MAP[task.category] || task.category}</Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{getTimeAgo(task.createdAt)}</span>
                          </div>
                          <h3 className="font-semibold text-lg mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-2">{task.title}</h3>
                          <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{task.description}</p>

                          {task.workerCount > 1 && (
                            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-accent/10 rounded-lg">
                              <Users className="w-4 h-4 text-accent" />
                              <span className="text-sm font-medium">{task.slotsFilled}/{task.workerCount} workers</span>
                              <div className="flex-1 h-1.5 bg-accent/20 rounded-full overflow-hidden">
                                <div className="h-full bg-accent rounded-full" style={{ width: `${(task.slotsFilled / task.workerCount) * 100}%` }} />
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                            {task.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{task.location}</span>}
                            {task.isVirtual && <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />Remote</span>}
                            {task.applications.length > 0 && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{task.applications.length} offers</span>}
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-border">
                            {task.rewardAmount ? (
                              <span className="font-bold text-lg text-primary">{formatLocal(task.rewardAmount)}</span>
                            ) : (
                              <Badge variant="secondary" className="rounded-full">Flexible</Badge>
                            )}
                            <span className="text-sm text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                              View <ChevronRight className="w-4 h-4" />
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
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
