import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent" | "gold" | "silver" | "bronze";
}

const variantStyles: Record<string, string> = {
  default: "bg-badge-bg text-badge-text border border-border",
  accent: "bg-accent text-accent-on",
  gold: "bg-gold/20 text-gold border border-gold/30",
  silver: "bg-silver/20 text-silver border border-silver/30",
  bronze: "bg-bronze/20 text-bronze border border-bronze/30",
};

export function Badge({
  variant = "default",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-semibold ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
