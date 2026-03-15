import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Search, ArrowRight, Star, Shield, Clock,
  ChevronRight, Briefcase, BarChart3,
  Home as HomeIcon, Cpu, Paintbrush, PenLine, Package,
  GraduationCap, Megaphone, Languages,
  Zap, Lock, HeartHandshake,
  Twitter, Linkedin, Instagram, Facebook,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";

/* ── animation preset ───────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.48, ease: [0.0, 0.0, 0.2, 1.0] as [number, number, number, number] },
  }),
};

/* ── data ────────────────────────────────────────────────── */
const typingPhrases = ["home cleaning", "logo design", "furniture moving", "web development", "content writing", "tutoring help", "delivery runs"];

const categories = [
  { label: "Home Services",  icon: HomeIcon,      desc: "Cleaning, repairs, moving" },
  { label: "Tech Help",      icon: Cpu,           desc: "Dev, IT support, software" },
  { label: "Design",         icon: Paintbrush,    desc: "Graphics, UI/UX, branding" },
  { label: "Writing",        icon: PenLine,       desc: "Content, copy, editing" },
  { label: "Delivery",       icon: Package,       desc: "Packages, errands, logistics" },
  { label: "Education",      icon: GraduationCap, desc: "Tutoring, mentoring" },
  { label: "Marketing",      icon: Megaphone,     desc: "Social media, SEO, ads" },
  { label: "Translation",    icon: Languages,     desc: "Documents, localization" },
  { label: "Photography",    icon: Briefcase,     desc: "Events, portraits, product" },
  { label: "Event Planning", icon: BarChart3,     desc: "Weddings, parties, corporate" },
  { label: "Fitness",        icon: Zap,           desc: "Personal training, wellness" },
  { label: "Cooking",        icon: HeartHandshake,desc: "Catering, meal prep, chef" },
];

const steps = [
  { n: "01", title: "Post Your Task",  desc: "Describe what you need, set a budget, and go live in under 3 minutes." },
  { n: "02", title: "Pick a Worker",   desc: "Browse offers from verified workers, check reviews, and choose your match." },
  { n: "03", title: "Pay Securely",    desc: "Funds sit in escrow until you approve the work. Zero risk, every time." },
];

const sampleTasks = [
  { cat: "Design",        title: "Design a logo for my coffee brand",      budget: "₦120,000", bids: 9,  img: "https://picsum.photos/seed/design-creative/600/300" },
  { cat: "Home Services", title: "Deep clean 3-bedroom apartment (Lagos)",  budget: "₦65,000",  bids: 5,  img: "https://picsum.photos/seed/home-cleaning/600/300" },
  { cat: "Tech Help",     title: "Fix bug in my React web application",     budget: "₦180,000", bids: 14, img: "https://picsum.photos/seed/code-laptop/600/300" },
  { cat: "Writing",       title: "Write 10 blog articles about fintech",    budget: "₦280,000", bids: 6,  img: "https://picsum.photos/seed/writing-desk/600/300" },
  { cat: "Delivery",      title: "Pick up and deliver groceries (Abuja)",   budget: "₦15,000",  bids: 3,  img: "https://picsum.photos/seed/delivery-transport/600/300" },
  { cat: "Education",     title: "Teach my daughter GCSE Mathematics",      budget: "₦80,000",  bids: 8,  img: "https://picsum.photos/seed/tutoring-student/600/300" },
];

const stats = [
  { value: "50K+", label: "Tasks Completed" },
  { value: "120+", label: "Countries Active" },
  { value: "4.9",  label: "Average Rating"  },
  { value: "₦3B+", label: "Paid to Workers" },
];

const trust = [
  { icon: Lock,   title: "Escrow Protection",  desc: "Your payment is locked until you confirm the work is done." },
  { icon: Shield, title: "Verified Workers",   desc: "Every worker goes through identity checks and skill verification." },
  { icon: Star,   title: "Honest Reviews",     desc: "Real ratings from real clients, visible on every profile." },
  { icon: Zap,    title: "Fast Payouts",       desc: "Workers receive earnings within 24 hours of task approval." },
];

const testimonials = [
  { name: "Chisom A.", role: "Client — Lagos",  quote: "I needed a logo urgently and got 8 offers in under an hour. The escrow process gave me total peace of mind.", img: "https://i.pravatar.cc/40?img=47" },
  { name: "David M.",  role: "Worker — Nairobi",quote: "I've been earning consistently for 6 months. Fast payouts and I've never had a payment dispute.", img: "https://i.pravatar.cc/40?img=11" },
  { name: "Sandra E.", role: "Client — London", quote: "HelpChain's verification system makes all the difference. Quality workers and a trustworthy process.", img: "https://i.pravatar.cc/40?img=32" },
];

/* ══════════════════════════════════════════════════════════
   HOME PAGE
══════════════════════════════════════════════════════════ */
export default function Home() {
  const [searchInput, setSearchInput] = useState("");
  const [, setLocation] = useLocation();
  const { user } = useFirebaseAuth();

  /* typing animation */
  const [typingText, setTypingText] = useState("");
  const [phraseIdx, setPhraseIdx]   = useState(0);
  const [deleting, setDeleting]     = useState(false);

  useEffect(() => {
    const phrase = typingPhrases[phraseIdx];
    const t = setTimeout(() => {
      if (!deleting) {
        if (typingText.length < phrase.length) setTypingText(phrase.slice(0, typingText.length + 1));
        else setTimeout(() => setDeleting(true), 1800);
      } else {
        if (typingText.length > 0) setTypingText(typingText.slice(0, -1));
        else { setDeleting(false); setPhraseIdx(i => (i + 1) % typingPhrases.length); }
      }
    }, deleting ? 45 : 90);
    return () => clearTimeout(t);
  }, [typingText, deleting, phraseIdx]);

  const handleSearch = () => {
    const q = searchInput.trim();
    setLocation(q ? `/discover?query=${encodeURIComponent(q)}` : "/discover");
  };

  const navLinks = user
    ? [{ href: "/dashboard", label: "Dashboard" }, { href: "/discover", label: "Find Tasks" }, { href: "/wallet", label: "Wallet" }, { href: "/messages", label: "Messages" }]
    : [{ href: "/discover", label: "Find Tasks" }, { href: "/how-it-works", label: "How It Works" }, { href: "/pricing", label: "Pricing" }];

  /* ── render ─────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-white text-[#111]" style={{ fontFamily: "'Figtree', sans-serif" }}>

      {/* ═══════ NAVBAR ═══════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/96 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer select-none">
              <img src="/images/helpchain-logo.png" alt="HelpChain" className="w-9 h-9 object-contain rounded-xl" />
              <span className="text-[15px] font-bold tracking-tight text-[#0C6B38]">HelpChain</span>
            </div>
          </Link>

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href}>
                <span className="text-sm font-medium text-gray-500 hover:text-[#0C6B38] transition-colors cursor-pointer">{l.label}</span>
              </Link>
            ))}
          </div>

          {/* Right CTAs */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/create-request">
                <Button className="bg-[#0C6B38] hover:bg-[#0a5a30] text-white text-sm h-9 px-5 rounded-lg font-semibold">Post a Task</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth">
                  <span className="hidden sm:block text-sm font-medium text-gray-500 hover:text-[#0C6B38] cursor-pointer transition-colors">Log in</span>
                </Link>
                <Link href="/auth?mode=signup">
                  <Button className="bg-[#0C6B38] hover:bg-[#0a5a30] text-white text-sm h-9 px-5 rounded-lg font-semibold">Get Started</Button>
                </Link>
              </>
            )}
          </div>

        </div>
      </nav>

      {/* ═══════ HERO ═══════ */}
      <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto">

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-7"
              style={{ background: "rgba(12,107,56,0.07)", border: "1px solid rgba(12,107,56,0.14)", color: "#0C6B38" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#0C6B38] animate-pulse" />
              600+ active tasks right now
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.55 }}
            className="text-[2.6rem] sm:text-5xl md:text-[3.5rem] font-bold leading-[1.08] tracking-tight text-[#0D0D0D] mb-5"
          >
            Find Skilled Helpers<br />
            <span style={{ color: "#0C6B38" }}>for Any Task, Anytime</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.55 }}
            className="text-base sm:text-lg text-gray-500 mb-9 leading-relaxed"
          >
            Access a global network of trusted workers ready to help with{" "}
            <span className="font-semibold" style={{ color: "#0C6B38" }}>{typingText}<span className="opacity-70">|</span></span>
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.55 }}
            className="flex items-center bg-white rounded-xl overflow-hidden mb-5 max-w-lg mx-auto"
            style={{ border: "1.5px solid #E5E7EB", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}
          >
            <Search className="w-5 h-5 text-gray-400 ml-4 shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Search any service..."
              className="flex-1 px-3 py-3.5 text-sm bg-transparent outline-none placeholder-gray-400 text-gray-800"
            />
            <button
              onClick={handleSearch}
              className="text-white text-sm font-semibold px-6 py-3.5 transition-colors"
              style={{ background: "#0C6B38" }}
              onMouseOver={e => (e.currentTarget.style.background = "#0a5a30")}
              onMouseOut={e => (e.currentTarget.style.background = "#0C6B38")}
            >
              Search
            </button>
          </motion.div>

          {/* Popular tags */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.34, duration: 0.45 }}
            className="flex flex-wrap items-center justify-center gap-2"
          >
            <span className="text-xs text-gray-400 font-medium">Popular:</span>
            {["Logo Design", "Home Cleaning", "Web Dev", "Delivery", "Tutoring"].map(tag => (
              <button
                key={tag}
                onClick={() => setLocation(`/discover?query=${encodeURIComponent(tag)}`)}
                className="text-xs px-3 py-1.5 rounded-full bg-white text-gray-600 hover:text-[#0C6B38] transition-colors"
                style={{ border: "1px solid #E5E7EB" }}
              >
                {tag}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Worker profile cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.6 }}
          className="mt-14 flex items-center justify-center gap-4 flex-wrap"
        >
          {[
            { name: "Amaka U.",  cat: "UI Designer",    rating: "5.0", jobs: 142, img: "https://i.pravatar.cc/80?img=47", badge: "Top Rated" },
            { name: "James D.",  cat: "Web Developer",  rating: "4.9", jobs: 98,  img: "https://i.pravatar.cc/80?img=12", badge: "Pro"       },
            { name: "Fatima K.", cat: "Copywriter",     rating: "4.8", jobs: 73,  img: "https://i.pravatar.cc/80?img=28", badge: null        },
            { name: "Tobi A.",   cat: "Delivery Agent", rating: "5.0", jobs: 210, img: "https://i.pravatar.cc/80?img=33", badge: "Top Rated" },
          ].map((w, i) => (
            <motion.div
              key={w.name}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
              className="group relative bg-white rounded-2xl px-4 pt-4 pb-3.5 cursor-pointer transition-all hover:-translate-y-0.5"
              style={{
                border: "1px solid #EEEEEE",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                minWidth: "160px",
              }}
            >
              {/* Online dot */}
              <div className="relative w-fit mx-auto mb-3">
                <img
                  src={w.img}
                  alt={w.name}
                  className="w-14 h-14 rounded-2xl object-cover shadow-md"
                />
                <span
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                  style={{ background: "#0C6B38" }}
                />
              </div>

              {/* Badge */}
              {w.badge && (
                <div
                  className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: "linear-gradient(135deg, #0C6B38, #0a5a30)" }}
                >
                  {w.badge}
                </div>
              )}

              {/* Info */}
              <div className="text-center">
                <p className="text-sm font-bold text-[#0D0D0D] leading-tight">{w.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 mb-2">{w.cat}</p>

                <div className="flex items-center justify-center gap-2">
                  <span className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-semibold text-[#0D0D0D]">{w.rating}</span>
                  </span>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs text-gray-400">{w.jobs} tasks</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Hero visual — single strong image */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-16 relative rounded-3xl overflow-hidden max-w-4xl mx-auto"
          style={{ height: "400px" }}
        >
          <img
            src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&h=700&fit=crop&auto=format"
            alt="Diverse team collaborating on tasks"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.05) 60%)" }} />
          {/* floating stat cards */}
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
            <div className="flex gap-3">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg">
                <p className="text-xl font-bold" style={{ color: "#0C6B38" }}>50K+</p>
                <p className="text-xs text-gray-500">Tasks Done</p>
              </div>
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg">
                <p className="text-xl font-bold" style={{ color: "#0C6B38" }}>₦3B+</p>
                <p className="text-xs text-gray-500">Paid to Workers</p>
              </div>
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg">
                <p className="text-xl font-bold" style={{ color: "#0C6B38" }}>4.9★</p>
                <p className="text-xs text-gray-500">Avg Rating</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══════ STATS BAR ═══════ */}
      <section style={{ background: "#0C6B38" }} className="py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s, i) => (
            <motion.div key={s.label} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}>
              <p className="text-3xl font-bold text-white mb-1">{s.value}</p>
              <p className="text-sm text-white/65">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════ CATEGORIES ═══════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#0C6B38" }}>Browse by category</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0D0D0D]">Choose your category</h2>
          </div>
          <Link href="/discover">
            <span className="hidden sm:flex items-center gap-1 text-sm font-medium cursor-pointer hover:underline" style={{ color: "#0C6B38" }}>
              View all <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {categories.map((cat, i) => (
            <motion.div key={cat.label} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}>
              <Link href={`/discover?category=${encodeURIComponent(cat.label)}`}>
                <div
                  className="group cursor-pointer bg-white rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
                  style={{ border: "1px solid #F0F0F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                  onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(12,107,56,0.25)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 12px rgba(12,107,56,0.08)"; }}
                  onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#F0F0F0"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 group-hover:bg-[#0C6B38]/8 group-hover:border-[#0C6B38]/20 flex items-center justify-center mb-4 transition-all">
                    <cat.icon className="w-5 h-5 text-gray-500 group-hover:text-[#0C6B38] transition-colors" strokeWidth={1.5} />
                  </div>
                  <p className="font-semibold text-sm text-[#0D0D0D] mb-1">{cat.label}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{cat.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: "#F8FAF8" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#0C6B38" }}>Simple process</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0D0D0D] mb-3">How HelpChain works</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
              From posting to payment — everything is simple, secure, and built for trust.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                ...steps[0],
                svg: (
                  <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <rect width="280" height="180" fill="#E8F5EF"/>
                    <rect x="60" y="40" width="160" height="110" rx="12" fill="white" stroke="#0C6B38" strokeWidth="2"/>
                    <rect x="75" y="58" width="90" height="8" rx="4" fill="#0C6B38" opacity="0.3"/>
                    <rect x="75" y="74" width="130" height="6" rx="3" fill="#E5E7EB"/>
                    <rect x="75" y="86" width="110" height="6" rx="3" fill="#E5E7EB"/>
                    <rect x="75" y="98" width="120" height="6" rx="3" fill="#E5E7EB"/>
                    <rect x="75" y="118" width="70" height="20" rx="6" fill="#0C6B38"/>
                    <rect x="151" y="122" width="50" height="12" rx="4" fill="white" opacity="0.3"/>
                    <circle cx="215" cy="55" r="22" fill="#0C6B38" opacity="0.12"/>
                    <circle cx="215" cy="55" r="14" fill="#0C6B38" opacity="0.2"/>
                    <path d="M209 55l4 4 7-7" stroke="#0C6B38" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="65" cy="40" r="18" fill="#F0FDF4"/>
                    <rect x="58" y="33" width="14" height="14" rx="3" fill="#0C6B38" opacity="0.2"/>
                    <path d="M62 40h6M65 37v6" stroke="#0C6B38" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )
              },
              {
                ...steps[1],
                svg: (
                  <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <rect width="280" height="180" fill="#E8F5EF"/>
                    {[0,1,2].map(i => (
                      <g key={i} transform={`translate(${30 + i * 82}, 30)`}>
                        <rect width="74" height="120" rx="10" fill="white" stroke={i === 1 ? "#0C6B38" : "#E5E7EB"} strokeWidth={i === 1 ? 2 : 1}/>
                        <circle cx="37" cy="30" r="16" fill={i === 1 ? "#0C6B38" : "#F3F4F6"}/>
                        <circle cx="37" cy="24" r="7" fill={i === 1 ? "white" : "#D1D5DB"} opacity="0.7"/>
                        <ellipse cx="37" cy="38" rx="12" ry="7" fill={i === 1 ? "white" : "#D1D5DB"} opacity="0.5"/>
                        <rect x="10" y="55" width="54" height="5" rx="2.5" fill={i === 1 ? "#0C6B38" : "#E5E7EB"} opacity={i === 1 ? 0.5 : 1}/>
                        <rect x="17" y="66" width="40" height="4" rx="2" fill="#E5E7EB"/>
                        <rect x="17" y="76" width="40" height="4" rx="2" fill="#E5E7EB"/>
                        {i === 1 && <rect x="10" y="92" width="54" height="18" rx="5" fill="#0C6B38"/>}
                        {i === 1 && <path d="M30 101l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
                        {i !== 1 && <rect x="10" y="92" width="54" height="18" rx="5" fill="#F3F4F6"/>}
                      </g>
                    ))}
                  </svg>
                )
              },
              {
                ...steps[2],
                svg: (
                  <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <rect width="280" height="180" fill="#E8F5EF"/>
                    <rect x="70" y="30" width="140" height="110" rx="16" fill="white" stroke="#0C6B38" strokeWidth="1.5"/>
                    <rect x="70" y="30" width="140" height="38" rx="16" fill="#0C6B38"/>
                    <rect x="70" y="50" width="140" height="18" fill="#0C6B38"/>
                    <rect x="84" y="40" width="60" height="8" rx="4" fill="white" opacity="0.4"/>
                    <rect x="84" y="40" width="30" height="8" rx="4" fill="white" opacity="0.6"/>
                    <circle cx="140" cy="95" r="28" fill="#E8F5EF"/>
                    <path d="M140 80v10M140 80c0 0-8 5-8 15s8 15 8 15 8-5 8-15-8-15-8-15z" stroke="#0C6B38" strokeWidth="0" fill="#0C6B38" opacity="0" />
                    <path d="M126 82l14 0a14 14 0 0 1 0 28h-14a14 14 0 0 1 0-28z" fill="#0C6B38" opacity="0.12"/>
                    <path d="M131 96c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9" stroke="#0C6B38" strokeWidth="2" strokeLinecap="round" fill="none"/>
                    <path d="M127 96h13" stroke="#0C6B38" strokeWidth="2" strokeLinecap="round"/>
                    <rect x="127" y="82" width="26" height="28" rx="4" fill="#0C6B38" opacity="0.08"/>
                    <path d="M140 78v6M137 80l3-3 3 3" stroke="#0C6B38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="140" cy="95" r="14" fill="none" stroke="#0C6B38" strokeWidth="2"/>
                    <path d="M134 95l4 4 8-8" stroke="#0C6B38" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="84" y="128" width="112" height="5" rx="2.5" fill="#E5E7EB"/>
                    <rect x="100" y="138" width="80" height="5" rx="2.5" fill="#E5E7EB"/>
                  </svg>
                )
              },
            ].map((step, i) => (
              <motion.div key={step.n} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}>
                <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #F0F0F0" }}>
                  <div className="h-44 bg-[#E8F5EF] flex items-center justify-center p-4">
                    {step.svg}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-bold shrink-0" style={{ background: "#0C6B38" }}>
                        {step.n}
                      </div>
                      <h3 className="font-bold text-[#0D0D0D]">{step.title}</h3>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/how-it-works">
              <Button variant="outline" className="rounded-xl h-11 px-8 font-medium" style={{ borderColor: "rgba(12,107,56,0.3)", color: "#0C6B38" }}>
                Learn more <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ BROWSE TASKS ═══════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#0C6B38" }}>Live marketplace</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0D0D0D]">Browse popular tasks</h2>
          </div>
          <Link href="/discover">
            <span className="hidden sm:flex items-center gap-1 text-sm font-medium cursor-pointer hover:underline" style={{ color: "#0C6B38" }}>
              See all <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sampleTasks.map((task, i) => (
            <motion.div key={task.title} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}>
              <Link href="/discover">
                <div
                  className="group cursor-pointer bg-white rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
                  style={{ border: "1px solid #F0F0F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                  onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(12,107,56,0.22)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 20px rgba(12,107,56,0.09)"; }}
                  onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#F0F0F0"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
                >
                  {/* cover image */}
                  <div className="relative h-40 overflow-hidden bg-gray-100">
                    <img
                      src={task.img}
                      alt={task.cat}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/92 backdrop-blur-sm"
                        style={{ border: "1px solid rgba(12,107,56,0.2)", color: "#0C6B38" }}
                      >
                        {task.cat}
                      </span>
                    </div>
                  </div>
                  {/* card body */}
                  <div className="p-5">
                    <h3 className="font-semibold text-sm text-[#0D0D0D] leading-snug mb-4 group-hover:text-[#0C6B38] transition-colors">{task.title}</h3>
                    <div className="flex items-center justify-between pt-3.5" style={{ borderTop: "1px solid #F5F5F5" }}>
                      <div>
                        <p className="text-base font-bold" style={{ color: "#0C6B38" }}>{task.budget}</p>
                        <p className="text-xs text-gray-400">{task.bids} offers</p>
                      </div>
                      <button
                        className="text-xs font-semibold px-4 py-2 rounded-lg transition-all"
                        style={{ background: "rgba(12,107,56,0.08)", color: "#0C6B38", border: "1px solid rgba(12,107,56,0.14)" }}
                      >
                        Send Offer
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════ TRUST ═══════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: "#F8FAF8" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#0C6B38" }}>Built for trust</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0D0D0D] mb-3">Why people trust HelpChain</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
              Every feature is designed to protect both clients and workers.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {trust.map((t, i) => (
              <motion.div key={t.title} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}>
                <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #F0F0F0" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "rgba(12,107,56,0.08)", border: "1px solid rgba(12,107,56,0.14)" }}>
                    <t.icon className="w-5 h-5" style={{ color: "#0C6B38" }} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-bold text-sm text-[#0D0D0D] mb-2">{t.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ DUAL CTA CARDS ═══════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-5">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <div className="rounded-3xl p-10 h-full" style={{ background: "#0C6B38" }}>
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
                <Briefcase className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">I need something done</h3>
              <p className="text-white/65 text-sm leading-relaxed mb-8">
                Post your task in minutes, get offers from verified workers, and only pay when the job is done to your satisfaction.
              </p>
              <Link href="/create-request">
                <Button className="bg-white text-[#0C6B38] hover:bg-white/90 font-bold rounded-xl h-11 px-7">
                  Post a Task <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1}>
            <div className="rounded-3xl p-10 h-full" style={{ background: "#0D0D0D" }}>
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">I want to earn money</h3>
              <p className="text-white/55 text-sm leading-relaxed mb-8">
                Browse hundreds of tasks, send your best offer, complete the work, and get paid fast. Build your reputation as you grow.
              </p>
              <Link href="/discover">
                <Button className="font-bold rounded-xl h-11 px-7" style={{ background: "#0C6B38" }}>
                  Find Work <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: "#F8FAF8" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#0C6B38" }}>Community stories</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0D0D0D]">What our users say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}>
                <div className="bg-white rounded-2xl p-6 h-full flex flex-col" style={{ border: "1px solid #F0F0F0" }}>
                  <div className="flex mb-4">
                    {[1,2,3,4,5].map(j => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1 mb-5">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={t.img}
                      alt={t.name}
                      className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#0D0D0D]">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <div className="rounded-3xl px-8 py-16 text-center relative overflow-hidden" style={{ background: "#0C6B38" }}>
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to get started?</h2>
              <p className="text-white/65 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                Join over 50,000 people already using HelpChain to post tasks, earn money, and get things done.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/auth?mode=signup">
                  <Button className="bg-white text-[#0C6B38] hover:bg-white/90 font-bold rounded-xl h-12 px-10 text-sm">
                    Create Free Account
                  </Button>
                </Link>
                <Link href="/discover">
                  <Button variant="outline" className="border-white/25 text-white hover:bg-white/10 rounded-xl h-12 px-10 text-sm font-medium">
                    Browse Tasks
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer style={{ background: "#0D0D0D" }} className="px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-14">

            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-5">
                <img src="/images/helpchain-logo.png" alt="HelpChain" className="w-9 h-9 object-contain rounded-xl" />
                <span className="text-base font-bold text-white">HelpChain</span>
              </div>
              <p className="text-sm text-white/45 leading-relaxed max-w-xs mb-6">
                The global task marketplace. Post tasks, find workers, pay securely with escrow protection — everywhere in the world.
              </p>
              <div className="flex gap-3">
                {[Twitter, Linkedin, Instagram, Facebook].map((Icon, i) => (
                  <a key={i} href="#" style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                    className="w-9 h-9 rounded-lg hover:bg-[#0C6B38] flex items-center justify-center text-white/45 hover:text-white transition-all">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-white uppercase tracking-widest mb-5">Platform</p>
              <ul className="space-y-3">
                {[{ l: "Find Tasks", h: "/discover" }, { l: "Post a Task", h: "/create-request" }, { l: "How It Works", h: "/how-it-works" }, { l: "Pricing", h: "/pricing" }].map(i => (
                  <li key={i.l}><Link href={i.h}><span className="text-sm text-white/45 hover:text-white transition-colors cursor-pointer">{i.l}</span></Link></li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold text-white uppercase tracking-widest mb-5">Company</p>
              <ul className="space-y-3">
                {[{ l: "About Us", h: "/about" }, { l: "Blog", h: "/blog" }, { l: "Careers", h: "/careers" }, { l: "Press", h: "/press" }].map(i => (
                  <li key={i.l}><Link href={i.h}><span className="text-sm text-white/45 hover:text-white transition-colors cursor-pointer">{i.l}</span></Link></li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold text-white uppercase tracking-widest mb-5">Support</p>
              <ul className="space-y-3">
                {[{ l: "Help Center", h: "/help" }, { l: "Trust & Safety", h: "/safety" }, { l: "Contact Us", h: "/contact" }, { l: "Privacy Policy", h: "/privacy" }, { l: "Terms", h: "/terms" }].map(i => (
                  <li key={i.l}><Link href={i.h}><span className="text-sm text-white/45 hover:text-white transition-colors cursor-pointer">{i.l}</span></Link></li>
                ))}
              </ul>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs text-white/25">© {new Date().getFullYear()} HelpChain. All rights reserved.</p>
            <div className="flex items-center gap-1.5 text-xs text-white/25">
              <Shield className="w-3.5 h-3.5 text-[#0C6B38]" />
              <span>Escrow-protected payments on every transaction</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
