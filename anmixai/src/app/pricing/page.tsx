'use client';

import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
  PricingTableSix,
  PlanProps,
} from '@/components/ui/pricing-table-six';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from '@/components/ui/responsive-modal';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { cn } from '@/lib/utils';

export default function PricingPage() {
  const [proModalOpen, setProModalOpen] = useState(false);

  const plans: PlanProps[] = [
    {
      id: 'free',
      title: 'Free',
      description: 'Perfect to explore AI',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        '1M tokens per month',
        'Unlimited AI chat (fair usage)',
        'Access to 2 image models',
        'Basic image generation',
        'Text to audio (limited quality)',
        'Basic image editor',
      ],
    },
    {
      id: 'pro',
      title: 'Pro',
      description: 'For creators & developers',
      monthlyPrice: 5,
      yearlyPrice: 50,
      isFeatured: true,
      features: [
        '25M tokens per month',
        'Unlimited AI chat (priority speed)',
        '7+ premium image AI models',
        'HD image generation',
        'Advanced image editor',
        'Image upscaling (4x / 8x)',
        'Text to studio-quality audio',
        'API access',
        'Coding assistant mode',
        'Commercial use license',
        'Priority support',
      ],
    },
    {
      id: 'enterprise',
      title: 'Enterprise',
      description: 'For teams & companies',
      monthlyPrice: 99,
      yearlyPrice: 990,
      isCustom: true,
      features: [
        'Custom token limits',
        'Unlimited API calls',
        'Dedicated AI infrastructure',
        'Custom AI model integration',
        'White-label option',
        'Team management',
        'SLA & dedicated support',
        'On-demand scaling',
      ],
    },
  ];

  const handlePlanSelect = (planId: string) => {
    if (planId === 'pro') {
      setProModalOpen(true);
      return;
    }
    if (planId === 'enterprise') {
      if (typeof window !== 'undefined') {
        const url =
          'https://mail.google.com/mail/?view=cm&fs=1&to=anmixaidev@gmail.com&su=Enterprise%20plan%20inquiry&body=Hi%20ANMIX%20AI%20team,%0D%0A%0D%0AI%27m%20interested%20in%20the%20Enterprise%20plan.';
        window.open(url, '_blank');
      }
      return;
    }
    // free plan: no-op or scroll
  };

  return (
    <main
      className={cn(
        'relative min-h-svh w-full overflow-hidden',
        'text-foreground',
      )}
    >
      <div className="absolute inset-0 z-0 h-full w-full">
        <FallingPattern
          className="h-full w-full [mask-image:radial-gradient(ellipse_at_center,transparent_15%,#020617_65%)]"
          color="hsl(220_70%_50%_/_.28)"
          backgroundColor="#020617"
          duration={150}
          blurIntensity="0.75em"
          density={1}
        />
      </div>

      <section className="relative z-10 w-full">
        <div className="pt-8 px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to chat
          </Link>
        </div>

        <PricingTableSix plans={plans} onPlanSelect={handlePlanSelect} />
      </section>

      <ResponsiveModal open={proModalOpen} onOpenChange={setProModalOpen}>
        <ResponsiveModalContent side="bottom" className="max-w-sm">
          <ResponsiveModalHeader>
            <ResponsiveModalTitle>ANMIX AI is now free</ResponsiveModalTitle>
            <ResponsiveModalDescription>
              ANMIX AI is now free and the pricing will coming soon.
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>
        </ResponsiveModalContent>
      </ResponsiveModal>
    </main>
  );
}
