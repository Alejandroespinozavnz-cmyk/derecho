import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export function SheetContent({
  className,
  children,
  side = "right",
  size = "default",
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
  side?: "right" | "left" | "bottom";
  size?: "default" | "wide";
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-bg/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 flex flex-col bg-surface shadow-soft focus:outline-none",
          side === "right" && size === "wide" &&
            "inset-y-0 right-0 h-full w-full max-w-5xl border-l border-border",
          side === "right" && size === "default" &&
            "inset-y-0 right-0 h-full w-full max-w-sm border-l border-border",
          side === "left" &&
            "inset-y-0 left-0 h-full w-full max-w-xs border-r border-border",
          side === "bottom" &&
            "inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t border-border",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute top-3 right-3 inline-flex size-11 items-center justify-center rounded-sm text-muted hover:bg-bg-warm hover:text-fg">
          <X className="size-4" />
          <span className="sr-only">Cerrar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function SheetTitle({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("font-display text-xl text-fg", className)}
      {...props}
    />
  );
}
