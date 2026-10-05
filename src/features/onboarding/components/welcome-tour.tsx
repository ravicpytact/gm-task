"use client";

import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { APP_NAME } from "@/config/constants";
import { useSession } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TOUR_STEPS } from "../constants";
import { useCompleteTour } from "../queries";

/** The first visible element for a selector (the nav exists twice: sidebar and phone bar). */
function visible(selector: string): Element | undefined {
  return [...document.querySelectorAll(selector)].find((el) => {
    const box = el.getBoundingClientRect();
    return box.width > 0 && box.height > 0;
  });
}

/**
 * The welcome for someone new (shown once per account): a card, then an optional five-step tour of
 * the Dashboard. Finishing or skipping records it, so it never shows again on any device.
 */
export function WelcomeTour() {
  const user = useSession().data?.user;
  const complete = useCompleteTour();
  const [dismissed, setDismissed] = useState(false);

  if (!user || user.tour_completed_at || dismissed) return null;

  const finish = () => {
    setDismissed(true);
    complete.mutate();
  };

  const startTour = () => {
    setDismissed(true); // close the card; the tour takes over
    const steps: DriveStep[] = TOUR_STEPS.flatMap((step) => {
      const element = visible(step.target);
      return element
        ? [{ element, popover: { title: step.title, description: step.description } }]
        : [];
    });
    if (steps.length === 0) {
      complete.mutate(); // nothing to point at (the screen is still loading): count it as seen
      return;
    }
    const tour = driver({
      steps,
      showProgress: true,
      progressText: "{{current}} of {{total}}",
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Done",
      allowClose: true,
      smoothScroll: true,
      stagePadding: 4, // a snug highlight: no page content showing around small targets
      stageRadius: 8,
      popoverClass: "app-tour",
      // Finished, skipped with ✕ or Esc: either way it is done.
      onDestroyed: () => complete.mutate(),
    });
    // After the card has closed and given focus back, so the two never fight over the page.
    window.setTimeout(() => tour.drive(), 200);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && finish()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-6" aria-hidden />
          </span>
          <DialogTitle>
            Welcome to {APP_NAME}, {user.first_name}
          </DialogTitle>
          <DialogDescription>
            Your daily tasks, called Todos, are waiting on the Dashboard. Answer them each day, and
            see your progress in History and Report.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Take a one-minute tour of the screen? You can skip it.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={finish}>
            Skip
          </Button>
          <Button onClick={startTour}>Take a quick tour</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
