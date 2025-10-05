import { create } from "zustand";

export type TransactionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "expired"
  | "cancelled"
  | "idle";

interface KhqrDialogStore {
  isOpen: boolean;
  sessionTime: number;
  expired: boolean;
  title: string;
  description: string;
  // Transaction-related state
  transactionHash: string | null;
  transactionStatus: TransactionStatus;
  qrstring: string;
  md5: string;
  amount: number;
  merchantName: string;
  // Setters
  setIsOpen: (isOpen: boolean) => void;
  setSessionTime: (sessionTime: number) => void;
  setExpired: (expired: boolean) => void;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setTransactionHash: (hash: string | null) => void;
  setTransactionStatus: (status: TransactionStatus) => void;
  setQrstring: (qrstring: string) => void;
  setMd5: (md5: string) => void;
  setAmount: (amount: number) => void;
  setMerchantName: (merchantName: string) => void;
  // Actions
  resetTransaction: () => void;
}

export const useKhqr = create<KhqrDialogStore>()((set, get) => ({
  sessionTime: 180,
  expired: false,
  isOpen: false,
  title: "",
  description: "",
  transactionHash: null,
  transactionStatus: "idle",
  qrstring: "",
  md5: "",
  amount: 0,
  merchantName: "",
  setIsOpen: (isOpen) => set({ isOpen }),
  setSessionTime: (sessionTime) => set({ sessionTime }),
  setTitle: (title) => set({ title }),
  setExpired: (expired) => set({ expired }),
  setDescription: (description) => set({ description }),
  setTransactionHash: (transactionHash) => set({ transactionHash }),
  setTransactionStatus: (transactionStatus) => set({ transactionStatus }),
  setQrstring: (qrstring) => set({ qrstring }),
  setMd5: (md5) => set({ md5 }),
  setAmount: (amount) => set({ amount }),
  setMerchantName: (merchantName) => set({ merchantName }),
  resetTransaction: () =>
    set({
      transactionHash: null,
      transactionStatus: "idle",
      qrstring: "",
      md5: "",
      expired: false,
      sessionTime: 180,
    }),
}));
