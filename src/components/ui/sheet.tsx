"use client";

import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetTitle = SheetPrimitive.Title;
export const SheetDescription = SheetPrimitive.Description;
export const SheetClose = SheetPrimitive.Close;

export function SheetContent({ children, className, ...props }: React.ComponentProps<typeof SheetPrimitive.Content>) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-40 bg-foreground/30" />
      <SheetPrimitive.Content className={cn("fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-card shadow-xl sm:max-w-lg", className)} {...props}>
        {children}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}
