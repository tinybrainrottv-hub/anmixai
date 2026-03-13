"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export interface PlanProps {
  id: string;
  title: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  isFeatured?: boolean;
  isCustom?: boolean;
}

interface PricingTableSixProps {
  plans: PlanProps[];
  onPlanSelect?: (planId: string) => void;
}

export function PricingTableSix({ plans, onPlanSelect }: PricingTableSixProps) {
  const [yearly, setYearly] = React.useState(false);

  const getCardGradient = (index: number, isFeatured: boolean) => {
    if (isFeatured) {
      return "from-emerald-500/20 via-emerald-600/10 to-transparent";
    }
    if (index === 0) return "from-blue-500/20 via-blue-600/10 to-transparent";
    if (index === 2) return "from-amber-500/20 via-orange-600/10 to-transparent";
    return "from-white/5 to-transparent";
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
          <span className="inline-block animate-pulse">
            ANMIX AI IS NOW FREE !
          </span>
        </h2>
        <p className="text-white/60 text-sm max-w-xl mx-auto">
          Enjoy powerful text and image AI models from ANMIX AI at no cost while we prepare new plans.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              !yearly ? "text-white" : "text-white/50"
            )}
          >
            Monthly
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={yearly}
            onClick={() => setYearly((y) => !y)}
            className={cn(
              "relative w-12 h-6 rounded-full transition-colors",
              yearly ? "bg-[#0055FF]" : "bg-white/20"
            )}
          >
            <span
              className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                yearly ? "left-7" : "left-1"
              )}
            />
          </button>
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              yearly ? "text-white" : "text-white/50"
            )}
          >
            Yearly
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan, index) => (
          <div
            key={plan.id}
            className={cn(
              "relative rounded-2xl border p-6 transition-all duration-300",
              "bg-gradient-to-b",
              getCardGradient(index, !!plan.isFeatured),
              plan.isFeatured
                ? "border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.15)] scale-[1.02]"
                : "border-white/10 hover:border-white/20"
            )}
          >
            {plan.isFeatured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-black/80 border border-white/20 px-3 py-0.5 text-[10px] font-semibold text-white">
                  Most popular
                </span>
              </div>
            )}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">{plan.title}</h3>
              <p className="text-xs text-white/60">{plan.description}</p>
              <div className="flex items-baseline gap-1">
                {plan.isCustom ? (
                  <span className="text-2xl font-bold text-white">Contact us</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-white">
                      ${yearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-white/60 text-sm">
                      / {yearly ? "year" : "month"}
                    </span>
                  </>
                )}
              </div>
              <Button
                onClick={() => onPlanSelect?.(plan.id)}
                className={cn(
                  "w-full",
                  plan.isFeatured
                    ? "bg-white hover:bg-white/90 text-gray-900 font-medium"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                )}
              >
                {plan.isCustom ? "Contact team" : "Get started"}
              </Button>
            </div>
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-3">
                What&apos;s included:
              </p>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-white/80"
                  >
                    <Check className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
