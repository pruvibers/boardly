import { AppHeader } from "@/components/app-header";
import { EmployeeForm } from "@/components/employee-form";
import { ProductOverview } from "@/components/product-overview";
import { SecurityPrinciple } from "@/components/security-principle";

export default function Home() {
  return (
    <main className="min-h-screen">
      <AppHeader />
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_430px] lg:px-10 lg:py-12">
        <section className="space-y-6">
          <ProductOverview />
          <SecurityPrinciple />
        </section>
        <EmployeeForm />
      </div>
    </main>
  );
}
