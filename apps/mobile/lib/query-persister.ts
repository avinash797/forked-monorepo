import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { PersistedClient } from '@tanstack/query-persist-client-core';
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

const MAP_TAG = '__MAP__';

function serialize(client: PersistedClient): string {
    return JSON.stringify(client, (_key, value) => {
        if (value instanceof Map) {
            return { [MAP_TAG]: Array.from(value.entries()) };
        }
        return value;
    });
}

function deserialize(str: string): PersistedClient {
    return JSON.parse(str, (_key, value) => {
        if (
            value &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            Array.isArray(value[MAP_TAG]) &&
            Object.keys(value).length === 1
        ) {
            return new Map(value[MAP_TAG]);
        }
        return value;
    });
}

export const asyncStoragePersister = createAsyncStoragePersister({
    storage: AsyncStorage,
    key: '@forked/react-query-cache',
    serialize,
    deserialize,
});
