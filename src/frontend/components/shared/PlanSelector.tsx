"use client";

import { useState } from "react";
import { Button } from "@/frontend/components/ui/button";
import { Check, Sparkle } from "lucide-react";

interface PlanSelectorProps {
  monthlyPrice: number; // in cents
  /** Override annual price (defaults to 20% off monthly) */
  annualPrice?: number; // in cents
  /** Currently selected plan */
  defaultPlan?: "monthly" | "annual";
  /** Called when user selects a plan */
  onSelect?: (plan: "monthly" | "annual") => void;
  /** Form name for hidden input */
  inputName?: string;
}

export function PlanSelector({
  monthlyPrice,
  annualPrice,
  defaultPlan = "monthly",
  onSelect,
  inputName = "planType",
}: PlanSelectorProps) {
  const [selected, setSelected] = useState<"monthly" | "annual">(defaultPlan);

  const monthlyDisplay = monthlyPrice / 100;
  const annualMonthly = annualPrice
    ? annualPrice / 100 / 12
    : (monthlyPrice * 0.8) / 100;
  const annualTotal = annualPrice
    ? annualPrice / 100
    : (monthlyPrice * 0.8 * 12) / 100;
  const savingsPercent = 20;

  const handleSelect = (plan: "monthly" | "annual") => {
    setSelected(plan);
    onSelect?.(plan);
  };

  return (
    <div className="space-y-3">
      <input type="hidden" name={inputName} value={selected} />

      {/* Monthly */}
      <button
        type="button"
        onClick={() => handleSelect("monthly")}
        className={`w-full flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all ${
          selected === "monthly"
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-border/50 hover:border-border"
        }`}
      >
        <div
          className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition ${
            selected === "monthly" ? "border-primary bg-primary" : "border-border"
          }`}
        >
          {selected === "monthly" && <Check className="h-3 w-3 text-white" />}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm">Monthly</div>
          <div className="text-xs text-muted-foreground">Billed monthly, cancel anytime</div>
        </div>
        <div className="text-right">
          <div className="font-bold">${monthlyDisplay}</div>
          <div className="text-[10px] text-muted-foreground">/month</div>
        </div>
      </button>

      {/* Annual */}
      <button
        type="button"
        onClick={() => handleSelect("annual")}
        className={`w-full flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all relative overflow-hidden ${
          selected === "annual"
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-border/50 hover:border-border"
        }`}
      >
        <div className="absolute top-0 right-0 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-bl-lg flex items-center gap-1">
          <Sparkle className="h-2.5 w-2.5" />
          Save {savingsPercent}%
        </div>
        <div
          className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition ${
            selected === "annual" ? "border-primary bg-primary" : "border-border"
          }`}
        >
          {selected === "annual" && <Check className="h-3 w-3 text-white" />}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm">Annual</div>
          <div className="text-xs text-muted-foreground">
            ${annualTotal.toFixed(2)} billed yearly
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold">${annualMonthly.toFixed(2)}</div>
          <div className="text-[10px] text-muted-foreground">/month</div>
        </div>
      </button>
    </div>
  );
}
