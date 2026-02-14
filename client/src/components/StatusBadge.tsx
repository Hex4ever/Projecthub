import { cn } from "@/lib/utils";

type Status = "todo" | "in_progress" | "review" | "done" | string;

const statusConfig: Record<string, { label: string; className: string }> = {
  todo: { label: "To Do", className: "bg-slate-100 text-slate-700 border-slate-200" },
  in_progress: { label: "In Progress", className: "bg-blue-50 text-blue-700 border-blue-200" },
  review: { label: "Review", className: "bg-amber-50 text-amber-700 border-amber-200" },
  done: { label: "Done", className: "bg-green-50 text-green-700 border-green-200" },
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-700" };
  
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}
