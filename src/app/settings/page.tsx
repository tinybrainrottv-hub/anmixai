"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";

type SettingsData = {
  emailNotifications: boolean;
  desktopNotifications: boolean;
  autoplayAnimations: boolean;
};

const STORAGE_KEY = "anmix-settings";

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData>({
    emailNotifications: true,
    desktopNotifications: false,
    autoplayAnimations: true,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setData((prev) => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggle = (field: keyof SettingsData) => {
    setData((prev) => ({ ...prev, [field]: !prev[field] }));
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
            <Settings className="h-5 w-5 text-[#60a5ff]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
            <p className="text-xs text-white/50">
              Personalize how ANMIX behaves for you.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <ToggleRow
            label="Email notifications"
            description="Receive updates about important account activity."
            checked={data.emailNotifications}
            onClick={() => toggle("emailNotifications")}
          />
          <ToggleRow
            label="Desktop notifications"
            description="Show system notifications for new AI responses."
            checked={data.desktopNotifications}
            onClick={() => toggle("desktopNotifications")}
          />
          <ToggleRow
            label="Play interface animations"
            description="Enable subtle UI animations and transitions."
            checked={data.autoplayAnimations}
            onClick={() => toggle("autoplayAnimations")}
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full h-9 rounded-lg bg-[#0055FF] text-xs font-semibold tracking-wide hover:bg-[#0044cc] transition-colors"
        >
          {saved ? "Preferences saved" : "Save preferences"}
        </button>
      </div>
    </div>
  );
}

type ToggleRowProps = {
  label: string;
  description: string;
  checked: boolean;
  onClick: () => void;
};

function ToggleRow({ label, description, checked, onClick }: ToggleRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between rounded-2xl bg-black/40 border border-white/10 px-3 py-2 text-left hover:border-[#60a5ff]/70 transition-colors"
    >
      <div className="space-y-0.5">
        <p className="text-[11px] font-semibold text-white/90">{label}</p>
        <p className="text-[10px] text-white/50">{description}</p>
      </div>
      <div
        className={`h-4 w-7 rounded-full border transition-colors flex items-center px-0.5 ${
          checked
            ? "border-[#60a5ff] bg-[#1d4ed8]"
            : "border-white/20 bg-white/5"
        }`}
      >
        <div
          className={`h-3 w-3 rounded-full bg-white transition-transform ${
            checked ? "translate-x-3" : "translate-x-0"
          }`}
        />
      </div>
    </button>
  );
}

