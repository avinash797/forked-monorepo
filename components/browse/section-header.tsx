import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onSeeAllPress?: () => void;
  seeAllLabel?: string;
}

/**
 * Section header with title, optional subtitle, and "See All" link
 * Used in: Home feed, detail screens for section dividers
 */
export function SectionHeader({
  title,
  subtitle,
  onSeeAllPress,
  seeAllLabel = 'See All',
}: SectionHeaderProps) {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.textContainer}>
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
        {subtitle && (
          <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
        )}
      </ThemedView>

      {onSeeAllPress && (
        <TouchableOpacity
          onPress={onSeeAllPress}
          activeOpacity={0.7}
          style={styles.seeAllButton}
        >
          <ThemedText type="link" style={styles.seeAllText}>
            {seeAllLabel} →
          </ThemedText>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.6,
  },
  seeAllButton: {
    paddingLeft: 12,
  },
  seeAllText: {
    fontSize: 14,
  },
});
