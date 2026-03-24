import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-provider';
import { useAuth } from '@/hooks/use-auth';
import { useDeleteAccount } from '@/hooks/use-delete-account';
import { supabase } from '@/lib/supabase';
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetTextInput,
    BottomSheetView,
} from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function AccountRow({
    icon,
    label,
    detail,
    onPress,
    styles,
    theme,
    destructive,
}: {
    icon: React.ComponentProps<typeof IconSymbol>['name'];
    label: string;
    detail?: string;
    onPress: () => void;
    styles: ReturnType<typeof createThemedStyles>;
    theme: ReturnType<typeof useTheme>['theme'];
    destructive?: boolean;
}) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.row,
                { opacity: pressed ? theme.opacity.pressed : 1 },
            ]}
        >
            <IconSymbol
                name={icon}
                size={20}
                color={destructive ? theme.color.error : theme.color.textSecondary}
                style={styles.rowIcon}
            />
            <View style={styles.rowContent}>
                <ThemedText style={styles.rowLabel} lightColor={destructive ? theme.color.error : ''} darkColor={destructive ? theme.color.error : ''}>{label}</ThemedText>
                {detail ? (
                    <ThemedText style={styles.rowDetail} numberOfLines={1}>
                        {detail}
                    </ThemedText>
                ) : null}
            </View>
            <IconSymbol
                name="chevron-forward"
                size={18}
                color={theme.color.textTertiary}
            />
        </Pressable>
    );
}

export default function AccountScreen() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const { bottom } = useSafeAreaInsets();
    const styles = createThemedStyles(theme);

    // Bottom sheet refs
    const emailSheetRef = useRef<BottomSheetModal>(null);
    const passwordSheetRef = useRef<BottomSheetModal>(null);

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
            emailSheetRef.current?.dismiss();
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
            passwordSheetRef.current?.dismiss();
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
            Alert.alert(
                'Error',
                'New email must be different from your current email.'
            );
            return;
        }
        updateEmailMutation.mutate(newEmail.trim());
    };

    const handleUpdatePassword = () => {
        if (!currentPassword || !newPassword || !confirmPassword) return;
        if (newPassword.length < 6) {
            Alert.alert(
                'Error',
                'New password must be at least 6 characters.'
            );
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match.');
            return;
        }
        updatePasswordMutation.mutate({ currentPassword, newPassword });
    };

    const handleEmailSheetDismiss = useCallback(() => {
        setNewEmail('');
    }, []);

    const handlePasswordSheetDismiss = useCallback(() => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    }, []);

    const renderBackdrop = useCallback(
        (backdropProps: BottomSheetDefaultBackdropProps) => (
            <BottomSheetBackdrop
                {...backdropProps}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
            />
        ),
        []
    );

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

    const isEmailValid =
        newEmail.trim().length > 0 && newEmail !== user?.email;
    const isPasswordValid =
        currentPassword.length > 0 &&
        newPassword.length >= 6 &&
        newPassword === confirmPassword;

    return (
        <>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                contentInsetAdjustmentBehavior="automatic"
            >
                <View>
                    <AccountRow
                        icon="mail-outline"
                        label="Email Address"
                        detail={user?.email}
                        onPress={() => emailSheetRef.current?.present()}
                        styles={styles}
                        theme={theme}
                    />
                    <AccountRow
                        icon="lock-closed-outline"
                        label="Change Password"
                        onPress={() => passwordSheetRef.current?.present()}
                        styles={styles}
                        theme={theme}
                    />
                    <AccountRow
                        icon="trash-outline"
                        label="Delete Account"
                        onPress={handleDeleteAccountPress}
                        styles={styles}
                        theme={theme}
                        detail='Permanently delete your account'
                        destructive
                    />
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
                                This action is permanent and cannot be undone.
                                Type{' '}
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

            {/* Email Bottom Sheet */}
            <BottomSheetModal
                ref={emailSheetRef}
                enableDynamicSizing
                enablePanDownToClose
                onDismiss={handleEmailSheetDismiss}
                backgroundStyle={{ backgroundColor: theme.color.surface }}
                handleIndicatorStyle={{
                    backgroundColor: theme.color.textSecondary,
                }}
                backdropComponent={renderBackdrop}
                keyboardBehavior="extend"
                keyboardBlurBehavior="restore"
                android_keyboardInputMode="adjustResize"
            >
                <BottomSheetView
                    style={[
                        styles.sheetContent,
                        { paddingBottom: bottom + theme.space.lg },
                    ]}
                >
                    <ThemedText style={styles.sheetTitle}>
                        Update Email
                    </ThemedText>
                    <ThemedText style={styles.sheetDescription}>
                        Current email: {user?.email}
                    </ThemedText>

                    <View style={styles.sheetInputWrapper}>
                        <ThemedText style={styles.sheetLabel}>
                            New Email
                        </ThemedText>
                        <BottomSheetTextInput
                            style={[
                                styles.sheetInput,
                                {
                                    backgroundColor: theme.color.inputBg,
                                    borderColor: theme.color.inputBorder,
                                    color: theme.color.textPrimary,
                                },
                            ]}
                            value={newEmail}
                            onChangeText={setNewEmail}
                            placeholder="Enter new email"
                            placeholderTextColor={theme.color.placeholder}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoFocus
                        />
                    </View>

                    <ThemedButton
                        onPress={handleUpdateEmail}
                        disabled={!isEmailValid}
                        loading={updateEmailMutation.isPending}
                    >
                        Update Email
                    </ThemedButton>
                </BottomSheetView>
            </BottomSheetModal>

            {/* Password Bottom Sheet */}
            <BottomSheetModal
                ref={passwordSheetRef}
                enableDynamicSizing
                enablePanDownToClose
                onDismiss={handlePasswordSheetDismiss}
                backgroundStyle={{ backgroundColor: theme.color.surface }}
                handleIndicatorStyle={{
                    backgroundColor: theme.color.textSecondary,
                }}
                backdropComponent={renderBackdrop}
                keyboardBehavior="extend"
                keyboardBlurBehavior="restore"
                android_keyboardInputMode="adjustResize"
            >
                <BottomSheetView
                    style={[
                        styles.sheetContent,
                        { paddingBottom: bottom + theme.space.lg },
                    ]}
                >
                    <ThemedText style={styles.sheetTitle}>
                        Change Password
                    </ThemedText>

                    <View style={styles.sheetInputGroup}>
                        <View style={styles.sheetInputWrapper}>
                            <ThemedText style={styles.sheetLabel}>
                                Current Password
                            </ThemedText>
                            <BottomSheetTextInput
                                style={[
                                    styles.sheetInput,
                                    {
                                        backgroundColor: theme.color.inputBg,
                                        borderColor: theme.color.inputBorder,
                                        color: theme.color.textPrimary,
                                    },
                                ]}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder="Enter current password"
                                placeholderTextColor={theme.color.placeholder}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoFocus
                            />
                        </View>
                        <View style={styles.sheetInputWrapper}>
                            <ThemedText style={styles.sheetLabel}>
                                New Password
                            </ThemedText>
                            <BottomSheetTextInput
                                style={[
                                    styles.sheetInput,
                                    {
                                        backgroundColor: theme.color.inputBg,
                                        borderColor: theme.color.inputBorder,
                                        color: theme.color.textPrimary,
                                    },
                                ]}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="Enter new password"
                                placeholderTextColor={theme.color.placeholder}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                        <View style={styles.sheetInputWrapper}>
                            <ThemedText style={styles.sheetLabel}>
                                Confirm New Password
                            </ThemedText>
                            <BottomSheetTextInput
                                style={[
                                    styles.sheetInput,
                                    {
                                        backgroundColor: theme.color.inputBg,
                                        borderColor: theme.color.inputBorder,
                                        color: theme.color.textPrimary,
                                    },
                                ]}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Confirm new password"
                                placeholderTextColor={theme.color.placeholder}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                    </View>

                    <ThemedButton
                        onPress={handleUpdatePassword}
                        disabled={!isPasswordValid}
                        loading={updatePasswordMutation.isPending}
                    >
                        Update Password
                    </ThemedButton>
                </BottomSheetView>
            </BottomSheetModal>
        </>
    );
}

const createThemedStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
    StyleSheet.create({
        scrollContent: {
            paddingHorizontal: theme.space.xl,
            paddingVertical: theme.space.md,
            flexGrow: 1,
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: theme.space.md,
            paddingHorizontal: theme.space.xxs,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.color.border,
        },
        rowIcon: {
            marginRight: theme.space.sm,
        },
        rowContent: {
            flex: 1,
        },
        rowLabel: {
            fontSize: theme.font.size.md,
        },
        rowDetail: {
            fontSize: theme.font.size.sm,
            color: theme.color.textTertiary,
            marginTop: 2,
        },
        sectionTitle: {
            marginBottom: theme.space.sm,
        },
        sheetContent: {
            paddingHorizontal: theme.space.xl,
            paddingTop: theme.space.xs,
        },
        sheetTitle: {
            fontSize: theme.font.size.lg,
            fontWeight: theme.font.weight.bold as any,
            marginBottom: theme.space.xs,
        },
        sheetDescription: {
            fontSize: theme.font.size.sm,
            color: theme.color.textTertiary,
            marginBottom: theme.space.lg,
        },
        sheetLabel: {
            fontSize: theme.font.size.sm,
            fontWeight: theme.font.weight.semibold as any,
            marginBottom: theme.space.xs,
        },
        sheetInput: {
            height: 50,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.space.md,
            fontSize: theme.font.size.md,
            borderWidth: StyleSheet.hairlineWidth,
        },
        sheetInputWrapper: {
            marginBottom: theme.space.md,
        },
        sheetInputGroup: {
            marginBottom: theme.space.xs,
        },
    });
