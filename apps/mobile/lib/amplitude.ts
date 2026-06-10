import * as amplitude from '@amplitude/analytics-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const amplitudeApiKey = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY || '';

export const initAmplitude = async () => {
    try {
        // Set user ID (if available)
        const userId = await AsyncStorage.getItem('userId');
        await amplitude.init(amplitudeApiKey, userId ?? undefined, {
            disableCookies: true,
        }).promise;
    } catch (error) {
        console.error('Error initializing Amplitude:', error);
    }
};

export const trackEvent = (
    eventName: string,
    eventProperties?: Record<string, any>
) => {
    amplitude.track(eventName, eventProperties);
};
