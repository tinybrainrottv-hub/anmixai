"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function TypingEffect({
  text = "Ask anything to anmix ai",
  className,
}: {
  text?: string;
  className?: string;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <div className={cn(className)}>
      {text.split("").map((letter, index) => (
        <motion.span
          key={`${index}-${letter}`}
          initial={{ opacity: 0 }}
          animate={mounted ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
        >
          {letter}
        </motion.span>
      ))}
    </div>
  );
}
