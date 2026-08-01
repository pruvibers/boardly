import { BoardlyShell } from "@/components/boardly-shell";
import { BoardlyWorkspace } from "@/components/boardly-workspace";

export default function Home() {
  return (
    <BoardlyShell>
      <BoardlyWorkspace />
    </BoardlyShell>
  );
}
