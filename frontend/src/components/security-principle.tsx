export function SecurityPrinciple() {
  return (
    <section className="rounded-lg border border-line bg-ink p-6 text-white shadow-soft sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.08em] text-amber-200">
        Security principle
      </p>
      <h2 className="mt-3 text-2xl font-semibold leading-snug sm:text-3xl">
        AI recommends. Policy engine restricts. Humans approve.
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-mist">
        Recommendations are useful only after deterministic policy checks and
        explicit human review. Sensitive actions stay controlled, explainable,
        and audit-ready.
      </p>
    </section>
  );
}
