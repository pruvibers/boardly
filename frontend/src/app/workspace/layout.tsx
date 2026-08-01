import { redirect } from "next/navigation";
import { BoardlyShell } from "@/components/boardly-shell";
import { getDemoSession } from "@/lib/demo-session";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getDemoSession();
  if (session?.role !== "admin") redirect("/");
  return <BoardlyShell>{children}</BoardlyShell>;
}
