import * as React from "react";

interface LoaderProps {
  size?: number;
  text?: string;
  /** When true, uses responsive sizing for mobile (smaller on phone) */
  responsive?: boolean;
}

const AILoader: React.FC<LoaderProps> = ({ size = 180, text = "ANMIX AI", responsive = false }) => {
  const letters = text.split("");

  return (
    <div className="flex items-center justify-center overflow-visible">
      <div
        className={`relative flex items-center justify-center font-inter select-none ${
          responsive ? "w-[110px] h-[110px] sm:w-[150px] sm:h-[150px] md:w-[180px] md:h-[180px]" : ""
        }`}
        style={!responsive ? { width: size, height: size } : undefined}
      >
        {letters.map((letter, index) => (
          <span
            key={index}
            className="inline-block text-white opacity-40 animate-loaderLetter"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {letter}
          </span>
        ))}

        <div className="absolute inset-0 rounded-full animate-loaderCircle" />
      </div>

      <style jsx>{`
        @keyframes loaderCircle {
          0% {
            transform: rotate(90deg);
            box-shadow:
              0 6px 12px 0 #38bdf8 inset,
              0 12px 18px 0 #005dff inset,
              0 36px 36px 0 #1e40af inset,
              0 0 3px 1.2px rgba(56, 189, 248, 0.3),
              0 0 6px 1.8px rgba(0, 93, 255, 0.2);
          }
          50% {
            transform: rotate(270deg);
            box-shadow:
              0 6px 12px 0 #60a5fa inset,
              0 12px 6px 0 #0284c7 inset,
              0 24px 36px 0 #005dff inset,
              0 0 3px 1.2px rgba(56, 189, 248, 0.3),
              0 0 6px 1.8px rgba(0, 93, 255, 0.2);
          }
          100% {
            transform: rotate(450deg);
            box-shadow:
              0 6px 12px 0 #4dc8fd inset,
              0 12px 18px 0 #005dff inset,
              0 36px 36px 0 #1e40af inset,
              0 0 3px 1.2px rgba(56, 189, 248, 0.3),
              0 0 6px 1.8px rgba(0, 93, 255, 0.2);
          }
        }

        @keyframes loaderLetter {
          0%,
          100% {
            opacity: 0.4;
            transform: translateY(0);
          }
          20% {
            opacity: 1;
            transform: scale(1.15);
          }
          40% {
            opacity: 0.7;
            transform: translateY(0);
          }
        }

        .animate-loaderCircle {
          animation: loaderCircle 5s linear infinite;
        }

        .animate-loaderLetter {
          animation: loaderLetter 3s infinite;
        }
      `}</style>
    </div>
  );
};

// Keep original name for compatibility with the snippet
export const Component = AILoader;

export default AILoader;

