import { Bot, Briefcase, Code2, HeadphonesIcon, LineChart, Mail, PenTool, Search } from "lucide-react";

const cats = [
  { icon: Mail, name: "Sales & Outreach", count: 312 },
  { icon: HeadphonesIcon, name: "Customer Support", count: 248 },
  { icon: Search, name: "Research", count: 197 },
  { icon: PenTool, name: "Content & Marketing", count: 421 },
  { icon: Code2, name: "Developer Tools", count: 188 },
  { icon: LineChart, name: "Analytics", count: 134 },
  { icon: Briefcase, name: "Operations", count: 156 },
  { icon: Bot, name: "Personal Assistants", count: 289 },
];

export function Categories() {
  return (
    <section id="categories" className="py-20">
      <div className="mx-auto w-[min(1200px,92%)]">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Browse</p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl">Explore by category</h2>
          </div>
          <a className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline" href="#">View all →</a>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {cats.map((c) => (
            <a
              key={c.name}
              href="#"
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-primary-glow/15 text-primary">
                <c.icon className="h-5 w-5" />
              </div>
              <div className="mt-4 font-medium">{c.name}</div>
              <div className="text-sm text-muted-foreground">{c.count} agents</div>
              <div className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-primary to-primary-glow transition-transform duration-500 group-hover:scale-x-100" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
