import { NoActivePreview } from "@/components/newcomer-employee-page";
import { NewcomerShell } from "@/components/newcomer-shell";

export function NewcomerExperienceRoute() {
  return (
    <NewcomerShell>
      <NoActivePreview />
    </NewcomerShell>
  );
}
