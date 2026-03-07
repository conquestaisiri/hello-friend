import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  User, Bell, Shield, Globe, CreditCard, Palette, 
  Smartphone, Lock, Eye, ChevronRight
} from "lucide-react";

interface SettingItem {
  label: string;
  description?: string;
  href?: string;
  toggle?: boolean;
  defaultOn?: boolean;
}

interface SettingSection {
  title: string;
  description: string;
  icon: typeof User;
  items: SettingItem[];
}

const settingSections: SettingSection[] = [
  {
    title: "Account",
    description: "Manage your account details and preferences",
    icon: User,
    items: [
      { label: "Edit Profile", description: "Update your name, bio, and avatar", href: "/profile" },
      { label: "Email & Password", description: "Change your login credentials" },
      { label: "Identity Verification", description: "Verify your identity for withdrawals" },
    ],
  },
  {
    title: "Notifications",
    description: "Choose what alerts you receive",
    icon: Bell,
    items: [
      { label: "Push Notifications", toggle: true, defaultOn: true },
      { label: "Email Notifications", toggle: true, defaultOn: true },
      { label: "Task Updates", toggle: true, defaultOn: true },
      { label: "Marketing Emails", toggle: true, defaultOn: false },
    ],
  },
  {
    title: "Privacy & Security",
    description: "Control your privacy and security settings",
    icon: Shield,
    items: [
      { label: "Two-Factor Authentication", description: "Add an extra layer of security" },
      { label: "Active Sessions", description: "Manage your logged-in devices" },
      { label: "Profile Visibility", toggle: true, defaultOn: true },
    ],
  },
  {
    title: "Payment Methods",
    description: "Manage your deposit and withdrawal methods",
    icon: CreditCard,
    items: [
      { label: "Bank Accounts", description: "Add or remove bank accounts" },
      { label: "Crypto Wallets", description: "Connect external crypto wallets (advanced)" },
    ],
  },
  {
    title: "Preferences",
    description: "Customize your experience",
    icon: Palette,
    items: [
      { label: "Language", description: "English" },
      { label: "Currency Display", description: "NGN (₦)" },
      { label: "Dark Mode", toggle: true, defaultOn: false },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your account, notifications, and preferences</p>
        </div>

        <div className="space-y-6">
          {settingSections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{section.title}</CardTitle>
                    <CardDescription className="text-xs">{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                {section.items.map((item, idx) => (
                  <div key={item.label}>
                    {idx > 0 && <Separator className="my-1" />}
                    <div className="flex items-center justify-between py-3 px-1 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        )}
                      </div>
                      {item.toggle ? (
                        <Switch defaultChecked={item.defaultOn} />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
