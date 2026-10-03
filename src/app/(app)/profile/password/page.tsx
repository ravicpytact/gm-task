import { redirect } from "next/navigation";

// Change Password is now the Password tab of My Profile; old links keep working.
export default function ChangePasswordPage() {
  redirect("/profile?tab=password");
}
