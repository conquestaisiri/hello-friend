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
  Home as HomeIcon, Wrench, GraduationCap, FileText, HelpCircle, MapPin
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

const typingPhrases = [
  "web development",
  "graphic design",
  "home cleaning",
  "data entry",
  "content writing",
  "translation",
  "tutoring",
  "marketing",
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
    { label: "Digital Work", icon: Code, desc: "Development, data entry, virtual assistance" },
    { label: "Design", icon: Palette, desc: "Graphics, UI/UX, branding, video editing" },
    { label: "Writing", icon: FileText, desc: "Content, copywriting, editing, blogs" },
    { label: "Marketing", icon: Megaphone, desc: "Social media, SEO, ads, campaigns" },
    { label: "Education", icon: GraduationCap, desc: "Tutoring, mentoring, course creation" },
    { label: "Translation", icon: Languages, desc: "Documents, websites, localization" },
    { label: "Home Services", icon: HomeIcon, desc: "Cleaning, repairs, moving, assembly" },
    { label: "Consulting", icon: Briefcase, desc: "Business, legal, finance, strategy" },
  ];

  const stats = [
    { value: "50K+", label: "Tasks Completed" },
    { value: "120+", label: "Countries" },
    { value: "4.9", label: "Average Rating" },
    { value: "$2M+", label: "Paid to Workers" },
  ];

  const testimonials = [
    {
      name: "Maria Rodriguez",
      role: "Freelance Designer, Mexico",
      avatar: "https://i.pravatar.cc/150?img=32",
      content: "HelpChain connected me with clients globally. The escrow system means I always get paid for my work. It's changed how I freelance.",
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
      content: "As a part-time freelancer, HelpChain's global task marketplace lets me pick up projects that match my skills perfectly. Love the platform!",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden -mt-16">
        <div className="absolute inset-0">
          <img src="/images/hero-workers.jpg" alt="Diverse professionals collaborating" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/75 to-accent/65" />
        </div>

        <div className="container mx-auto px-4 md:px-8 relative z-10 pt-32 md:pt-40 pb-16">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <Badge className="mb-6 px-4 py-1.5 bg-white/20 text-white border-white/30 rounded-full text-sm">
                <Globe className="w-4 h-4 mr-2" />
                Trusted by users in 120+ countries
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Hire help or earn money
                <br />
                doing{" "}
                <span className="text-white/90 underline decoration-white/30 decoration-wavy underline-offset-8">
                  {typingText}
                </span>
                <span className="animate-pulse font-light">|</span>
              </h1>

              <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto font-light">
                The global task marketplace where anyone can post tasks or complete them.
                Secure escrow payments, fast matching, and trusted reputation systems.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8 max-w-xl mx-auto">
                <div className="relative flex-1">
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="What do you need done?"
                    className="pl-5 pr-14 h-14 text-base rounded-xl bg-white border-0 shadow-lg focus:ring-2 focus:ring-white/30"
                  />
                  <Button
                    size="icon"
                    onClick={handleSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                {["Design", "Programming", "Writing", "Marketing", "Translation"].map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="rounded-full px-4 py-2 bg-white/15 text-white border border-white/20 hover:bg-white/25 cursor-pointer transition-colors font-normal"
                    onClick={() => {
                      setSearchInput(tag);
                      setLocation(`/discover?query=${encodeURIComponent(tag)}`);
                    }}
                  >
                    {tag} <ArrowRight className="w-3 h-3 ml-1.5 inline" />
                  </Badge>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <p className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div className="text-center max-w-2xl mx-auto mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Explore task categories</h2>
            <p className="text-lg text-muted-foreground">
              From digital work to local services — find or post any type of task.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Link href="/discover">
                  <Card className="group cursor-pointer hover:shadow-xl hover:border-primary/30 transition-all duration-300 h-full">
                    <CardContent className="p-6">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                        <cat.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{cat.label}</h3>
                      <p className="text-sm text-muted-foreground">{cat.desc}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/discover">
              <Button variant="outline" size="lg" className="rounded-full px-8 group">
                View All Categories
                <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Workers Showcase */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <motion.div className="text-center max-w-2xl mx-auto mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Badge className="mb-4 px-4 py-1.5 bg-chart-2/10 text-chart-2 border-chart-2/20 rounded-full">
              <Users className="w-4 h-4 mr-2" />
              Workers Worldwide
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Real people, real skills</h2>
            <p className="text-lg text-muted-foreground">
              From freelance designers to delivery pros — our workers come from every corner of the globe.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { src: "/images/worker-freelancer.jpg", name: "Sofia", role: "Freelance Developer", location: "Mexico City" },
              { src: "/images/worker-handyman.jpg", name: "Raj", role: "Home Services Pro", location: "Mumbai" },
              { src: "/images/worker-delivery.jpg", name: "Kelechi", role: "Courier & Logistics", location: "Lagos" },
              { src: "/images/worker-designer.jpg", name: "Yuki", role: "Graphic Designer", location: "Tokyo" },
            ].map((worker, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="group overflow-hidden border-border hover:shadow-xl transition-all duration-300">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={worker.src}
                      alt={`${worker.name} - ${worker.role}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-foreground">{worker.name}</h4>
                    <p className="text-sm text-primary font-medium">{worker.role}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {worker.location}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-3.5 h-3.5 fill-chart-4 text-chart-4" />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">5.0</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/discover">
              <Button size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
                Browse All Tasks <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <Badge className="mb-4 px-4 py-1.5 bg-primary/10 text-primary border-primary/20 rounded-full">
                How It Works
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Get things done in 3 simple steps</h2>

              <div className="space-y-8">
                {[
                  { step: "1", title: "Post your task", desc: "Describe what you need, set your budget and deadline. It takes just 2 minutes." },
                  { step: "2", title: "Get offers from workers", desc: "Receive proposals from verified workers worldwide. Compare skills, ratings, and prices." },
                  { step: "3", title: "Pay securely via escrow", desc: "Funds are held safely until the task is completed to your satisfaction. Release with one click." },
                ].map((item, i) => (
                  <motion.div key={i} className="flex gap-5" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0 shadow-lg">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1 text-foreground">{item.title}</h3>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-10 flex gap-3">
                <Link href="/create-request">
                  <Button size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl">
                    Post a Task <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/discover">
                  <Button size="lg" variant="outline" className="rounded-full px-8">
                    Find Tasks
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div className="grid grid-cols-2 gap-4" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <img src="/images/worker-tutor.jpg" alt="Tutor helping a student" className="w-full h-48 object-cover" loading="lazy" />
                </div>
                <Card className="p-6 border-border hover:shadow-lg transition-shadow">
                  <Shield className="w-10 h-10 text-primary mb-4" />
                  <h4 className="font-semibold mb-2 text-foreground">Escrow Protection</h4>
                  <p className="text-sm text-muted-foreground">Payments held securely until task completion</p>
                </Card>
              </div>
              <div className="space-y-4 pt-8">
                <Card className="p-6 border-border hover:shadow-lg transition-shadow">
                  <CheckCircle2 className="w-10 h-10 text-chart-2 mb-4" />
                  <h4 className="font-semibold mb-2 text-foreground">Verified Workers</h4>
                  <p className="text-sm text-muted-foreground">Identity verification and reputation scores</p>
                </Card>
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <img src="/images/worker-delivery.jpg" alt="Delivery worker with package" className="w-full h-48 object-cover" loading="lazy" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div className="text-center max-w-2xl mx-auto mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Badge className="mb-4 px-4 py-1.5 bg-chart-4/10 text-chart-4 border-chart-4/20 rounded-full">
              <Star className="w-4 h-4 mr-2 fill-current" />
              Testimonials
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Loved by thousands worldwide</h2>
            <p className="text-lg text-muted-foreground">See what our global community says about HelpChain</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full border-border hover:shadow-xl transition-shadow">
                  <CardContent className="p-8">
                    <div className="flex gap-1 mb-4">
                      {[...Array(t.rating)].map((_, j) => (
                        <Star key={j} className="w-5 h-5 fill-chart-4 text-chart-4" />
                      ))}
                    </div>
                    <p className="text-foreground mb-6 leading-relaxed">"{t.content}"</p>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={t.avatar} />
                        <AvatarFallback>{t.name[0]}</AvatarFallback>
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

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-primary" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to get started?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Join thousands of people hiring help and earning money on HelpChain — from anywhere in the world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create-request">
                <Button size="lg" className="rounded-full px-8 bg-white text-primary hover:bg-white/90 shadow-lg">
                  Post a Task <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/discover">
                <Button size="lg" variant="outline" className="rounded-full px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  Browse Tasks
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Educational Footer Section */}
      <section className="py-16 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-foreground mb-2">Learn more about HelpChain</h3>
            <p className="text-muted-foreground">Guides to help you get the most out of the platform</p>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { title: "How Payments Work", icon: Briefcase, desc: "Understanding deposits, withdrawals, and fees" },
              { title: "What Is Escrow", icon: Shield, desc: "How your money stays protected" },
              { title: "Withdrawing Earnings", icon: ArrowRight, desc: "Bank and crypto withdrawal options" },
              { title: "Trust & Safety", icon: CheckCircle2, desc: "Verification, ratings, and dispute resolution" },
              { title: "Blockchain Security", icon: Globe, desc: "How blockchain protects your transactions" },
            ].map((guide, i) => (
              <Link key={i} href="/help">
                <Card className="group cursor-pointer hover:shadow-md hover:border-primary/30 transition-all h-full">
                  <CardContent className="p-5">
                    <guide.icon className="w-8 h-8 text-primary mb-3" />
                    <h4 className="font-semibold text-sm text-foreground mb-1">{guide.title}</h4>
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
