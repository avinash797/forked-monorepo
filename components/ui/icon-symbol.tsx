import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

export type IconSymbolName = ComponentProps<typeof MaterialIcons>['name'];

/**
 * An icon component that uses Material Icons across all platforms.
 * This ensures a consistent look across iOS, Android, and web.
 * See available icons at https://icons.expo.fyi/Index/MaterialIcons
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) {
  return <MaterialIcons color={color} size={size} name={name} style={style} />;
}
