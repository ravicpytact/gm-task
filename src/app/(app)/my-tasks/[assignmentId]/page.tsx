import { MyTaskDetailScreen } from "@/features/assignments";

export const metadata = { title: "My task" };

// Screen 31.
export default async function MyTaskDetailPage({ params }: PageProps<"/my-tasks/[assignmentId]">) {
  const { assignmentId } = await params;
  return <MyTaskDetailScreen assignmentId={assignmentId} />;
}
