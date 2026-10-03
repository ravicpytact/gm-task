import { LoginScreen } from "@/features/auth";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, reason } = await searchParams;
  return (
    <LoginScreen
      next={typeof next === "string" ? next : null}
      reason={typeof reason === "string" ? reason : null}
    />
  );
}
