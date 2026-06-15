import Link from "next/link";
import {
 Crosshair,
 Headset,
 FlaskConical,
 PenLine,
 TrendingUp,
 Settings2,
 UsersRound,
 PencilRuler,
 Gavel,
 Sparkle,
} from "lucide-react";

const CATEGORIES = [
 { name: "Sales", slug: "sales", icon: Crosshair, color: "from-blue-500/20 to-blue-600/10 text-blue-600" },
 { name: "Support", slug: "support", icon: Headset, color: "from-green-500/20 to-green-600/10 text-green-600" },
 { name: "Research", slug: "research", icon: FlaskConical, color: "from-purple-500/20 to-purple-600/10 text-purple-600" },
 { name: "Content", slug: "content", icon: PenLine, color: "from-orange-500/20 to-orange-600/10 text-orange-600" },
 { name: "Analytics", slug: "analytics", icon: TrendingUp, color: "from-cyan-500/20 to-cyan-600/10 text-cyan-600" },
 { name: "Operations", slug: "operations", icon: Settings2, color: "from-slate-500/20 to-slate-600/10 text-slate-600" },
 { name: "HR", slug: "hr", icon: UsersRound, color: "from-pink-500/20 to-pink-600/10 text-pink-600" },
 { name: "Design", slug: "design", icon: PencilRuler, color: "from-amber-500/20 to-amber-600/10 text-amber-600" },
 { name: "Legal", slug: "legal", icon: Gavel, color: "from-teal-500/20 to-teal-600/10 text-teal-600" },
];

export function CategoryGrid() {
 return (
 <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
 {CATEGORIES.map((cat) => (
 <Link
 key={cat.slug}
 href={`/marketplace?cat=${cat.slug}`}
 className="group flex flex-col items-center gap-3 rounded-2xl border border-border/50 bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20"
 >
 <div
 className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${cat.color} transition-transform group-hover:scale-110`}
 >
 <cat.icon className="h-5 w-5" />
 </div>
 <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground">
 {cat.name}
 </span>
 </Link>
 ))}
 <Link
 href="/marketplace"
 className="group flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/50 bg-card/50 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20"
 >
 <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary transition-transform group-hover:scale-110">
 <Sparkle className="h-5 w-5" />
 </div>
 <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
 View All
 </span>
 </Link>
 </div>
 );
}
