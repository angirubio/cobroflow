import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { AgingColor } from "@/lib/invoice-metrics";

const COLOR_CLASSES: Record<AgingColor, string> = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  orange: "bg-orange-100 text-orange-800",
  red: "bg-red-100 text-red-800",
};

interface AgingBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color: AgingColor;
}

export function AgingBadge({ color, className, ...props }: AgingBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        COLOR_CLASSES[color],
        className
      )}
      {...props}
    />
  );
}
