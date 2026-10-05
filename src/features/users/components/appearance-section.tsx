"use client";

import { useId } from "react";
import { AccentPicker, ModeSwitch } from "@/components/layout/appearance-controls";
import { FormSection } from "@/components/layout/form-section";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";

/** My Profile → Appearance: light / dark / system and the colour theme, saved on this device. */
export function AppearanceSection() {
  const modeId = useId();
  const accentId = useId();
  return (
    <FormSection
      title="Appearance"
      description={
        <>
          <p>How TaskDesk looks on this device. Changes apply at once.</p>
          <p>Each phone or computer keeps its own choice.</p>
        </>
      }
    >
      <Card>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={modeId}>Mode</FieldLabel>
              <ModeSwitch id={modeId} />
              <FieldDescription>
                System follows this device&apos;s light or dark setting.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor={accentId}>Colour theme</FieldLabel>
              <AccentPicker id={accentId} />
              <FieldDescription className="md:hidden">Saved on this device only.</FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    </FormSection>
  );
}
