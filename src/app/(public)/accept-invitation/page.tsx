import { AcceptInvitationScreen } from "@/features/auth";

export const metadata = { title: "Accept invitation" };

// Reached from the invitation email: /accept-invitation?token=…
export default async function AcceptInvitationPage({
  searchParams,
}: PageProps<"/accept-invitation">) {
  const { token } = await searchParams;
  return <AcceptInvitationScreen token={typeof token === "string" && token ? token : null} />;
}
