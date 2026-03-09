import type { NewBadgeAward } from '@/types/badge.types';
import { create } from 'zustand';

interface BadgeStore {
    pendingBadges: NewBadgeAward[];
    currentBadge: NewBadgeAward | null;
    addBadges: (badges: NewBadgeAward[]) => void;
    showNext: () => void;
    dismiss: () => void;
}

export const useBadgeStore = create<BadgeStore>((set, get) => ({
    pendingBadges: [],
    currentBadge: null,

    addBadges: (badges) =>
        set((state) => {
            const queue = [...state.pendingBadges, ...badges];
            if (state.currentBadge === null && queue.length > 0) {
                const [first, ...rest] = queue;
                return { currentBadge: first, pendingBadges: rest };
            }
            return { pendingBadges: queue };
        }),

    showNext: () =>
        set((state) => {
            if (state.pendingBadges.length === 0) {
                return { currentBadge: null };
            }
            const [first, ...rest] = state.pendingBadges;
            return { currentBadge: first, pendingBadges: rest };
        }),

    dismiss: () => get().showNext(),
}));
