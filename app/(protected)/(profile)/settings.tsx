import { ThemedButton } from '@/components/themed-button';
import { ThemedSelect } from '@/components/themed-select';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { useAuth } from '@/hooks/use-auth';
import { useDeleteAccount } from '@/hooks/use-delete-account';
import Constants from 'expo-constants';
import { useState } from 'react';
import {
    Alert,
    Linking,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

const THEME_OPTIONS = [
    { label: 'Default (Warm Orange)', value: 'default' },
    { label: 'Gen Z (Bold Red)', value: 'genZ' },
    { label: 'Foodies (Premium)', value: 'foodies' },
    { label: 'Critics (Editorial)', value: 'critics' },
] as const;

const COLOR_SCHEME_OPTIONS = [
    { label: 'System Default', value: 'system' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
] as const;

const LEGAL_LINKS = [
    {
        label: 'Privacy Policy',
        url: 'https://www.forkedapp.com/privacy',
        icon: 'shield-checkmark-outline' as const,
    },
    {
        label: 'Terms of Service',
        url: 'https://www.forkedapp.com/terms',
        icon: 'document-text-outline' as const,
    },
];

export default function SettingsScreen() {
    const { logout } = useAuth();
    const { theme, themeName, setThemeName, themePreference, setThemePreference } =
        useTheme();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Delete account state
    const deleteAccountMutation = useDeleteAccount();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            {
                text: 'Cancel',
                style: 'cancel',
            },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    setIsLoggingOut(true);
                    try {
                        await logout();
                    } catch (error: any) {
                        Alert.alert(
                            'Error',
                            error.message || 'Failed to logout'
                        );
                    } finally {
                        setIsLoggingOut(false);
                    }
                },
            },
        ]);
    };

    const handleDeleteAccountPress = () => {
        Alert.alert(
            'Delete Account',
            'This will permanently delete your account and personal data. Your anonymous ratings will be preserved for community scores. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Continue',
                    style: 'destructive',
                    onPress: () => setShowDeleteModal(true),
                },
            ]
        );
    };

    const handleDeleteConfirm = () => {
        if (deleteConfirmText !== 'DELETE') return;

        deleteAccountMutation.mutate(undefined, {
            onSuccess: () => {
                setShowDeleteModal(false);
                setDeleteConfirmText('');
            },
            onError: (error: Error) => {
                Alert.alert(
                    'Error',
                    error.message || 'Failed to delete account. Please try again.'
                );
            },
        });
    };

    const handleDeleteModalClose = () => {
        setShowDeleteModal(false);
        setDeleteConfirmText('');
    };

    return (
        <ScrollView
            contentContainerStyle={styles.scrollContent}
            contentInsetAdjustmentBehavior="automatic"
        >
            <View style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                    Appearance
                </ThemedText>

                <ThemedSelect
                    label="Theme"
                    placeholder="Select a theme"
                    value={themeName}
                    options={THEME_OPTIONS}
                    onValueChange={(value) => setThemeName(value as any)}
                />

                <View style={{ height: 16 }} />

                <ThemedSelect
                    label="Color Scheme"
                    placeholder="Select color scheme"
                    value={themePreference}
                    options={COLOR_SCHEME_OPTIONS}
                    onValueChange={(value) => setThemePreference(value as any)}
                />
            </View>

            <View style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                    Legal
                </ThemedText>
                {LEGAL_LINKS.map((link) => (
                    <Pressable
                        key={link.url}
                        onPress={() => Linking.openURL(link.url)}
                        style={({ pressed }) => [
                            {
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 14,
                                paddingHorizontal: 4,
                                borderBottomWidth: StyleSheet.hairlineWidth,
                                borderBottomColor: theme.color.border,
                                opacity: pressed ? 0.6 : 1,
                            },
                        ]}
                    >
                        <IconSymbol
                            name={link.icon}
                            size={20}
                            color={theme.color.textSecondary}
                            style={{ marginRight: 12 }}
                        />
                        <ThemedText style={{ flex: 1, fontSize: 16 }}>
                            {link.label}
                        </ThemedText>
                        <IconSymbol
                            name="chevron-forward"
                            size={18}
                            color={theme.color.textTertiary}
                        />
                    </Pressable>
                ))}
            </View>

            <View style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                    Support
                </ThemedText>
                <Pressable
                    onPress={() =>
                        Linking.openURL('mailto:support@forkedapp.com')
                    }
                    style={({ pressed }) => [
                        {
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 14,
                            paddingHorizontal: 4,
                            borderBottomWidth: StyleSheet.hairlineWidth,
                            borderBottomColor: theme.color.border,
                            opacity: pressed ? 0.6 : 1,
                        },
                    ]}
                >
                    <IconSymbol
                        name="mail-outline"
                        size={20}
                        color={theme.color.textSecondary}
                        style={{ marginRight: 12 }}
                    />
                    <ThemedText style={{ flex: 1, fontSize: 16 }}>
                        Contact Support
                    </ThemedText>
                    <IconSymbol
                        name="chevron-forward"
                        size={18}
                        color={theme.color.textTertiary}
                    />
                </Pressable>
            </View>

            <View style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                    About
                </ThemedText>
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 14,
                        paddingHorizontal: 4,
                    }}
                >
                    <ThemedText style={{ fontSize: 16 }}>
                        App Version
                    </ThemedText>
                    <ThemedText
                        style={{
                            fontSize: 16,
                            color: theme.color.textSecondary,
                        }}
                    >
                        {Constants.expoConfig?.version ?? 'Unknown'}
                    </ThemedText>
                </View>
            </View>

            <View style={styles.logoutSection}>
                <ThemedButton
                    onPress={handleLogout}
                    loading={isLoggingOut}
                    variant="secondary"
                >
                    Logout
                </ThemedButton>
            </View>

            <View style={styles.deleteSection}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                    Account
                </ThemedText>
                <ThemedText
                    style={{
                        fontSize: 13,
                        color: theme.color.textTertiary,
                        marginBottom: 12,
                    }}
                >
                    Deleting your account will permanently remove your personal
                    data. Your anonymous ratings will be preserved for community
                    score integrity.
                </ThemedText>
                <ThemedButton
                    onPress={handleDeleteAccountPress}
                    variant="text"
                    style={{
                        alignSelf: 'flex-start',
                    }}
                >
                    <ThemedText
                        style={{
                            color: theme.color.error,
                            fontSize: 15,
                            fontWeight: theme.font.weight.semibold,
                        }}
                    >
                        Delete Account
                    </ThemedText>
                </ThemedButton>
            </View>

            {/* Delete Account Confirmation Modal */}
            <Modal
                visible={showDeleteModal}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={handleDeleteModalClose}
            >
                <Pressable
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 24,
                    }}
                    onPress={handleDeleteModalClose}
                >
                    <Pressable
                        style={{
                            backgroundColor: theme.color.surface,
                            borderRadius: 20,
                            padding: 24,
                            width: '100%',
                            maxWidth: 400,
                        }}
                        onPress={() => { }}
                    >
                        <View
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 24,
                                backgroundColor: theme.color.error + '15',
                                alignItems: 'center',
                                justifyContent: 'center',
                                alignSelf: 'center',
                                marginBottom: 16,
                            }}
                        >
                            <IconSymbol
                                name="warning-outline"
                                size={28}
                                color={theme.color.error}
                            />
                        </View>

                        <ThemedText
                            type="subtitle"
                            style={{
                                textAlign: 'center',
                                marginBottom: 8,
                                fontSize: 18,
                            }}
                        >
                            Are you sure?
                        </ThemedText>

                        <ThemedText
                            style={{
                                textAlign: 'center',
                                color: theme.color.textSecondary,
                                fontSize: 14,
                                marginBottom: 20,
                                lineHeight: 20,
                            }}
                        >
                            This action is permanent and cannot be undone. Type{' '}
                            <ThemedText
                                style={{
                                    fontWeight: theme.font.weight.bold,
                                    color: theme.color.error,
                                    fontSize: 14,
                                }}
                            >
                                DELETE
                            </ThemedText>{' '}
                            to confirm.
                        </ThemedText>

                        <TextInput
                            placeholder="Type DELETE to confirm"
                            placeholderTextColor={theme.color.textTertiary}
                            value={deleteConfirmText}
                            onChangeText={setDeleteConfirmText}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            style={{
                                backgroundColor: theme.color.inputBg,
                                borderWidth: 1,
                                borderColor:
                                    deleteConfirmText === 'DELETE'
                                        ? theme.color.error
                                        : theme.color.inputBorder,
                                borderRadius: 12,
                                padding: 14,
                                fontSize: 16,
                                color: theme.color.textPrimary,
                                textAlign: 'center',
                                marginBottom: 20,
                            }}
                        />

                        <View style={{ gap: 10 }}>
                            <ThemedButton
                                onPress={handleDeleteConfirm}
                                disabled={deleteConfirmText !== 'DELETE'}
                                loading={deleteAccountMutation.isPending}
                                destructive
                            >
                                Delete My Account
                            </ThemedButton>

                            <ThemedButton
                                onPress={handleDeleteModalClose}
                                variant="secondary"
                                disabled={deleteAccountMutation.isPending}
                            >
                                Cancel
                            </ThemedButton>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        justifyContent: 'space-between',
        flexGrow: 1,
    },
    header: {
        marginBottom: 32,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        marginBottom: 16,
    },
    logoutSection: {
        marginTop: 16,
        marginBottom: 32,
    },
    deleteSection: {
        marginBottom: 48,
    },
});
