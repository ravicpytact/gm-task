"use client";

import { useId, type ReactNode } from "react";
import {
  Controller,
  type Control,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";

export type FormControlProps<T extends FieldValues, N extends FieldPath<T>> = ControllerRenderProps<
  T,
  N
> & {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby"?: string;
};

type FormFieldProps<T extends FieldValues, N extends FieldPath<T>> = {
  control: Control<T>;
  name: N;
  label: string;
  description?: string | undefined;
  render: (control: FormControlProps<T, N>) => ReactNode;
};

/**
 * Every form field: a visible label, the control, a description and the error, tied together for
 * assistive technology (FE-UI-006). Server field errors arrive here through applyFieldErrors.
 */
export function FormField<T extends FieldValues, N extends FieldPath<T>>({
  control,
  name,
  label,
  description,
  render,
}: FormFieldProps<T, N>) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const describedBy = [description ? descriptionId : null, fieldState.error ? errorId : null]
          .filter(Boolean)
          .join(" ");
        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            {render({
              ...field,
              id,
              "aria-invalid": fieldState.invalid,
              ...(describedBy ? { "aria-describedby": describedBy } : {}),
            })}
            {description ? (
              <FieldDescription id={descriptionId}>{description}</FieldDescription>
            ) : null}
            <FieldError id={errorId} errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}
