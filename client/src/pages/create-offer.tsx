import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, DollarSign, CheckCircle2 } from "lucide-react";
import { calculatePTF, calculateTotalDeposit } from "@/utils/calculate-ptf";
import { useWallet } from "@/hooks/use-wallet";
import { useOffers } from "@/hooks/use-offers";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function CreateOfferPage() {
  const [, setLocation] = useLocation();
  const { balance, initializeDeposit } = useWallet();
  const { createOffer } = useOffers();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: 0,
    location: "",
    urgency: "medium" as const,
    category: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const ptf = formData.budget >= 5 ? calculatePTF(formData.budget) : 0;
  const totalDeposit = formData.budget >= 5 ? calculateTotalDeposit(formData.budget) : 0;
  const sufficientFunds = balance >= totalDeposit;

  const categories = [
    "Financial Assistance",
    "Supplies",
    "Physical Labor",
    "Education",
    "Transportation",
    "Pet Care",
    "Tech Support",
    "Event Planning",
    "Medical",
    "Legal",
    "Home Repair",
    "Cleaning",
    "Others",
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === "budget" ? Math.max(0, value) : value,
    }));
  };

  const handleCreateOffer = async () => {
    if (!formData.title || !formData.description || formData.budget < 5 || !formData.category) {
      alert("Please fill all fields. Minimum budget is ₦5.");
      return;
    }

    if (!sufficientFunds) {
      alert("Insufficient balance for this offer.");
      return;
    }

    setIsLoading(true);

    try {
      // Create the offer in pending status
      const offerId = createOffer({
        title: formData.title,
        description: formData.description,
        budget: formData.budget,
        ptf: ptf,
        totalDeposit: totalDeposit,
        status: "pending",
        creatorId: "user-001", // Mock user ID
        creatorName: "Alex Johnson",
        creatorAvatar: "https://i.pravatar.cc/150?u=alex",
        creatorRating: 4.9,
        location: formData.location,
        urgency: formData.urgency,
        category: formData.category,
      });

      // Deduct from wallet (budget added to wallet, PTF stored as platform earnings)
      await initializeDeposit(formData.budget + ptf);

      setShowConfirm(false);
      setFormData({
        title: "",
        description: "",
        budget: 0,
        location: "",
        urgency: "medium",
        category: "",
      });

      alert("Offer created successfully! It's now pending review. You'll be notified once approved.");
      setLocation("/dashboard");
    } catch (error) {
      console.error("Error creating offer:", error);
      alert("Failed to create offer");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="text-center space-y-3">
              <h1 className="text-4xl font-bold">Create a New Offer</h1>
              <p className="text-lg text-muted-foreground">
                Post a task and find trusted helpers in your community
              </p>
            </div>

            {/* Main Form Card */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Offer Details</CardTitle>
                <CardDescription>
                  Fill in the details about what you need help with
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Help moving furniture"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="h-11"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what you need help with in detail..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={5}
                    className="resize-none"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger id="category" className="h-11">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Lagos, Nigeria"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      className="h-11"
                    />
                  </div>

                  {/* Budget */}
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget (₦) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="budget"
                        type="number"
                        placeholder="0"
                        min="5"
                        step="1"
                        value={formData.budget || ""}
                        onChange={(e) => handleInputChange("budget", parseInt(e.target.value) || 0)}
                        className="pl-10 h-11"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Minimum: ₦5</p>
                  </div>

                  {/* Urgency */}
                  <div className="space-y-2">
                    <Label htmlFor="urgency">Urgency Level</Label>
                    <Select value={formData.urgency} onValueChange={(value: any) => handleInputChange("urgency", value)}>
                      <SelectTrigger id="urgency" className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical (ASAP)</SelectItem>
                        <SelectItem value="urgent">Urgent (Today)</SelectItem>
                        <SelectItem value="high">High (This week)</SelectItem>
                        <SelectItem value="medium">Medium (This month)</SelectItem>
                        <SelectItem value="low">Low (Flexible)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fee Summary Card */}
            {formData.budget >= 5 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      Fee Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 bg-white dark:bg-zinc-900 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Task Budget</span>
                        <span className="font-semibold">₦{formData.budget.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-dashed" />
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Platform Protection Fee (PTF)</span>
                        <span className="font-semibold text-orange-600">₦{ptf.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-dashed" />
                      <div className="flex justify-between items-center text-lg">
                        <span className="font-bold">Total to Deposit</span>
                        <span className="font-bold text-primary">₦{totalDeposit.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Budget amount goes to your wallet</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>PTF ensures transaction safety and support</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Offer enters pending review before going live</span>
                      </div>
                    </div>

                    {!sufficientFunds && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-red-900 dark:text-red-400">Insufficient Balance</p>
                          <p className="text-sm text-red-800 dark:text-red-300">
                            You need ₦{(totalDeposit - balance).toLocaleString()} more
                          </p>
                        </div>
                      </div>
                    )}

                    {sufficientFunds && (
                      <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-green-900 dark:text-green-400">Ready to Create</p>
                          <p className="text-sm text-green-800 dark:text-green-300">
                            Your balance: ₦{balance.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setLocation("/dashboard")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                size="lg"
                onClick={() => setShowConfirm(true)}
                disabled={!sufficientFunds || !formData.title || !formData.description || formData.budget < 5 || !formData.category || isLoading}
                className="flex-1"
              >
                {isLoading ? "Creating..." : "Create Offer"}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Confirm Offer Creation</CardTitle>
                <CardDescription>
                  Please review before creating your offer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Task</p>
                    <p className="font-semibold">{formData.title}</p>
                  </div>
                  <div className="border-t" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total to Deposit</span>
                    <span className="font-bold text-lg">₦{totalDeposit.toLocaleString()}</span>
                  </div>
                  <div className="border-t" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">What happens next?</p>
                    <ul className="space-y-1 text-sm">
                      <li>✓ Offer enters Pending Review status</li>
                      <li>✓ Admin team reviews within 24 hours</li>
                      <li>✓ Goes live once approved</li>
                      <li>✓ You get notified immediately</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
              <div className="px-6 py-4 flex gap-3 border-t bg-slate-50 dark:bg-slate-900">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateOffer}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Creating..." : "Confirm & Create"}
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
