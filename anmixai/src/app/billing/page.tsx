"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";

type BillingData = {
  company?: string;
  address?: string;
  city?: string;
  country?: string;
  gst?: string;
};

const STORAGE_KEY = "anmix-billing-details";

export default function BillingPage() {
  const [data, setData] = useState<BillingData>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setData(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleChange = (field: keyof BillingData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#0055FF]/20 border border-[#0055FF]/40 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-[#60a5ff]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Billing details
            </h1>
            <p className="text-xs text-white/50">
              Saved only on this device for now.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="block text-white/70">Company / Name</label>
            <input
              value={data.company ?? ""}
              onChange={(e) => handleChange("company", e.target.value)}
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-xs outline-none focus:border-[#60a5ff] focus:ring-1 focus:ring-[#60a5ff]"
              placeholder="ANMIX Labs"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-white/70">Billing address</label>
            <input
              value={data.address ?? ""}
              onChange={(e) => handleChange("address", e.target.value)}
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-xs outline-none focus:border-[#60a5ff] focus:ring-1 focus:ring-[#60a5ff]"
              placeholder="Street, building, flat no."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-white/70">City</label>
              <input
                value={data.city ?? ""}
                onChange={(e) => handleChange("city", e.target.value)}
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-xs outline-none focus:border-[#60a5ff] focus:ring-1 focus:ring-[#60a5ff]"
                placeholder="Mumbai"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-white/70">Country</label>
              <input
                value={data.country ?? ""}
                onChange={(e) => handleChange("country", e.target.value)}
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-xs outline-none focus:border-[#60a5ff] focus:ring-1 focus:ring-[#60a5ff]"
                placeholder="India"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-white/70">GST / Tax ID</label>
            <input
              value={data.gst ?? ""}
              onChange={(e) => handleChange("gst", e.target.value)}
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-xs outline-none focus:border-[#60a5ff] focus:ring-1 focus:ring-[#60a5ff]"
              placeholder="Optional"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full h-9 rounded-lg bg-[#0055FF] text-xs font-semibold tracking-wide hover:bg-[#0044cc] transition-colors"
        >
          {saved ? "Saved" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

