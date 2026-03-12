"use client";

import { useUser, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilePage() {
  const { user } = useUser();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <SignedOut>
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-black/60 dark:bg-black/60 bg-white/80 backdrop-blur-2xl shadow-2xl p-6 flex flex-col gap-4 items-center text-center">
          <h1 className="text-xl font-bold tracking-tight">You&apos;re signed out</h1>
          <p className="text-xs text-muted-foreground">
            Sign in to view your ANMIX AI profile.
          </p>
          <SignInButton mode="modal">
            <button className="mt-2 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors">
              Sign in
            </button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="max-w-xl w-full rounded-3xl border border-white/10 bg-black/60 dark:bg-black/60 bg-white/80 backdrop-blur-2xl shadow-2xl p-6 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">
              Your <span className="text-blue-500">ANMIX</span> profile
            </h1>
            <p className="text-xs text-muted-foreground">
              These details come directly from your Clerk sign up.
            </p>
          </div>

          <div className="grid gap-4 text-xs">
            <div className="rounded-2xl border border-white/10 bg-black/40 dark:bg-black/40 bg-white/70 px-4 py-3 flex items-center justify-between">
              <span className="font-semibold text-slate-400 uppercase tracking-[0.18em]">
                Full name
              </span>
              <span className="font-medium dark:text-slate-50 text-slate-900">
                {user?.fullName || "Not set"}
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 dark:bg-black/40 bg-white/70 px-4 py-3 flex items-center justify-between">
              <span className="font-semibold text-slate-400 uppercase tracking-[0.18em]">
                Primary email
              </span>
              <span className="font-medium dark:text-slate-50 text-slate-900">
                {user?.primaryEmailAddress?.emailAddress || "Not set"}
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 dark:bg-black/40 bg-white/70 px-4 py-3 flex items-center justify-between">
              <span className="font-semibold text-slate-400 uppercase tracking-[0.18em]">
                Username
              </span>
              <span className="font-medium dark:text-slate-50 text-slate-900">
                {user?.username || "Not set"}
              </span>
            </div>
          </div>

          <div className="mt-2 rounded-2xl border border-dashed border-blue-500/40 bg-blue-500/5 px-4 py-3 text-[10px] leading-relaxed">
            <p className="font-bold uppercase tracking-[0.2em] text-blue-400 mb-2">
              Supabase connection
            </p>
            <p className="text-slate-300">
              This app is wired to use Supabase as a user store. Set{" "}
              <code className="px-1 py-0.5 rounded bg-black/40 text-[9px]">
                NEXT_PUBLIC_SUPABASE_URL
              </code>{" "}
              and{" "}
              <code className="px-1 py-0.5 rounded bg-black/40 text-[9px]">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </code>{" "}
              in your <code>.env.local</code>, then you can extend this page to
              load more profile data from your own <code>profiles</code> table.
            </p>
          </div>

          <div className="mt-1 rounded-2xl border border-dashed border-slate-500/40 bg-slate-500/5 px-4 py-3 text-[10px] leading-relaxed">
            <p className="font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">
              API key boxes
            </p>
            <div className="grid gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-[0.18em] text-slate-500">
                  Clerk publishable key
                </label>
                <input
                  type="password"
                  placeholder="Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in .env.local"
                  className="w-full rounded-xl border border-white/10 bg-black/40 dark:bg-black/40 bg-white/80 px-3 py-1.5 text-[10px] outline-none focus:border-blue-500/60"
                  readOnly
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-[0.18em] text-slate-500">
                  Supabase anon key
                </label>
                <input
                  type="password"
                  placeholder="Set NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
                  className="w-full rounded-xl border border-white/10 bg-black/40 dark:bg-black/40 bg-white/80 px-3 py-1.5 text-[10px] outline-none focus:border-blue-500/60"
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
      </SignedIn>
    </div>
  );
}

