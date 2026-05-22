"use client";

import { useState } from "react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function SettlementDetailsForm({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/sellers/settlement-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to submit details");
      }

      toast.success("Settlement details submitted for verification.");
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to submit details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl w-full bg-background p-6 rounded-2xl border shadow-sm">
      <h3 className="font-semibold text-lg mb-4">Bank Account Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="accountHolderName">Account Holder Name</Label>
          <Input id="accountHolderName" name="accountHolderName" required placeholder="John Doe" />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bankName">Bank Name</Label>
          <Input id="bankName" name="bankName" required placeholder="HDFC Bank" />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="accountNumber">Account Number</Label>
          <Input id="accountNumber" name="accountNumber" type="password" required placeholder="••••••••••••" />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="ifscCode">IFSC Code</Label>
          <Input id="ifscCode" name="ifscCode" required placeholder="HDFC0001234" />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="accountType">Account Type</Label>
          <Select name="accountType" defaultValue="savings">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="savings">Savings</SelectItem>
              <SelectItem value="current">Current</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="upiId">UPI ID (Optional)</Label>
          <Input id="upiId" name="upiId" placeholder="john@okhdfc" />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="panNumber">PAN Number</Label>
          <Input id="panNumber" name="panNumber" required placeholder="ABCDE1234F" />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full mt-6 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-12">
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Submit for Verification
      </Button>
    </form>
  );
}
