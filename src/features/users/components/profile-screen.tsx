"use client";

import { useQueryState } from "nuqs";
import { ChangePasswordSection } from "@/features/auth";
import { useCan, useSession } from "@/lib/auth/client";
import { FormPage } from "@/components/layout/form-section";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PROFILE_TABS, profileTabParser, USER_PERMISSIONS } from "../constants";
import { fullName, initials } from "../utils";
import { AppearanceSection } from "./appearance-section";
import { ProfileDetailsSection } from "./profile-details-section";

const parseTab = (value: string) => PROFILE_TABS.find((t) => t === value) ?? "details";

/** Screen 10 — My Profile, with Change Password (Screen 11) as its second tab. */
export function ProfileScreen() {
  const [tab, setTab] = useQueryState("tab", profileTabParser);
  const session = useSession().data;
  const canChangePassword = useCan(USER_PERMISSIONS.updateOwnProfile);
  const active =
    tab === "appearance"
      ? "appearance"
      : tab === "password" && canChangePassword
        ? "password"
        : "details";

  return (
    <FormPage>
      <div className="mb-6 flex items-center gap-4">
        {session ? (
          <Avatar className="size-14">
            <AvatarFallback className="text-lg">{initials(session.user)}</AvatarFallback>
          </Avatar>
        ) : null}
        <div className="flex flex-col gap-0.5">
          <h1 className="type-page-title">My profile</h1>
          {session ? (
            <p className="type-label font-normal">
              {fullName(session.user)} · {session.role.name}
            </p>
          ) : null}
        </div>
      </div>

      <Tabs value={active} onValueChange={(value) => void setTab(parseTab(value))}>
        <TabsList className="mb-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          {canChangePassword ? <TabsTrigger value="password">Password</TabsTrigger> : null}
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <ProfileDetailsSection />
        </TabsContent>
        {canChangePassword ? (
          <TabsContent value="password">
            <ChangePasswordSection />
          </TabsContent>
        ) : null}
        <TabsContent value="appearance">
          <AppearanceSection />
        </TabsContent>
      </Tabs>
      {/* No sign-out here: the account menu in the header has it on every screen (decision 2026-10-03). */}
    </FormPage>
  );
}
