const steps = [
  { n: "01", title: "Discover", text: "Browse thousands of vetted AI agents across every category and use case." },
  { n: "02", title: "Download", text: "Instant source-code delivery. Download the agent, blueprints, and integrations." },
  { n: "03", title: "Deploy Anywhere", text: "Bring your own cloud. Deploy locally or to your preferred infrastructure." },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-20">
      <div className="mx-auto w-[min(1200px,92%)]">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">How it works</p>
          <h2 className="mt-2 font-display text-4xl sm:text-5xl">From discovery to downloaded in minutes.</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-card to-surface p-8">
              <div className="font-display text-6xl text-gradient">{s.n}</div>
              <h3 className="mt-4 font-display text-2xl">{s.title}</h3>
              <p className="mt-2 text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
