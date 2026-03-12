"use client";

import { useEffect, useState } from "react";
import { Cookie, Shield, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CookiePanelProps {
  title?: string;
  message?: string;
  acceptText?: string;
  declineText?: string;
  icon?: "cookie" | "shield" | "info";
  className?: string;
  privacyHref?: string;
  termsHref?: string;
}

const CookiePanel = (props: CookiePanelProps) => {
  const {
    title = "This site uses cookies",
    message = "We use cookies to enhance your experience.",
    acceptText = "Accept all",
    declineText = "Decline",
    icon = "cookie",
    className,
    privacyHref = "/privacy",
    termsHref = "/terms",
  } = props;

  const [visible, setVisible] = useState(false);
  const [render, setRender] = useState(false);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("cookie-consent")
        : null;

    if (!stored) {
      setRender(true);
      requestAnimationFrame(() => setVisible(true));
    }
  }, []);

  const closeWithExit = (val?: "true" | "false") => {
    if (val) localStorage.setItem("cookie-consent", val);
    setVisible(false);
    setTimeout(() => setRender(false), 300);
  };

  if (!render) return null;

  const IconEl =
    icon === "shield" ? Shield : icon === "info" ? Info : Cookie;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className={cn(
        "fixed right-4 bottom-4 md:right-6 md:bottom-6 z-50 w-[360px] max-w-[92vw]",
      )}
    >
      <div
        className={cn(
          "relative border border-border/70 rounded-xl bg-card/95 text-card-foreground shadow-xl backdrop-blur",
          "p-3.5 flex flex-col gap-3",
          visible
            ? cn("animate-in", "fade-in", "slide-in-from-bottom-8")
            : cn("animate-out", "fade-out", "slide-out-to-bottom-8"),
          "duration-300 ease-out",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
            <IconEl className="size-4" aria-hidden="true" />
          </span>

          <h2 className="text-[13px] font-semibold leading-5">{title}</h2>

          <button
            type="button"
            onClick={() => closeWithExit()}
            className="ml-auto inline-flex size-7 items-center justify-center rounded-md hover:bg-foreground/5 cursor-pointer"
            aria-label="Close cookie banner"
          >
            <X className="size-3.5 text-muted-foreground" />
          </button>
        </div>

        <p className="text-[11px] leading-5 text-muted-foreground">
          {message} See our{" "}
          <a
            href={privacyHref}
            className="underline underline-offset-4 hover:text-foreground cursor-pointer"
          >
            Privacy Policy
          </a>{" "}
          and{" "}
          <a
            href={termsHref}
            className="underline underline-offset-4 hover:text-foreground cursor-pointer"
          >
            Terms &amp; Conditions
          </a>
          .
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => closeWithExit("false")}
            className={cn(
              "px-3 py-1.5 rounded-md border border-border/70 cursor-pointer",
              "bg-muted text-muted-foreground text-[11px]",
              "hover:bg-muted/80 transition-colors"
            )}
          >
            {declineText}
          </button>

          <button
            type="button"
            onClick={() => closeWithExit("true")}
            className={cn(
              "px-3 py-1.5 rounded-md text-[11px] cursor-pointer",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90 transition-colors"
            )}
          >
            {acceptText}
          </button>
        </div>
      </div>
    </div>
  );
};

export { CookiePanel };

