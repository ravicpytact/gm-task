import { UserDetailScreen } from "@/features/assignments";

export const metadata = { title: "User" };

// Screen 28. The Users layout already requires users.user.read_all (FE-AUTH-004).
export default async function UserDetailPage({ params }: PageProps<"/users/[userId]">) {
  const { userId } = await params;
  return <UserDetailScreen userId={userId} />;
}
