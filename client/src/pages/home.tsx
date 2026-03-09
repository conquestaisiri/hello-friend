import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search, ArrowRight, Shield, Clock, Star, CheckCircle2,
  Sparkles, Users, ChevronRight, Globe, Briefcase, Code,
  Palette, BookOpen, Megaphone, Languages, MessageCircle,
  Home as HomeIcon, Wrench, GraduationCap, FileText, HelpCircle, MapPin,
  Zap, Lock, Eye, TrendingUp, Play, Package, Truck
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

const typingPhrases = [
  "home cleaning",
  "graphic design",
  "delivery help",
  "web development",
  "furniture moving",
  "content writing",
  "tutoring",
  "repairs & fixing",
];

export default function Home() {
  const [searchInput, setSearchInput] = useState("");
  const [, setLocation] = useLocation();
  const [typingText, setTypingText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = typingPhrases[phraseIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (typingText.length < currentPhrase.length) {
          setTypingText(currentPhrase.slice(0, typingText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (typingText.length > 0) {
          setTypingText(typingText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % typingPhrases.length);
        }
      }
    }, isDeleting ? 50 : 100);
    return () => clearTimeout(timeout);
  }, [typingText, isDeleting, phraseIndex]);

  const handleSearch = () => {
    if (searchInput.trim()) {
      setLocation(`/discover?query=${encodeURIComponent(searchInput)}`);
    } else {
      setLocation("/discover");
    }
  };

  const categories = [
    { label: "Home Services", icon: "/images/icons/home-services.png", desc: "Cleaning, repairs, moving, assembly" },
    { label: "Tech Help", icon: "/images/icons/tech-help.png", desc: "Development, IT support, troubleshooting" },
    { label: "Design", icon: "/images/icons/design.png", desc: "Graphics, UI/UX, branding, video" },
    { label: "Writing", icon: "/images/icons/writing.png", desc: "Content, copywriting, editing" },
    { label: "Delivery", icon: "/images/icons/delivery.png", desc: "Packages, errands, logistics" },
    { label: "Education", icon: "/images/icons/education.png", desc: "Tutoring, homework, mentoring" },
    { label: "Marketing", icon: "/images/icons/marketing.png", desc: "Social media, SEO, campaigns" },
    { label: "Translation", icon: "/images/icons/translation.png", desc: "Documents, websites, localization" },
  ];

  const stats = [
    { value: "50K+", label: "Tasks Completed", icon: CheckCircle2 },
    { value: "120+", label: "Countries", icon: Globe },
    { value: "4.9", label: "Average Rating", icon: Star },
    { value: "$2M+", label: "Paid to Workers", icon: TrendingUp },
  ];

  const features = [
    { icon: Zap, title: "Post Tasks in Minutes", desc: "Describe what you need, set your budget, and get matched with skilled workers instantly.", color: "bg-primary/10 text-primary" },
    { icon: Lock, title: "Secure Escrow Payments", desc: "Your money is held safely until the task is completed to your satisfaction. Zero risk.", color: "bg-secondary/10 text-secondary" },
    { icon: Globe, title: "Local & Remote Services", desc: "From furniture moving in Lagos to graphic design from anywhere — we cover it all.", color: "bg-accent/10 text-accent" },
    { icon: Shield, title: "Trusted & Verified", desc: "Every worker goes through verification. Ratings, reviews, and reputation scores you can trust.", color: "bg-chart-4/10 text-chart-4" },
  ];

  const workers = [
    { src: "/images/worker-freelancer.jpg", name: "Priya", role: "Software Developer", location: "Mumbai, India", rating: "4.9", tasks: "127" },
    { src: "/images/worker-handyman.jpg", name: "Carlos", role: "Home Repairs Pro", location: "Mexico City", rating: "5.0", tasks: "89" },
    { src: "/images/worker-delivery.jpg", name: "Kelechi", role: "Courier & Logistics", location: "Lagos, Nigeria", rating: "4.8", tasks: "234" },
    { src: "/images/worker-designer.jpg", name: "Amara", role: "Graphic Designer", location: "Accra, Ghana", rating: "5.0", tasks: "156" },
  ];

  const testimonials = [
    {
      name: "Maria Rodriguez",
      role: "Freelance Designer, Mexico",
      avatar: "https://i.pravatar.cc/150?img=32",
      content: "HelpChain connected me with clients globally. The escrow system means I always get paid for my work. It's completely changed my freelance career.",
      rating: 5,
    },
    {
      name: "James Okonkwo",
      role: "Business Owner, Nigeria",
      avatar: "https://i.pravatar.cc/150?img=52",
      content: "I found reliable help for my office move within an hour. Fast, professional, and the payment protection gives me total peace of mind.",
      rating: 5,
    },
    {
      name: "Priya Sharma",
      role: "Software Engineer, India",
      avatar: "https://i.pravatar.cc/150?img=26",
      content: "As a part-time freelancer, HelpChain lets me pick up projects that match my skills perfectly. The global marketplace is a game changer!",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Navbar />

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-[95vh] flex items-center overflow-hidden -mt-16">
        {/* Background image */}
        <div className="absolute inset-0">
          <img src="/images/hero-background.png" alt="Diverse professionals collaborating" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-black/80" />
          {/* Decorative orbs */}
          <div className="absolute top-1/4 left-10 w-72 h-72 bg-accent/20 rounded-full blur-[100px] animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] animate-pulse-slow" />
        </div>

        <div className="container mx-auto px-4 md:px-8 relative z-10 pt-32 md:pt-40 pb-20">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
              <Badge className="mb-8 px-5 py-2 bg-white/10 text-white border-white/20 rounded-full text-sm backdrop-blur-sm">
                <Sparkles className="w-4 h-4 mr-2 text-accent" />
                Secure & Verified Helper Community
              </Badge>

              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6 md:mb-8 font-heading">
                Get Help With Anything.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-green-300 to-accent">
                  Anytime. Anywhere.
                </span>
              </h1>

              <p className="text-base md:text-xl text-white/70 mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed">
                Post tasks, hire trusted helpers, and get things done — from{" "}
                <span className="text-white font-medium">
                  {typingText}
                  <span className="animate-pulse">|</span>
                </span>
              </p>

              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10 max-w-2xl mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="What do you need done?"
                    className="pl-14 pr-5 h-16 text-lg rounded-2xl bg-white border-0 shadow-2xl focus:ring-4 focus:ring-accent/30"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  size="lg"
                  className="h-16 px-10 rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground shadow-2xl shadow-accent/30 text-lg font-semibold"
                >
                  Search <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              {/* Quick Tags */}
              <div className="flex flex-wrap gap-2 justify-center mb-10">
                {["Cleaning", "Design", "Delivery", "Repairs", "Writing", "Tutoring"].map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="rounded-full px-5 py-2.5 bg-white/10 text-white border border-white/15 hover:bg-white/20 cursor-pointer transition-all backdrop-blur-sm font-normal text-sm"
                    onClick={() => {
                      setSearchInput(tag);
                      setLocation(`/discover?query=${encodeURIComponent(tag)}`);
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Hero CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/create-request">
                  <Button size="lg" className="rounded-full px-10 py-7 text-lg bg-white text-primary hover:bg-white/95 shadow-2xl font-semibold btn-shine">
                    Post a Task <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/discover">
                  <Button size="lg" variant="outline" className="rounded-full px-10 py-7 text-lg border-2 border-white/30 text-white hover:bg-white/10 font-semibold">
                    Browse Tasks
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full">
            <path d="M0 80L60 68C120 56 240 32 360 24C480 16 600 24 720 32C840 40 960 48 1080 44C1200 40 1320 24 1380 16L1440 8V80H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* ═══════════ STATS ═══════════ */}
      <section className="py-16 bg-background relative z-10 -mt-4">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                className="text-center p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg transition-shadow"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div className="text-center max-w-2xl mx-auto mb-20" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Badge className="mb-5 px-4 py-1.5 bg-primary/10 text-primary border-primary/20 rounded-full">
              Why HelpChain
            </Badge>
             <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 text-foreground font-heading">
              Everything you need to
              <br />
              <span className="text-gradient">get things done</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              A powerful platform built for both clients and workers, with security and trust at its core.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group rounded-2xl">
                  <CardContent className="p-8">
                    <div className={`h-14 w-14 rounded-2xl ${feat.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <feat.icon className="h-7 w-7" />
                    </div>
                    <h3 className="font-bold text-lg text-foreground mb-3">{feat.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feat.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CATEGORIES ═══════════ */}
      <section className="py-24 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4">
          <motion.div className="text-center max-w-2xl mx-auto mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
             <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 text-foreground font-heading">
              Explore task categories
            </h2>
            <p className="text-lg text-muted-foreground">
              From local errands to remote digital work — find or post any type of task.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Link href="/discover">
                  <Card className="group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full rounded-2xl border-border overflow-hidden">
                    <CardContent className="p-5 md:p-6 text-center">
                      <img
                        src={cat.icon}
                        alt={cat.label}
                        className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 object-contain group-hover:scale-110 transition-transform"
                        loading="lazy"
                      />
                      <h3 className="font-bold text-foreground mb-1 text-sm md:text-base">{cat.label}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">{cat.desc}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/discover">
              <Button variant="outline" size="lg" className="rounded-full px-10 group text-base">
                View All Categories
                <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ WORKERS SHOWCASE ═══════════ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div className="text-center max-w-2xl mx-auto mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Badge className="mb-5 px-4 py-1.5 bg-secondary/10 text-secondary border-secondary/20 rounded-full">
              <Users className="w-4 h-4 mr-2" />
              Workers Worldwide
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 text-foreground font-heading">Real people, real skills</h2>
            <p className="text-lg text-muted-foreground">
              From freelance designers to delivery pros — skilled workers from every corner of the globe.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {workers.map((worker, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="group overflow-hidden border-border hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-2xl">
                  <div className="aspect-[4/5] overflow-hidden relative">
                    <img
                      src={worker.src}
                      alt={`${worker.name} - ${worker.role}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h4 className="font-bold text-white text-lg">{worker.name}</h4>
                      <p className="text-white/80 text-sm font-medium">{worker.role}</p>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {worker.location}
                      </p>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-chart-4 text-chart-4" />
                        <span className="text-xs font-semibold text-foreground">{worker.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{worker.tasks} tasks completed</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/discover">
              <Button size="lg" className="rounded-full px-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 text-base">
                Browse All Tasks <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="py-24 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4">
          <motion.div className="text-center max-w-2xl mx-auto mb-20" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Badge className="mb-5 px-4 py-1.5 bg-accent/10 text-accent border-accent/20 rounded-full">
              How It Works
            </Badge>
             <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 text-foreground font-heading">
              Three simple steps
            </h2>
            <p className="text-lg text-muted-foreground">
              Getting help has never been easier. Post, match, and pay securely.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {[
              { step: "01", title: "Post your task", desc: "Describe what you need, set your budget and deadline. It takes just 2 minutes.", icon: "/images/icons/post-task.png" },
              { step: "02", title: "Get matched", desc: "Receive proposals from verified workers worldwide. Compare skills, ratings, and prices.", icon: "/images/icons/get-matched.png" },
              { step: "03", title: "Pay securely", desc: "Funds are held in escrow until the task is completed to your satisfaction.", icon: "/images/icons/pay-secure.png" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                <div className="text-center relative">
                  {i < 2 && (
                    <div className="hidden md:block absolute top-16 left-[60%] w-[80%] border-t-2 border-dashed border-border" />
                  )}
                  <div className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-6 relative z-10">
                    <img src={item.icon} alt={item.title} className="w-full h-full object-contain" loading="lazy" />
                  </div>
                  <span className="text-sm font-bold text-primary mb-2 block">Step {item.step}</span>
                  <h3 className="font-bold text-lg md:text-xl mb-3 text-foreground">{item.title}</h3>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-16">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create-request">
                <Button size="lg" className="rounded-full px-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 text-base font-semibold">
                  Post a Task <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/discover">
                <Button size="lg" variant="outline" className="rounded-full px-10 text-base">
                  Find Tasks
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ APP PREVIEW / SHOWCASE ═══════════ */}
      <section className="py-24 bg-background overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <Badge className="mb-5 px-4 py-1.5 bg-secondary/10 text-secondary border-secondary/20 rounded-full">
                Platform Preview
              </Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground font-heading leading-tight">
                A beautiful interface
                <br />
                <span className="text-gradient">built for everyone</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Whether you're posting tasks or completing them, every interaction is designed to be fast, intuitive, and secure.
              </p>

              <div className="space-y-5">
                {[
                  { icon: Eye, title: "Task Feed", desc: "Browse beautifully organized tasks with smart filters" },
                  { icon: Lock, title: "Escrow Protection", desc: "Every payment is protected until work is verified" },
                  { icon: MessageCircle, title: "Real-time Chat", desc: "Coordinate seamlessly with text, files, and images" },
                  { icon: Star, title: "Reputation System", desc: "Build trust through ratings and verified reviews" },
                ].map((item, i) => (
                  <motion.div key={i} className="flex gap-4 items-start" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-0.5">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div className="grid grid-cols-2 gap-4" initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden shadow-2xl">
                  <img src="/images/worker-tutor.jpg" alt="Tutor helping a student" className="w-full h-52 object-cover" loading="lazy" />
                </div>
                <Card className="p-6 border-border shadow-lg rounded-2xl hover-lift">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-4 text-white">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold mb-2 text-foreground">Escrow Protection</h4>
                  <p className="text-sm text-muted-foreground">Payments held securely until task completion</p>
                </Card>
              </div>
              <div className="space-y-4 pt-8">
                <Card className="p-6 border-border shadow-lg rounded-2xl hover-lift">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center mb-4 text-white">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold mb-2 text-foreground">Verified Workers</h4>
                  <p className="text-sm text-muted-foreground">Identity verification and reputation scores</p>
                </Card>
                <div className="rounded-2xl overflow-hidden shadow-2xl">
                  <img src="/images/worker-delivery.jpg" alt="Delivery worker" className="w-full h-52 object-cover" loading="lazy" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="py-24 bg-muted/30 relative overflow-hidden border-y border-border">
        <div className="absolute top-0 left-0 w-72 h-72 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div className="text-center max-w-2xl mx-auto mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 text-foreground font-heading">
              What people are saying
            </h2>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              Real stories from clients and workers across the globe
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                <Card className="h-full border-0 shadow-xl bg-card hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden">
                  <CardContent className="p-8 flex flex-col h-full">
                    <div className="flex gap-1 mb-5">
                      {[...Array(t.rating)].map((_, j) => (
                        <Star key={j} className="w-5 h-5 fill-chart-4 text-chart-4" />
                      ))}
                    </div>
                    <p className="text-foreground mb-8 leading-relaxed flex-1">
                      "{t.content}"
                    </p>
                    <div className="flex items-center gap-4 pt-6 border-t border-border">
                      <Avatar className="w-12 h-12 ring-2 ring-primary/10">
                        <AvatarImage src={t.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">{t.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{t.name}</p>
                        <p className="text-sm text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(145,60%,14%)] via-[hsl(145,50%,10%)] to-[hsl(145,40%,6%)]" />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-accent/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/20 rounded-full blur-[80px]" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-8" />
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight font-heading">
              Start getting things done
              <br />
              <span className="text-white/70">today</span>
            </h2>
            <p className="text-lg text-white/60 mb-12 max-w-lg mx-auto leading-relaxed">
              Join a growing community of people hiring help and earning money — from anywhere in the world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create-request">
                <Button size="lg" className="rounded-full px-12 py-7 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/30 font-semibold">
                  Post a Task <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/discover">
                <Button size="lg" variant="outline" className="rounded-full px-12 py-7 text-lg border-2 border-white/25 text-white hover:bg-white/10 font-semibold">
                  Browse Tasks
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ EDUCATIONAL FOOTER ═══════════ */}
      <section className="py-20 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3 font-heading">Learn more about HelpChain</h3>
            <p className="text-muted-foreground">Guides to help you get the most out of the platform</p>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { title: "How Payments Work", icon: Briefcase, desc: "Understanding deposits, withdrawals, and fees" },
              { title: "What Is Escrow", icon: Shield, desc: "How your money stays protected" },
              { title: "Withdrawing Earnings", icon: ArrowRight, desc: "Bank and crypto withdrawal options" },
              { title: "Trust & Safety", icon: CheckCircle2, desc: "Verification, ratings, and dispute resolution" },
              { title: "Blockchain Security", icon: Lock, desc: "How blockchain protects your transactions" },
            ].map((guide, i) => (
              <Link key={i} href="/help">
                <Card className="group cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 h-full rounded-2xl">
                  <CardContent className="p-6">
                    <guide.icon className="w-8 h-8 text-primary mb-4" />
                    <h4 className="font-bold text-sm text-foreground mb-1">{guide.title}</h4>
                    <p className="text-xs text-muted-foreground">{guide.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}