import { TaskDetailScreen } from "@/features/assignments";

export const metadata = { title: "Task" };

// Screen 29. The Tasks layout already requires activities.task.read_all (FE-AUTH-004).
export default async function TaskDetailPage({ params }: PageProps<"/tasks/[taskId]">) {
  const { taskId } = await params;
  return <TaskDetailScreen taskId={taskId} />;
}
