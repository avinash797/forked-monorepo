import Svg, { Path } from 'react-native-svg';

interface ForkLogoProps {
  size?: number;
  color?: string;
}

export function ForkLogo({ size = 40, color = '#F0F0F0' }: ForkLogoProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Path
        d="M3 2v7c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <Path
        d="M7 2v20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <Path
        d="M17 2v20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <Path
        d="M12 12v10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
    </Svg>
  );
}
