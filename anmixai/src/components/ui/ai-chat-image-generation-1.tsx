"use client"

import * as React from "react"
import { motion } from "motion/react"

export interface ImageGenerationProps {
  children: React.ReactNode
  /** When set, image is ready - show it. If runReveal is true, run blur-reveal once. */
  imageUrl?: string | null
  /** Run blur-reveal animation only once when image becomes ready. False when loading from history. */
  runReveal?: boolean
  /** Called when blur-reveal animation finishes (so we don't run it again). */
  onRevealComplete?: () => void
}

export const ImageGeneration = ({
  children,
  imageUrl,
  runReveal = false,
  onRevealComplete,
}: ImageGenerationProps) => {
  const [revealProgress, setRevealProgress] = React.useState(0)
  const hasRevealed = React.useRef(false)
  const hasCalledComplete = React.useRef(false)

  // When image is ready and we should run reveal: animate progress 0 -> 100, then call onRevealComplete once
  React.useEffect(() => {
    if (!imageUrl || !runReveal || hasRevealed.current) return
    hasRevealed.current = true
    const duration = 4500
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const t = Math.min(1, elapsed / duration)
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      const p = Math.min(100, eased * 100)
      setRevealProgress(p)
      if (p < 100) requestAnimationFrame(tick)
      else if (onRevealComplete && !hasCalledComplete.current) {
        hasCalledComplete.current = true
        onRevealComplete()
      }
    }
    requestAnimationFrame(tick)
  }, [imageUrl, runReveal, onRevealComplete])

  // Still generating: no image yet – show only loading text and placeholder, no blur
  if (!imageUrl) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-sm text-white/70 anmix-shimmer-text">
          Creating image. May take a moment.
        </span>
        <div className="relative rounded-xl overflow-hidden max-w-md bg-[radial-gradient(circle_at_30%_20%,rgba(217,70,239,0.25),transparent_55%),radial-gradient(circle_at_70%_10%,rgba(59,130,246,0.25),transparent_60%),radial-gradient(circle_at_60%_90%,rgba(16,185,129,0.20),transparent_55%)]">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/5 via-transparent to-white/5" />
          {children}
        </div>
      </div>
    )
  }

  // Image ready and skip animation (e.g. from history): just the image, no border, no text
  if (!runReveal) {
    return (
      <div className="relative rounded-xl overflow-hidden max-w-md">
        {children}
      </div>
    )
  }

  // Image ready and run reveal once: image with blur that disappears from top -> down
  return (
    <div className="flex flex-col gap-2">
      <div className="relative rounded-xl overflow-hidden max-w-md">
        {children}
        <motion.div
          className="absolute inset-0 pointer-events-none backdrop-blur-2xl bg-white/5"
          initial={false}
          animate={{
            clipPath: `polygon(0 ${revealProgress}%, 100% ${revealProgress}%, 100% 100%, 0 100%)`,
            opacity: revealProgress >= 100 ? 0 : 1,
          }}
          transition={{ duration: 0 }}
          style={{
            clipPath: `polygon(0 ${revealProgress}%, 100% ${revealProgress}%, 100% 100%, 0 100%)`,
          }}
        />
      </div>
    </div>
  )
}

ImageGeneration.displayName = "ImageGeneration"
