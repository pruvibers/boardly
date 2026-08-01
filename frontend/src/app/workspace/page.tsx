import { BoardlyShell } from "@/components/boardly-shell";
import { BoardlyWorkspace } from "@/components/boardly-workspace";

export default function WorkspacePage() {
  return (
    <BoardlyShell>
      <BoardlyWorkspace />
    </BoardlyShell>
  );
}
