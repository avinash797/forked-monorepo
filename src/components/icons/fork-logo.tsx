interface ForkLogoProps {
  size?: number;
  color?: string;
  className?: string;
}

export function ForkLogo({
  size = 40,
  color = "#F0F0F0",
  className,
}: ForkLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M3 2v7c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <path
        d="M9 2v20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <path
        d="M15 2v20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <path
        d="M12 12v8.5"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
    </svg>
  );
}
