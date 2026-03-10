import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useSearch } from "wouter";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, User, Loader2, HeartHandshake } from "lucide-react";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const initialMode = new URLSearchParams(search).get("mode") || "login";
  
  const { user, signIn, signUp, signInWithGoogle, resetPassword, loading } = useFirebaseAuth();
  const { sendWelcomeNotification } = useNotifications();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<"login" | "signup" | "reset">(
    initialMode === "signup" ? "signup" : initialMode === "reset" ? "reset" : "login"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (user) {
      const onboardingDone = localStorage.getItem("hc-onboarding-done");
      setLocation(onboardingDone ? "/profile" : "/onboarding");
    }
  }, [user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (mode === "login") {
        await signIn(email, password);
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        setLocation("/profile");
      } else if (mode === "signup") {
        if (password !== confirmPassword) {
          toast({
            title: "Passwords don't match",
            description: "Please make sure your passwords match.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          toast({
            title: "Weak password",
            description: "Password must be at least 6 characters.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        await signUp(email, password, displayName);
        // Send welcome notification
        setTimeout(() => sendWelcomeNotification(displayName), 2000);
        toast({
          title: "Account created! 🎉",
          description: "Welcome to HelpChain! Let's set up your profile.",
        });
        setLocation("/onboarding");
      } else if (mode === "reset") {
        await resetPassword(email);
        toast({
          title: "Reset email sent",
          description: "Please check your email for password reset instructions.",
        });
        setMode("login");
      }
    } catch (error: any) {
      let message = error.message || "An error occurred";
      if (message.includes("auth/invalid-credential")) {
        message = "Invalid email or password";
      } else if (message.includes("auth/email-already-in-use")) {
        message = "An account with this email already exists";
      } else if (message.includes("auth/weak-password")) {
        message = "Password is too weak. Use at least 6 characters";
      }
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Check if first-time user (no onboarding done)
      const onboardingDone = localStorage.getItem("hc-onboarding-done");
      setTimeout(() => sendWelcomeNotification(user?.displayName || undefined), 2000);
      toast({
        title: "Welcome!",
        description: "You have successfully signed in with Google.",
      });
      setLocation(onboardingDone ? "/profile" : "/onboarding");
    } catch (error: any) {
      if (error?.message?.includes("cancelled") || error?.code === "auth/popup-closed-by-user") return;
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md z-10"
        >
          <Card className="border-none shadow-2xl shadow-primary/5">
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="mx-auto w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                <HeartHandshake className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">
                  {mode === "login" && "Welcome back"}
                  {mode === "signup" && "Create an account"}
                  {mode === "reset" && "Reset password"}
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  {mode === "login" && "Sign in to your HelpChain account"}
                  {mode === "signup" && "Join HelpChain to get help or help others"}
                  {mode === "reset" && "Enter your email to receive reset instructions"}
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {mode !== "reset" && (
                <>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full h-12 gap-3 font-medium border-2 hover:bg-muted transition-all"
                      onClick={handleGoogleSignIn}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </Button>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or continue with email
                      </span>
                    </div>
                  </div>
                </>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {mode === "signup" && (
                    <motion.div
                      key="displayName"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="displayName">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="displayName"
                          type="text"
                          placeholder="John Doe"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>
                
                {mode !== "reset" && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
                
                <AnimatePresence mode="wait">
                  {mode === "signup" && (
                    <motion.div
                      key="confirmPassword"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10 h-12"
                          required
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {mode === "login" && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setMode("reset")}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
                
                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {mode === "login" && "Sign In"}
                      {mode === "signup" && "Create Account"}
                      {mode === "reset" && "Send Reset Email"}
                    </>
                  )}
                </Button>
              </form>
              
              <div className="text-center text-sm">
                {mode === "login" && (
                  <p>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("signup")}
                      className="text-primary font-medium hover:underline"
                    >
                      Sign up
                    </button>
                  </p>
                )}
                {mode === "signup" && (
                  <p>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-primary font-medium hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                )}
                {mode === "reset" && (
                  <p>
                    Remember your password?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-primary font-medium hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
