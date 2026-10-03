import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { useFavorites } from "../hooks/useFavorites";
import type { FavoriteItem } from "../types";

interface FavoriteButtonProps {
  item: Omit<FavoriteItem, "savedAt">;
  className?: string;
}

export function FavoriteButton({ item, className }: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavorites();
  const saved = isFavorite(item.id);

  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={() => toggle(item)}
      className={cn("btn-ghost", saved && "border-signal/60 text-signal", className)}
    >
      <motion.svg
        key={String(saved)}
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 18 }}
        viewBox="0 0 24 24"
        className="size-4"
        aria-hidden
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.6}
      >
        <path d="M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
      </motion.svg>
      {saved ? "Saved" : "Save"}
    </button>
  );
}
