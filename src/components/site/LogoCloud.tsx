const logos = ["Northwind", "Lumen", "Halcyon", "Inkstone", "Vector AI", "Kite & Co", "Praxis", "Forma"];

export function LogoCloud() {
  return (
    <section className="border-y border-border bg-surface/50 py-10">
      <div className="mx-auto w-[min(1200px,92%)]">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
          Powering teams at companies you know
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
          {logos.map((l) => (
            <span key={l} className="font-display text-2xl text-foreground/80">{l}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
