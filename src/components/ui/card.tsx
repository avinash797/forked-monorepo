import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "surface" | "surface2" | "dark";
}

const variantStyles: Record<string, string> = {
  surface: "bg-surface border border-border",
  surface2: "bg-surface-2 border border-border",
  dark: "bg-[#342219] border border-[rgba(236,237,238,0.10)]",
};

export function Card({
  variant = "surface",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-lg p-6 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
