import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import {
    type ReportReason,
    useReportContent,
} from '@/hooks/use-report-content';
import { useState } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
    { value: 'inappropriate_photo', label: 'Inappropriate photo' },
    { value: 'offensive', label: 'Offensive content' },
    { value: 'spam', label: 'Spam' },
    { value: 'other', label: 'Other' },
];

interface ReportPhotoModalProps {
    visible: boolean;
    ratingId: string | null;
    onClose: () => void;
}

export function ReportPhotoModal({
    visible,
    ratingId,
    onClose,
}: ReportPhotoModalProps) {
    const { theme } = useTheme();
    const styles = createThemedStyles(theme);
    const [selectedReason, setSelectedReason] = useState<ReportReason | null>(
        null
    );
    const [description, setDescription] = useState('');
    const reportMutation = useReportContent();

    const handleSubmit = () => {
        if (!ratingId || !selectedReason) return;

        reportMutation.mutate(
            {
                ratingId,
                reason: selectedReason,
                description: description.trim() || undefined,
            },
            {
                onSettled: () => {
                    handleClose();
                },
            }
        );
    };

    const handleClose = () => {
        setSelectedReason(null);
        setDescription('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={handleClose}
        >
            <Pressable style={styles.overlay} onPress={handleClose}>
                <Pressable style={styles.content} onPress={() => {}}>
                    <View style={styles.header}>
                        <ThemedText type="subtitle" style={styles.title}>
                            Report Photo
                        </ThemedText>
                        <Pressable
                            onPress={handleClose}
                            hitSlop={12}
                            style={({ pressed }) =>
                                pressed && { opacity: 0.5 }
                            }
                        >
                            <IconSymbol
                                name="close"
                                size={24}
                                color={theme.color.textSecondary}
                            />
                        </Pressable>
                    </View>

                    <ThemedText style={styles.subtitle}>
                        Why are you reporting this photo?
                    </ThemedText>

                    <View style={styles.reasons}>
                        {REPORT_REASONS.map((reason) => {
                            const isSelected =
                                selectedReason === reason.value;
                            return (
                                <Pressable
                                    key={reason.value}
                                    onPress={() =>
                                        setSelectedReason(reason.value)
                                    }
                                    style={[
                                        styles.reasonRow,
                                        isSelected && styles.reasonRowSelected,
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.radio,
                                            isSelected && styles.radioSelected,
                                        ]}
                                    >
                                        {isSelected && (
                                            <View style={styles.radioInner} />
                                        )}
                                    </View>
                                    <ThemedText style={styles.reasonLabel}>
                                        {reason.label}
                                    </ThemedText>
                                </Pressable>
                            );
                        })}
                    </View>

                    <TextInput
                        placeholder="Additional details (optional)"
                        placeholderTextColor={theme.color.textTertiary}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        maxLength={500}
                        style={styles.textInput}
                    />

                    <ThemedButton
                        onPress={handleSubmit}
                        disabled={!selectedReason}
                        loading={reportMutation.isPending}
                        destructive
                    >
                        Submit Report
                    </ThemedButton>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
        },
        content: {
            backgroundColor: theme.color.surface,
            borderRadius: theme.radius.xl,
            borderCurve: 'continuous',
            padding: theme.space.lg,
            width: '100%',
            maxWidth: 400,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.space.sm,
        },
        title: {
            fontSize: theme.font.size.lg,
        },
        subtitle: {
            fontSize: theme.font.size.sm,
            color: theme.color.textSecondary,
            marginBottom: theme.space.md,
        },
        reasons: {
            gap: theme.space.xs,
            marginBottom: theme.space.md,
        },
        reasonRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.sm,
            paddingVertical: 10,
            paddingHorizontal: theme.space.sm,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.color.border,
        },
        reasonRowSelected: {
            borderColor: theme.color.error,
            backgroundColor: theme.color.error + '10',
        },
        radio: {
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: theme.color.border,
            alignItems: 'center',
            justifyContent: 'center',
        },
        radioSelected: {
            borderColor: theme.color.error,
        },
        radioInner: {
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: theme.color.error,
        },
        reasonLabel: {
            fontSize: theme.font.size.md,
            color: theme.color.textPrimary,
        },
        textInput: {
            backgroundColor: theme.color.inputBg,
            borderWidth: 1,
            borderColor: theme.color.inputBorder,
            borderRadius: theme.radius.md,
            padding: theme.space.sm,
            fontSize: theme.font.size.md,
            color: theme.color.textPrimary,
            minHeight: 80,
            textAlignVertical: 'top',
            marginBottom: theme.space.md,
        },
    });
