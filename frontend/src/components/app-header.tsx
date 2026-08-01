export function AppHeader() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-md bg-ink text-sm font-bold text-white"
          >
            B
          </div>
          <div>
            <p className="text-lg font-semibold text-ink">Boardly</p>
            <p className="text-sm text-slate">Secure AI employee onboarding</p>
          </div>
        </div>
        <div className="hidden rounded-md border border-line px-3 py-2 text-sm font-medium text-slate sm:block">
          Local-first MVP
        </div>
      </div>
    </header>
  );
}
