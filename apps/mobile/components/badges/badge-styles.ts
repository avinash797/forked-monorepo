import type { useTheme } from '@/contexts/theme-provider';
import { StyleSheet } from 'react-native';

export const createBadgeStyles = (
    theme: ReturnType<typeof useTheme>['theme']
) =>
    StyleSheet.create({
        container: {
            marginTop: theme.space.lg,
            marginBottom: theme.space.lg,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: theme.space.md,
            marginBottom: theme.space.sm,
        },
        title: {
            fontSize: theme.font.size.lg,
            fontWeight: theme.font.weight.bold,
            color: theme.color.textPrimary,
        },
        badgeCount: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
        },
        listContent: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: theme.space.md,
            rowGap: theme.space.lg,
        },
        badgeWrapper: {
            width: '25%',
        },
        badgeItem: {
            alignItems: 'center',
            width: '100%',
            paddingHorizontal: theme.space.xxs,
        },
        badgeItemPressed: {
            opacity: 0.7,
        },
        badgeImageContainer: {
            width: 76,
            height: 76,
            borderRadius: '100%',
            backgroundColor: theme.color.surface,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: theme.space.xs,
        },
        badgeImageUnearned: {
            opacity: 0.35,
        },
        badgeImageFeatured: {
            borderWidth: 2,
            borderColor: '#F5C842',
            shadowColor: '#F5C842',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 6,
            elevation: 4,
        },
        badgeImage: {
            width: 60,
            height: 60,
        },
        unearnedImage: {
            opacity: 0.4,
        },
        placeholderEmoji: {
            fontSize: 24,
        },
        badgeName: {
            fontSize: theme.font.size.xs,
            color: theme.color.textSecondary,
            textAlign: 'center',
            fontWeight: theme.font.weight.medium,
        },
        unearnedText: {
            opacity: 0.4,
        },
        loadingContainer: {
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.xl,
            alignItems: 'center',
        },
        emptyContainer: {
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.xl,
            alignItems: 'center',
        },
        emptyText: {
            color: theme.color.textSecondary,
            fontSize: theme.font.size.sm,
            textAlign: 'center',
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.65)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: theme.space.xl,
        },
        modalCard: {
            width: '100%',
            maxWidth: 340,
        },
        modalContent: {
            backgroundColor: theme.color.bg,
            borderRadius: theme.radius.xl,
            paddingVertical: theme.space.xxl,
            paddingHorizontal: theme.space.xl,
            alignItems: 'center',
        },
        modalImageContainer: {
            marginBottom: theme.space.lg,
        },
        modalBadgeImage: {
            width: 100,
            height: 100,
        },
        modalBadgePlaceholder: {
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: theme.color.surface,
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalPlaceholderEmoji: {
            fontSize: 48,
        },
        modalBadgeName: {
            fontSize: theme.font.size.xl,
            fontWeight: theme.font.weight.bold,
            color: theme.color.textPrimary,
            textAlign: 'center',
            marginBottom: theme.space.xs,
        },
        modalBadgeDescription: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
            textAlign: 'center',
            lineHeight: theme.font.size.sm * 1.5,
            marginBottom: theme.space.md,
        },
        featuredTag: {
            backgroundColor: '#F5C842',
            borderRadius: theme.radius.pill,
            paddingVertical: theme.space.xxs,
            paddingHorizontal: theme.space.md,
            marginBottom: theme.space.sm,
        },
        featuredTagText: {
            fontSize: theme.font.size.xs,
            fontWeight: theme.font.weight.bold,
            color: '#1a1a1a',
        },
        modalEarnedDate: {
            fontSize: theme.font.size.xs,
            color: theme.color.textSecondary,
            marginBottom: theme.space.xl,
        },
        modalUnearnedText: {
            fontSize: theme.font.size.xs,
            color: theme.color.textSecondary,
            opacity: 0.6,
            marginBottom: theme.space.xl,
        },
        modalButton: {
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.pill,
            paddingVertical: theme.space.sm,
            paddingHorizontal: theme.space.xxl,
        },
        modalButtonPressed: {
            opacity: 0.7,
        },
        modalButtonText: {
            color: theme.color.textPrimary,
            fontWeight: theme.font.weight.semibold,
            fontSize: theme.font.size.md,
        },
    });

export type BadgeStyles = ReturnType<typeof createBadgeStyles>;
