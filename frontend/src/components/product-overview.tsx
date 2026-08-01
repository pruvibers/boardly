const workflowSteps = [
  "Verified employee",
  "Onboarding plan",
  "Policy validation",
  "Setup preview",
];

export function ProductOverview() {
  return (
    <div className="rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-teal">
          Boardly
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-ink sm:text-5xl">
          Secure AI employee onboarding
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate">
          Boardly converts a verified employee role into an explainable
          onboarding plan with access recommendations, required software,
          relevant documentation, checklist items, and a safe setup preview.
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        {workflowSteps.map((step, index) => (
          <div
            key={step}
            className="rounded-md border border-line bg-cloud p-4"
          >
            <p className="text-sm font-semibold text-teal">
              Step {index + 1}
            </p>
            <p className="mt-2 text-base font-semibold text-ink">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
