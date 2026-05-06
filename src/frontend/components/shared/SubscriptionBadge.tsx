interface SubscriptionBadgeProps {
  status: "active" | "trial" | "expired" | "cancelled";
}

const CONFIG: Record<
  SubscriptionBadgeProps["status"],
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-green-500/10 text-green-600",
  },
  trial: {
    label: "Trial",
    className: "bg-blue-500/10 text-blue-600",
  },
  expired: {
    label: "Expired",
    className: "bg-red-500/10 text-red-500",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-yellow-500/10 text-yellow-600",
  },
};

export function SubscriptionBadge({ status }: SubscriptionBadgeProps) {
  const { label, className } = CONFIG[status] || CONFIG.expired;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${className}`}
    >
      {label}
    </span>
  );
}
