// Product-wide literals: the app's name and its navigation (docs/08-frontend §3).
// Each item carries the permission code that shows it (FE-AUTH-005); the backend still enforces.
import {
  BarChart3,
  ClipboardList,
  History,
  LayoutDashboard,
  ListChecks,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export const APP_NAME = "TaskDesk";

/**
 * Moments are shown in this time zone everywhere (docs: "moments shown in IST"), on the server and
 * in the browser alike, so a server-rendered time never differs from the hydrated one.
 */
export const DISPLAY_TIME_ZONE = "Asia/Kolkata";
export const DISPLAY_LOCALE = "en-IN";

/** Shown as "Change password" in the account menu (Screen 11). */
export const CHANGE_OWN_PASSWORD = "users.profile.update_own";
export const APP_TAGLINE = "Track your daily tasks";

export type NavItem = {
  label: string;
  /** Shorter label for the mobile bottom bar. */
  shortLabel?: string;
  href: string;
  icon: LucideIcon;
  /** Shown only with this permission code. Absent: shown to everyone signed in. */
  permission?: string;
  /** Also shown in the mobile bottom bar. */
  mobile?: boolean;
};

export const NAVIGATION: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, mobile: true },
  { label: "Users", href: "/users", icon: Users, permission: "users.user.read_all" },
  { label: "Tasks", href: "/tasks", icon: ListChecks, permission: "activities.task.read_all" },
  {
    label: "Task Assignments",
    href: "/assignments",
    icon: ClipboardList,
    permission: "assignments.assignment.read_all",
  },
  {
    label: "History",
    href: "/history",
    icon: History,
    permission: "assignments.history.read_own",
    mobile: true,
  },
  {
    label: "Reporting",
    shortLabel: "Report",
    href: "/report",
    icon: BarChart3,
    permission: "reporting.report.read_own",
    mobile: true,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: UserRound,
    permission: "users.profile.read_own",
    mobile: true,
  },
];
