import Link from "next/link";
import { Bot, Star } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/frontend/components/ui/card";
import { SubscriptionBadge } from "./SubscriptionBadge";

interface ToolCardProps {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  tag?: string | null;
  category?: string | null;
  avgRating?: string | null;
  salesCount?: number;
  /** If provided, shows subscription status badge */
  subscriptionStatus?: "active" | "trial" | "expired" | "cancelled" | null;
  /** Link destination — defaults to marketplace detail */
  href?: string;
}

export function ToolCard({
  id,
  name,
  description,
  price,
  tag,
  avgRating,
  salesCount = 0,
  subscriptionStatus,
  href,
}: ToolCardProps) {
  const linkTo = href || `/marketplace/${id}`;
  const priceDisplay = price / 100;

  return (
    <Link href={linkTo}>
      <Card className="group relative h-full rounded-2xl border-transparent hover:border-primary/20 hover:shadow-md transition-all cursor-pointer bg-card overflow-hidden">
        <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary">
            <Bot className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-2">
            {subscriptionStatus && (
              <SubscriptionBadge status={subscriptionStatus} />
            )}
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Star className="h-3 w-3 fill-primary text-primary" />
              {avgRating || "New"}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <h3 className="font-bold text-sm truncate">{name}</h3>
          {tag && (
            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium uppercase tracking-wider">
              {tag}
            </span>
          )}
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
            {description}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <div className="font-semibold text-sm">
              ${priceDisplay}
              <span className="text-xs font-normal text-muted-foreground">
                /mo
              </span>
            </div>
            {salesCount > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {salesCount.toLocaleString()} users
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
