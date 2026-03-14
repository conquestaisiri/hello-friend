import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MapPin, Clock, Search, Filter, ArrowRight, ChevronRight,
  Globe, Users, Grid3X3, List, X, Star
} from "lucide-react";
import { Link, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useTasksStore } from "@/stores/tasks-store";
import { useLocalizationStore } from "@/stores/localization-store";

/* ── category maps ──────────────────────────────────────── */
const CATEGORY_MAP: Record<string, string> = {
  physical_help: "Physical Help", errands: "Errands", tech_help: "Tech Help",
  guidance: "Guidance", transportation: "Transportation", home_repairs: "Home Repairs",
  childcare: "Childcare", pet_care: "Pet Care", tutoring: "Tutoring",
  digital_work: "Digital Work", design: "Design", writing: "Writing",
  programming: "Programming", marketing: "Marketing", research: "Research",
  education: "Education", translation: "Translation", consulting: "Consulting",
  home_services: "Home Services", other: "Other",
};

/* Colored badges per category */
const CATEGORY_COLORS: Record<string, string> = {
  physical_help:  "bg-orange-50 text-orange-700 border-orange-200",
  errands:        "bg-amber-50 text-amber-700 border-amber-200",
  home_repairs:   "bg-orange-50 text-orange-700 border-orange-200",
  home_services:  "bg-amber-50 text-amber-700 border-amber-200",
  tech_help:      "bg-blue-50 text-blue-700 border-blue-200",
  programming:    "bg-blue-50 text-blue-700 border-blue-200",
  digital_work:   "bg-sky-50 text-sky-700 border-sky-200",
  design:         "bg-violet-50 text-violet-700 border-violet-200",
  writing:        "bg-teal-50 text-teal-700 border-teal-200",
  marketing:      "bg-teal-50 text-teal-700 border-teal-200",
  research:       "bg-cyan-50 text-cyan-700 border-cyan-200",
  education:      "bg-indigo-50 text-indigo-700 border-indigo-200",
  tutoring:       "bg-indigo-50 text-indigo-700 border-indigo-200",
  guidance:       "bg-indigo-50 text-indigo-700 border-indigo-200",
  transportation: "bg-yellow-50 text-yellow-700 border-yellow-200",
  translation:    "bg-rose-50 text-rose-700 border-rose-200",
  consulting:     "bg-pink-50 text-pink-700 border-pink-200",
  childcare:      "bg-pink-50 text-pink-700 border-pink-200",
  pet_care:       "bg-green-50 text-green-700 border-green-200",
  other:          "bg-gray-50 text-gray-600 border-gray-200",
};

/* Task cover images per category — picsum seeds for consistency */
const CATEGORY_IMAGES: Record<string, string> = {
  design:         "https://picsum.photos/seed/design-creative/800/400",
  writing:        "https://picsum.photos/seed/writing-desk/800/400",
  programming:    "https://picsum.photos/seed/code-laptop/800/400",
  digital_work:   "https://picsum.photos/seed/digital-laptop/800/400",
  marketing:      "https://picsum.photos/seed/marketing-team/800/400",
  research:       "https://picsum.photos/seed/research-books/800/400",
  translation:    "https://picsum.photos/seed/language-books/800/400",
  consulting:     "https://picsum.photos/seed/business-meeting/800/400",
  education:      "https://picsum.photos/seed/study-classroom/800/400",
  tutoring:       "https://picsum.photos/seed/tutoring-student/800/400",
  guidance:       "https://picsum.photos/seed/guidance-coach/800/400",
  tech_help:      "https://picsum.photos/seed/tech-support/800/400",
  physical_help:  "https://picsum.photos/seed/moving-help/800/400",
  home_repairs:   "https://picsum.photos/seed/home-repair/800/400",
  home_services:  "https://picsum.photos/seed/home-cleaning/800/400",
  errands:        "https://picsum.photos/seed/errands-shopping/800/400",
  transportation: "https://picsum.photos/seed/delivery-transport/800/400",
  childcare:      "https://picsum.photos/seed/childcare-kids/800/400",
  pet_care:       "https://picsum.photos/seed/pet-dog/800/400",
  other:          "https://picsum.photos/seed/task-general/800/400",
};

/* Avatar placeholder for task poster — derived from name */
const getAvatarUrl = (name: string): string => {
  const n = ((name.charCodeAt(0) || 65) + (name.charCodeAt(1) || 65)) % 70 + 1;
  return `https://i.pravatar.cc/40?img=${n}`;
};

/* Get task cover image */
const getTaskImage = (category: string): string =>
  CATEGORY_IMAGES[category] || "https://picsum.photos/seed/helpchain-task/800/400";

/* ── time helper ─────────────────────────────────────────── */
const getTimeAgo = (dateString: string) => {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
};

/* ── duration labels ─────────────────────────────────────── */
const DURATION_LABELS: Record<string, string> = {
  same_day: "Same Day", "1_3_days": "1-3 Days", "4_7_days": "4-7 Days",
  "1_2_weeks": "1-2 Weeks", flexible: "Flexible", milestone: "Milestone",
};

/* ══════════════════════════════════════════════════════════ */
export default function DiscoverPage() {
  const searchParams = useSearch();
  const initialQuery = new URLSearchParams(searchParams).get("query") || "";
  const initialCategory = new URLSearchParams(searchParams).get("category") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [locationFilter, setLocationFilter] = useState<"all" | "remote" | "local">("all");
  const [budgetRange] = useState([0, 1000000]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setLocationFilter("all");
  };

  const hasActiveFilters = categoryFilter || locationFilter !== "all" || searchQuery;

  /* ── quick category pills (top 9) ─────────────────────── */
  const quickCategories = [
    { v: "physical_help", l: "Physical Help" },
    { v: "digital_work",  l: "Digital Work"  },
    { v: "design",        l: "Design"        },
    { v: "writing",       l: "Writing"       },
    { v: "tech_help",     l: "Tech Help"     },
    { v: "home_services", l: "Home Services" },
    { v: "education",     l: "Education"     },
    { v: "transportation",l: "Delivery"      },
    { v: "marketing",     l: "Marketing"     },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* ── page header ── */}
      <div className="border-b border-gray-100 bg-[#F8FAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs font-bold tracking-widest uppercase text-[#0C6B38] mb-1">Marketplace</p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#0D0D0D] mb-1">Find tasks</h1>
            <p className="text-gray-500 text-sm">Browse opportunities from clients around the world</p>
          </motion.div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

        {/* ── search & filters ── */}
        <div className="flex flex-col lg:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-[#0C6B38]/50 placeholder-gray-400"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={categoryFilter || "all"} onValueChange={v => setCategoryFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="h-11 rounded-xl border-gray-200 text-sm w-full sm:w-[180px]">
                <Filter className="h-3.5 w-3.5 mr-2 text-gray-400" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(CATEGORY_MAP).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={locationFilter} onValueChange={v => setLocationFilter(v as "all" | "remote" | "local")}>
              <SelectTrigger className="h-11 rounded-xl border-gray-200 text-sm w-[130px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="local">On-site</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`h-11 w-11 flex items-center justify-center transition-colors ${viewMode === "grid" ? "bg-[#0C6B38] text-white" : "bg-white text-gray-400 hover:text-gray-600"}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`h-11 w-11 flex items-center justify-center transition-colors ${viewMode === "list" ? "bg-[#0C6B38] text-white" : "bg-white text-gray-400 hover:text-gray-600"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── quick category pills ── */}
        <div className="flex flex-wrap gap-2 mb-6">
          {quickCategories.map(({ v, l }) => {
            const active = categoryFilter === v;
            return (
              <button
                key={v}
                onClick={() => setCategoryFilter(active ? "" : v)}
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all ${
                  active
                    ? "bg-[#0C6B38] text-white border-[#0C6B38]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#0C6B38]/40 hover:text-[#0C6B38]"
                }`}
              >
                {l}
              </button>
            );
          })}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold px-3.5 py-1.5 rounded-full border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-all flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* ── results count ── */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-[#0D0D0D]">{publishedTasks.length}</span> tasks available
          </p>
        </div>

        {/* ── task grid / list ── */}
        <AnimatePresence mode="wait">
          {publishedTasks.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-5">
                <Search className="h-7 w-7 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-[#0D0D0D] mb-2">No tasks found</h3>
              <p className="text-gray-400 text-sm mb-6">
                {hasActiveFilters ? "Try adjusting your filters or search terms" : "Be the first to post a task!"}
              </p>
              <Link href="/create-request">
                <Button className="bg-[#0C6B38] hover:bg-[#0a5a30] text-white rounded-xl px-8 h-11">
                  Post a Task <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className={
                viewMode === "grid"
                  ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
                  : "space-y-4"
              }>
                {publishedTasks.map((task, i) => {
                  const catColor = CATEGORY_COLORS[task.category] || "bg-gray-50 text-gray-600 border-gray-200";
                  const catLabel = CATEGORY_MAP[task.category] || task.category;
                  const taskImage = getTaskImage(task.category);
                  const avatarUrl = getAvatarUrl(task.creatorName || task.creatorId);

                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Link href={`/request/${task.id}`}>
                        {viewMode === "grid" ? (
                          /* ── GRID CARD ── */
                          <div
                            className="group cursor-pointer bg-white rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
                            style={{ border: "1px solid #F0F0F0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                            onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(12,107,56,0.22)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 20px rgba(12,107,56,0.09)"; }}
                            onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#F0F0F0"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)"; }}
                          >
                            {/* cover image */}
                            <div className="relative h-44 overflow-hidden bg-gray-100">
                              <img
                                src={taskImage}
                                alt={catLabel}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                                onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${task.id}/800/400`; }}
                              />
                              {/* category badge overlay */}
                              <div className="absolute top-3 left-3">
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border backdrop-blur-sm bg-white/90 ${catColor}`}>
                                  {catLabel}
                                </span>
                              </div>
                              {/* type badge */}
                              <div className="absolute top-3 right-3">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full border backdrop-blur-sm ${
                                  task.isVirtual
                                    ? "bg-sky-50/90 text-sky-700 border-sky-200"
                                    : "bg-orange-50/90 text-orange-700 border-orange-200"
                                }`}>
                                  {task.isVirtual ? "Remote" : "On-site"}
                                </span>
                              </div>
                            </div>

                            {/* card body */}
                            <div className="p-5">
                              <h3 className="font-semibold text-sm text-[#0D0D0D] leading-snug mb-3 line-clamp-2 group-hover:text-[#0C6B38] transition-colors">
                                {task.title}
                              </h3>
                              <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">{task.description}</p>

                              {/* meta row */}
                              <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-4">
                                {task.location && (
                                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{task.location}</span>
                                )}
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{getTimeAgo(task.createdAt)}</span>
                                {task.applications.length > 0 && (
                                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{task.applications.length} offers</span>
                                )}
                              </div>

                              {/* footer */}
                              <div className="flex items-center justify-between pt-3.5" style={{ borderTop: "1px solid #F5F5F5" }}>
                                {/* poster */}
                                <div className="flex items-center gap-2">
                                  <img
                                    src={avatarUrl}
                                    alt={task.creatorName}
                                    className="w-7 h-7 rounded-full object-cover border-2 border-white shadow-sm"
                                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                                  />
                                  <span className="text-xs text-gray-500 font-medium truncate max-w-[80px]">
                                    {task.creatorName || "Anonymous"}
                                  </span>
                                </div>
                                {/* budget */}
                                {task.rewardAmount ? (
                                  <span className="text-base font-bold" style={{ color: "#0C6B38" }}>
                                    {formatLocal(task.rewardAmount)}
                                  </span>
                                ) : (
                                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-100">
                                    Flexible
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* ── LIST ROW ── */
                          <div
                            className="group cursor-pointer bg-white rounded-2xl overflow-hidden transition-all duration-200"
                            style={{ border: "1px solid #F0F0F0", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                            onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(12,107,56,0.2)"; }}
                            onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#F0F0F0"; }}
                          >
                            <div className="flex gap-0">
                              {/* thumbnail */}
                              <div className="w-32 sm:w-44 shrink-0 h-full min-h-[120px] bg-gray-100 overflow-hidden">
                                <img
                                  src={taskImage}
                                  alt={catLabel}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 min-h-[120px]"
                                  loading="lazy"
                                />
                              </div>
                              {/* content */}
                              <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                                <div>
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${catColor}`}>
                                      {catLabel}
                                    </span>
                                    <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                                      <Clock className="w-3 h-3" />{getTimeAgo(task.createdAt)}
                                    </span>
                                  </div>
                                  <h3 className="font-semibold text-sm text-[#0D0D0D] leading-snug mb-1 group-hover:text-[#0C6B38] transition-colors line-clamp-1">
                                    {task.title}
                                  </h3>
                                  <p className="text-xs text-gray-400 line-clamp-1">{task.description}</p>
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={avatarUrl}
                                      alt={task.creatorName}
                                      className="w-6 h-6 rounded-full object-cover border border-gray-100"
                                    />
                                    <span className="text-xs text-gray-400">{task.creatorName || "Anonymous"}</span>
                                  </div>
                                  {task.rewardAmount ? (
                                    <span className="text-sm font-bold" style={{ color: "#0C6B38" }}>
                                      {formatLocal(task.rewardAmount)}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400">Flexible</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* load more placeholder */}
        {publishedTasks.length > 0 && (
          <div className="text-center mt-10">
            <p className="text-sm text-gray-400">Showing all {publishedTasks.length} available tasks</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
