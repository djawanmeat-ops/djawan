import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  variant?: "primary" | "light" | "outline";
};

export function Button({ children, className, variant = "primary", ...props }: ButtonProps) {
  return (
    <a
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-bold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring active:translate-y-px",
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "light" && "bg-cream text-brown hover:bg-gold",
        variant === "outline" && "border border-current bg-transparent text-current hover:bg-foreground/5",
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}