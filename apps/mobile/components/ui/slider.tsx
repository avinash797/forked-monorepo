import { useTheme } from '@/contexts/theme-provider';
import Slider from '@react-native-community/slider';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SliderInputProps {
    value: number;
    onChange: (rating: number) => void;
    min?: number;
    max?: number;
    step?: number;
    readonly?: boolean;
    lightColor?: string;
    darkColor?: string;
}

export function SliderInput({
    value,
    onChange,
    min = 0.1,
    max = 10.0,
    step = 0.1,
    readonly = false,
    lightColor,
    darkColor,
}: SliderInputProps) {
    const { theme, colorScheme } = useTheme();

    const activeColor =
        colorScheme === 'light'
            ? (lightColor ?? theme.color.accent)
            : (darkColor ?? theme.color.accent);

    const inactiveColor = theme.color.textSecondary;
    const thumbColor = theme.color.textPrimary;

    const handleValueChange = (newValue: number) => {
        // Round to step precision to handle floating point errors
        const preciseValue = parseFloat(newValue.toFixed(1));
        onChange(preciseValue);
    };

    return (
        <View style={styles.container}>
            {/* Value Label */}
            <View style={styles.valueLabelContainer}>
                <Text style={[styles.valueLabel, { color: activeColor }]}>
                    {value.toFixed(1)}
                </Text>
            </View>

            <Slider
                style={styles.slider}
                minimumValue={min}
                maximumValue={max}
                step={step}
                value={value}
                onValueChange={handleValueChange}
                disabled={readonly}
                minimumTrackTintColor={activeColor}
                maximumTrackTintColor={inactiveColor}
                thumbTintColor={thumbColor}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 60,
        justifyContent: 'center',
    },
    slider: {
        width: '100%',
        height: 40,
    },
    valueLabelContainer: {
        alignItems: 'center',
        marginBottom: 4,
    },
    valueLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
