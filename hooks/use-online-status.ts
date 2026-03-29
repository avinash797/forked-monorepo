import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

// Wire NetInfo to React Query's online manager.
// Wrapped in try-catch so the app doesn't crash if the native module
// isn't linked yet (e.g. before a dev client rebuild).
try {
    onlineManager.setEventListener((setOnline) => {
        return NetInfo.addEventListener((state) => {
            setOnline(!!state.isConnected);
        });
    });
} catch {
    // Native module not available — assume online until rebuild
}

export function useOnlineStatus(): boolean {
    return useSyncExternalStore(
        (callback) => onlineManager.subscribe(callback),
        () => onlineManager.isOnline(),
        () => true // SSR fallback — assume online
    );
}
