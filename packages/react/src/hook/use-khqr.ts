import { create } from "zustand";

interface KhqrDialogStore {
  isOpen: boolean;
  sessionTime: number;
  expired: boolean;
  title: string;
  description: string;
  setIsOpen: (isOpen: boolean) => void;
  setSessionTime: (sessionTime: number) => void;
  setExpired: (expired: boolean) => void;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const useKhqr = create<KhqrDialogStore>()((set) => ({
  sessionTime: 180,
  expired: false, 
  isOpen: false,
  title: "",
  description: "",
  setIsOpen: (isOpen) => set({ isOpen }),
  setSessionTime: (sessionTime) => set({ sessionTime }),
  setTitle: (title) => set({ title }),
  setExpired: (expired) => set({ expired }),
  setDescription: (description) => set({ description }),
  onConfirm: () => set({ isOpen: false }),
  onCancel: () => set({ isOpen: false }),
}));

export { useKhqr };