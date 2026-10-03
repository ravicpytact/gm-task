import { ResetPasswordScreen } from "@/features/auth";

export const metadata = { title: "Reset password" };

// Reached from the reset email: /reset-password?token=…
export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  return <ResetPasswordScreen token={typeof token === "string" && token ? token : null} />;
}
