import { redirect } from "next/navigation";
import { HOME_PATH } from "@/lib/auth/constants";

export default function RootPage() {
  redirect(HOME_PATH);
}
