import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedButton } from '@/components/themed-button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { StyleSheet } from 'react-native';

interface EmptyStateProps {
  icon?: 'search' | 'restaurant' | 'location-on' | 'warning' | 'error';
  title: string;
  message: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

/**
 * Reusable empty state component
 * Uses Material Icons naming convention
 * See: https://icons.expo.fyi/Index/MaterialIcons
 * Used in: All screens when no data is available
 */
export function EmptyState({
  icon = 'search',
  title,
  message,
  actionLabel,
  onActionPress,
}: EmptyStateProps) {
  return (
    <ThemedView style={styles.container}>
      <IconSymbol name={icon} size={64} color="#999" style={styles.icon} />

      <ThemedText type="title" style={styles.title}>
        {title}
      </ThemedText>

      <ThemedText style={styles.message}>{message}</ThemedText>

      {actionLabel && onActionPress && (
        <ThemedButton
          variant="secondary"
          onPress={onActionPress}
          style={styles.button}
        >
          {actionLabel}
        </ThemedButton>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  icon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  title: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
  button: {
    minWidth: 200,
  },
});
