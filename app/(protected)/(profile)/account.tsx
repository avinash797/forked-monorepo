import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { useAuth } from '@/hooks/use-auth';
import { useDeleteAccount } from '@/hooks/use-delete-account';
import { supabase } from '@/lib/supabase';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

export default function AccountScreen() {
    const { user } = useAuth();
    const { theme } = useTheme();

    // Email state
    const [newEmail, setNewEmail] = useState('');

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Delete account state
    const deleteAccountMutation = useDeleteAccount();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    // Update email mutation
    const updateEmailMutation = useMutation({
        mutationFn: async (email: string) => {
            const { error } = await supabase.auth.updateUser({ email });
            if (error) throw error;
        },
        onSuccess: () => {
            setNewEmail('');
            Alert.alert(
                'Confirmation Sent',
                'A confirmation link has been sent to your new email address. Please check your inbox to complete the change.'
            );
        },
        onError: (error: Error) => {
            Alert.alert('Error', error.message || 'Failed to update email.');
        },
    });

    // Update password mutation
    const updatePasswordMutation = useMutation({
        mutationFn: async ({
            currentPassword,
            newPassword,
        }: {
            currentPassword: string;
            newPassword: string;
        }) => {
            // Verify current password by re-authenticating
            const { error: signInError } =
                await supabase.auth.signInWithPassword({
                    email: user!.email,
                    password: currentPassword,
                });
            if (signInError) throw new Error('Current password is incorrect.');

            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            Alert.alert('Success', 'Your password has been updated.');
        },
        onError: (error: Error) => {
            Alert.alert(
                'Error',
                error.message || 'Failed to update password.'
            );
        },
    });

    const handleUpdateEmail = () => {
        if (!newEmail.trim()) return;
        if (newEmail === user?.email) {
            Alert.alert('Error', 'New email must be different from your current email.');
            return;
        }
        updateEmailMutation.mutate(newEmail.trim());
    };

    const handleUpdatePassword = () => {
        if (!currentPassword || !newPassword || !confirmPassword) return;
        if (newPassword.length < 6) {
            Alert.alert('Error', 'New password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match.');
            return;
        }
        updatePasswordMutation.mutate({ currentPassword, newPassword });
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
                    error.message ||
                        'Failed to delete account. Please try again.'
                );
            },
        });
    };

    const handleDeleteModalClose = () => {
        setShowDeleteModal(false);
        setDeleteConfirmText('');
    };

    const isEmailValid = newEmail.trim().length > 0 && newEmail !== user?.email;
    const isPasswordValid =
        currentPassword.length > 0 &&
        newPassword.length >= 6 &&
        newPassword === confirmPassword;

    return (
        <ScrollView
            contentContainerStyle={styles.scrollContent}
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
        >
            {/* Email Section */}
            <View style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                    Email Address
                </ThemedText>
                <ThemedText
                    style={{
                        fontSize: 13,
                        color: theme.color.textTertiary,
                        marginBottom: 12,
                    }}
                >
                    Current email: {user?.email}
                </ThemedText>
                <ThemedTextInput
                    label="New Email"
                    value={newEmail}
                    onChangeText={setNewEmail}
                    placeholder="Enter new email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <View style={{ height: 12 }} />
                <ThemedButton
                    onPress={handleUpdateEmail}
                    disabled={!isEmailValid}
                    loading={updateEmailMutation.isPending}
                    variant="secondary"
                >
                    Update Email
                </ThemedButton>
            </View>

            {/* Password Section */}
            <View style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                    Change Password
                </ThemedText>
                <View style={{ gap: 12 }}>
                    <ThemedTextInput
                        label="Current Password"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        placeholder="Enter current password"
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <ThemedTextInput
                        label="New Password"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="Enter new password"
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <ThemedTextInput
                        label="Confirm New Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirm new password"
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>
                <View style={{ height: 12 }} />
                <ThemedButton
                    onPress={handleUpdatePassword}
                    disabled={!isPasswordValid}
                    loading={updatePasswordMutation.isPending}
                    variant="secondary"
                >
                    Update Password
                </ThemedButton>
            </View>

            {/* Delete Account Section */}
            <View style={styles.deleteSection}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                    Delete Account
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
                    style={{ alignSelf: 'flex-start' }}
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
                        onPress={() => {}}
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
    scrollContent: {
        padding: 24,
        flexGrow: 1,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        marginBottom: 16,
    },
    deleteSection: {
        marginBottom: 48,
    },
});
