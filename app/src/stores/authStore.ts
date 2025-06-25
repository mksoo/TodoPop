import { User } from "@/types/user.types";
import { create } from "zustand";

interface CurrentUser extends User {
  signInMethod: 'google' | 'email';
}

interface AuthState {
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser | null) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

// 유저유저
const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  setCurrentUser: user => set({ currentUser: user }),
  isLoading: true,
  setIsLoading: isLoading => set({ isLoading })
}));

export default useAuthStore;