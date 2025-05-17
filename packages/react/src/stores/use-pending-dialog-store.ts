import { create } from "zustand";

interface PendingDialogStore {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const usePendingDialogStore = create<PendingDialogStore>()((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
  title: "",
  setTitle: (title) => set({ title }),
  description: "",
  setDescription: (description) => set({ description }),
  onConfirm: () => set({ isOpen: false }),
  onCancel: () => set({ isOpen: false }),
}));