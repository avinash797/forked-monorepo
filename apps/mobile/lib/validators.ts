export const validateEmail = (email: string): string | null => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Invalid email format';
    return null;
};

export const validatePassword = (password: string): string | null => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return null;
};

export const validateDisplayName = (name: string): string | null => {
    if (!name) return 'Display name is required';
    if (name.length < 2) return 'Display name must be at least 2 characters';
    if (name.length > 50) return 'Display name must be less than 50 characters';
    return null;
};

export const validateUsername = (username: string): string | null => {
    if (!username) return null; // Optional field
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (username.length > 30) return 'Username must be less than 30 characters';
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username))
        return 'Username can only contain letters, numbers, and underscores';
    return null;
};
