import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { Query } from '@tanstack/react-query';

export const PERSIST_MAX_AGE = 1000 * 60 * 60 * 24; // 24 hours

/** Only persist small, stable queries to avoid exceeding AsyncStorage row limits */
const PERSISTED_QUERY_PREFIXES = [
    'dishTypes',
    'dishTypeVariations',
    'tasteTags',
    'cities-with-neighborhoods',
    'auth',
    'profile',
    'userStats',
    'device-location',
    'leaderboard',
    'myDishRankings'
];

export function shouldDehydrateQuery(query: Query): boolean {
    const key = query.queryKey[0];
    return (
        query.state.status === 'success' &&
        typeof key === 'string' &&
        PERSISTED_QUERY_PREFIXES.includes(key)
    );
}

export const asyncStoragePersister = createAsyncStoragePersister({
    storage: AsyncStorage,
    key: '@forked/react-query-cache',
});
