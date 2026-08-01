import { BoardlyShell } from "@/components/boardly-shell";
import { EmployeeForm } from "@/components/employee-form";

export default function Home() {
  return (
    <BoardlyShell>
      <div className="space-y-6">
        <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-soft sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E36E4]">
            Boardly
          </p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
            <div>
              <h2 className="max-w-3xl text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                Turn a verified role into a secure onboarding plan.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-gray-600 sm:text-base">
                Submit verified employee data, generate deterministic onboarding
                recommendations, validate access through policy, and preview a
                safe setup package without provisioning anything automatically.
              </p>
            </div>
            <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
              <p className="text-sm font-semibold leading-6 text-[#5B21B6]">
                AI recommends. Policy restricts. Humans approve.
              </p>
            </div>
          </div>
        </section>
        <EmployeeForm />
      </div>
    </BoardlyShell>
  );
}
