import { create } from 'zustand';

interface UIState {
  // Toast/notification state
  toast: {
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  };
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;

  // Bottom sheet state
  bottomSheet: {
    visible: boolean;
    content: React.ReactNode | null;
  };
  showBottomSheet: (content: React.ReactNode) => void;
  hideBottomSheet: () => void;

  // Loading overlay
  isGlobalLoading: boolean;
  setGlobalLoading: (isLoading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Toast state
  toast: {
    visible: false,
    message: '',
    type: 'info',
  },
  showToast: (message, type = 'info') =>
    set({
      toast: {
        visible: true,
        message,
        type,
      },
    }),
  hideToast: () =>
    set({
      toast: {
        visible: false,
        message: '',
        type: 'info',
      },
    }),

  // Bottom sheet state
  bottomSheet: {
    visible: false,
    content: null,
  },
  showBottomSheet: (content) =>
    set({
      bottomSheet: {
        visible: true,
        content,
      },
    }),
  hideBottomSheet: () =>
    set({
      bottomSheet: {
        visible: false,
        content: null,
      },
    }),

  // Global loading
  isGlobalLoading: false,
  setGlobalLoading: (isLoading) => set({ isGlobalLoading: isLoading }),
}));
