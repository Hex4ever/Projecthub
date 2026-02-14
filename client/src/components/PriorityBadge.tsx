import { cn } from "@/lib/utils";
import { ArrowUp, ArrowRight, ArrowDown } from "lucide-react";

type Priority = "low" | "medium" | "high" | string;

const priorityConfig: Record<string, { label: string; icon: any; className: string }> = {
  high: { label: "High", icon: ArrowUp, className: "text-red-600 bg-red-50 border-red-100" },
  medium: { label: "Medium", icon: ArrowRight, className: "text-amber-600 bg-amber-50 border-amber-100" },
  low: { label: "Low", icon: ArrowDown, className: "text-blue-600 bg-blue-50 border-blue-100" },
};

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const config = priorityConfig[priority] || priorityConfig.medium;
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
      config.className,
      className
    )}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
