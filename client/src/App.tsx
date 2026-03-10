import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MobileMenuProvider, useMobileMenu } from "@/contexts/mobile-menu-context";
import { FirebaseAuthProvider } from "@/contexts/FirebaseAuthContext";
import { Chatbot } from "@/components/chatbot/chatbot";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import CreateRequest from "@/pages/create-request";
import CreateOfferPage from "@/pages/create-offer";
import AdminDashboard from "@/pages/admin-dashboard";
import DiscoverPage from "@/pages/discover";
import ProfilePage from "@/pages/profile";
import PublicProfilePage from "@/pages/public-profile";
import RequestDetails from "@/pages/request-details";
import BatchManagementPage from "@/pages/batch-management";
import MessagesPage from "@/pages/messages";
import WalletPage from "@/pages/wallet";
import SettingsPage from "@/pages/settings";
import OnboardingPage from "@/pages/onboarding";
import HowItWorks from "@/pages/how-it-works";
import SafetyPage from "@/pages/safety";
import StoriesPage from "@/pages/stories";
import VolunteersPage from "@/pages/volunteers";
import BlogPage from "@/pages/blog";
import EventsPage from "@/pages/events";
import HelpPage from "@/pages/help";
import ContactPage from "@/pages/contact";
import TermsPage from "@/pages/terms";
import PrivacyPage from "@/pages/privacy";
import SitemapPage from "@/pages/sitemap";
import AboutPage from "@/pages/about";
import PricingPage from "@/pages/pricing";
import CareersPage from "@/pages/careers";
import PressPage from "@/pages/press";
import CookiesPage from "@/pages/cookies";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/discover" component={DiscoverPage} />
      <Route path="/search" component={DiscoverPage} />
      <Route path="/create-request" component={CreateRequest} />
      <Route path="/create-offer" component={CreateOfferPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/messages" component={MessagesPage} />
      <Route path="/wallet" component={WalletPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/public-profile/:userId" component={PublicProfilePage} />
      <Route path="/request/:id" component={RequestDetails} />
      <Route path="/batch/:id" component={BatchManagementPage} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/safety" component={SafetyPage} />
      <Route path="/stories" component={StoriesPage} />
      <Route path="/volunteers" component={VolunteersPage} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/events" component={EventsPage} />
      <Route path="/help" component={HelpPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/sitemap" component={SitemapPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/careers" component={CareersPage} />
      <Route path="/press" component={PressPage} />
      <Route path="/cookies" component={CookiesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function MobileMenuOverlay() {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu();
  if (!isMobileMenuOpen) return null;
  return (
    <div
      className="fixed inset-0 z-40 md:hidden"
      style={{
        position: "fixed", top: 0, left: "50%", right: 0, bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.12)", cursor: "pointer",
      }}
      onClick={() => setIsMobileMenuOpen(false)}
    />
  );
}

function App() {
  return (
    <FirebaseAuthProvider>
      <MobileMenuProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <MobileMenuOverlay />
            <Router />
            <Chatbot />
          </TooltipProvider>
        </QueryClientProvider>
      </MobileMenuProvider>
    </FirebaseAuthProvider>
  );
}

export default App;
