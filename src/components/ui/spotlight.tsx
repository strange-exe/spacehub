// Adapted from Aceternity UI "Spotlight" (ui.aceternity.com/components/spotlight).
// Changes: warm "signal" tint instead of white, sized for the plate hero, aria-hidden.
import { cn } from "@/lib/cn";

export function Spotlight({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={cn("pointer-events-none absolute z-0 h-[169%] w-[138%] opacity-0 animate-spotlight lg:w-[84%]", className)}
      viewBox="0 0 3787 2842"
      fill="none"
    >
      <g filter="url(#spotlight-blur)">
        <ellipse
          cx="1924.71"
          cy="273.501"
          rx="1924.71"
          ry="273.501"
          transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
          fill="#ffb58a"
          fillOpacity="0.16"
        />
      </g>
      <defs>
        <filter id="spotlight-blur" x="0.86" y="0.84" width="3785.16" height="2840.26" filterUnits="userSpaceOnUse">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="151" result="effect1_foregroundBlur" />
        </filter>
      </defs>
    </svg>
  );
}
