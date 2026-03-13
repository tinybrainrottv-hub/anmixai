"use client";

import React from "react";
import { cn } from "@/lib/utils";

const CardCanvas = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("auth-glow-card-canvas", className)}>
      <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden>
        <filter
          id="unopaq"
          width="3000%"
          x="-1000%"
          height="3000%"
          y="-1000%"
        >
          <feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 3 0" />
        </filter>
      </svg>
      <div className="auth-glow-card-backdrop" />
      {children}
    </div>
  );
};

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("auth-glow-card", className)}>
      <div className="auth-glow-border auth-glow-border-left" />
      <div className="auth-glow-border auth-glow-border-right" />
      <div className="auth-glow-border auth-glow-border-top" />
      <div className="auth-glow-border auth-glow-border-bottom" />
      <div className="auth-glow-card-content">{children}</div>
    </div>
  );
};

export { CardCanvas, Card };
