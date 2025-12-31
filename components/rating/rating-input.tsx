import { useTheme } from '@/contexts/theme-provider';
import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import {
  Gesture,
  GestureDetector
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';

interface RatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  min?: number;
  max?: number;
  step?: number;
  readonly?: boolean;
  lightColor?: string;
  darkColor?: string;
  thumbComponent?: React.ReactNode;
}

export function RatingInput({
  value,
  onChange,
  min = 0.1,
  max = 10.0,
  step = 0.1,
  readonly = false,
  lightColor,
  darkColor,
  thumbComponent,
}: RatingInputProps) {
  const [width, setWidth] = useState(0);
  const translateX = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const { theme, colorScheme } = useTheme();

  const activeColor =
    colorScheme === 'light' ? lightColor : darkColor || theme.color.accent;

  const inactiveColor = theme.color.textSecondary; // mapped to muted
  const thumbColor = theme.color.textPrimary;

  // Update position when value changes externally (and not dragging)
  useEffect(() => {
    if (width > 0 && !isDragging.value) {
      const percentage = (Math.max(min, Math.min(value, max)) - min) / (max - min);
      translateX.value = percentage * width;
    }
  }, [value, width, min, max, isDragging]);

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const handleGesture = (x: number) => {
    'worklet';
    if (readonly) return;

    // Clamp x between 0 and width
    const clampedX = Math.max(0, Math.min(x, width));
    translateX.value = clampedX;

    // Calculate rating
    const percentage = clampedX / width;
    const rawValue = min + percentage * (max - min);

    // Snap to step
    const steppedValue = Math.round(rawValue / step) * step;
    const finalValue = Math.max(min, Math.min(steppedValue, max));

    // Use Number.toFixed to handle floating point errors, then parse back
    const preciseValue = parseFloat(finalValue.toFixed(1));

    runOnJS(onChange)(preciseValue);
  };

  const pan = Gesture.Pan()
    .onStart((e) => {
      isDragging.value = true;
      handleGesture(e.x);
    })
    .onUpdate((e) => {
      handleGesture(e.x);
    })
    .onEnd(() => {
      isDragging.value = false;
    });

  const tap = Gesture.Tap()
    .onEnd((e) => {
      handleGesture(e.x);
    });

  const composed = Gesture.Race(pan, tap);

  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const trackStyle = useAnimatedStyle(() => {
    return {
      width: translateX.value,
    };
  });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composed}>
        <View style={styles.touchArea} onLayout={onLayout}>
          {/* Background Track */}
          <View style={[styles.track, { backgroundColor: inactiveColor }]} />

          {/* Active Track */}
          <Animated.View
            style={[
              styles.track,
              styles.activeTrack,
              { backgroundColor: activeColor },
              trackStyle,
            ]}
          />

          {/* Thumb */}
          <Animated.View style={[styles.thumbContainer, thumbStyle]}>
            {thumbComponent ? (
              thumbComponent
            ) : (
              <View style={[styles.defaultThumb, { backgroundColor: thumbColor }]} />
            )}

            {/* Value Label (Follows thumb) */}
            <View style={styles.valueLabelContainer}>
              <Text style={[styles.valueLabel, { color: activeColor }]}>
                {value.toFixed(1)}
              </Text>
            </View>
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60, // Increased height for safe touch area
    justifyContent: 'center',
  },
  touchArea: {
    height: 40,
    justifyContent: 'center',
    width: '100%',
  },
  track: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
    width: '100%',
  },
  activeTrack: {
    // Width is handled by Animated.View
  },
  thumbContainer: {
    position: 'absolute',
    left: -12, // Offset by half width to center (default thumb is 24)
    alignItems: 'center',
  },
  defaultThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  valueLabelContainer: {
    position: 'absolute',
    top: -30,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
