import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, FirebaseAuthTypes } from '@react-native-firebase/auth';

// --- [1] 컨텍스트에서 제공할 데이터의 타입 정의 ---
// AuthContext가 어떤 종류의 데이터를 하위 컴포넌트들에게 전달할지 정의하는 인터페이스입니다.
// 여기서는 currentUser (로그인된 사용자 정보 객체 또는 null)와
// isLoading (인증 상태를 확인 중인지 나타내는 boolean 값)을 정의했습니다.
interface AuthContextType {
  currentUser: FirebaseAuthTypes.User | null;
  isLoading: boolean;
  // 추후 로그인/로그아웃 함수와 같은 인증 관련 함수들도 여기에 추가하여
  // 컨텍스트를 통해 제공할 수 있습니다.
}

// --- [2] React 컨텍스트 생성 ---
// createContext 함수를 사용하여 새로운 컨텍스트 객체(AuthContext)를 만듭니다.
// 이 컨텍스트 객체는 Provider와 Consumer를 가집니다.
// Provider는 "데이터를 제공하는 역할"을 하고, Consumer(또는 useContext 훅)는 "데이터를 사용하는 역할"을 합니다.
// 초기값으로 undefined를 주었고, 이는 useAuth 훅에서 AuthProvider 외부에서 사용되는 것을 방지하기 위함입니다.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- [3] AuthProvider 컴포넌트의 props 타입 정의 ---
// AuthProvider 컴포넌트가 받을 props의 타입을 정의합니다.
// children은 React 컴포넌트가 다른 React 컴포넌트들을 감쌀 때 사용되는 특별한 prop입니다.
// AuthProvider로 감싸진 모든 자식 요소들이 여기에 해당됩니다.
interface AuthProviderProps {
  children: ReactNode; // ReactNode는 React 컴포넌트, JSX, 문자열 등 렌더링 가능한 모든 것을 의미합니다.
}

// --- [4] AuthProvider 컴포넌트 구현 ---
// AuthProvider는 앱 전체 또는 특정 부분에 인증 관련 상태(currentUser, isLoading)를 "제공"하는 역할을 합니다.
// 이 컴포넌트로 감싸진 모든 하위 컴포넌트들은 useAuth 훅을 통해 이 상태 값들에 접근할 수 있게 됩니다.
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // --- [4a] 인증 상태 관리 ---
  // currentUser: 현재 로그인된 Firebase 사용자 객체를 저장하거나, 로그인되지 않았다면 null을 저장합니다.
  const [currentUser, setCurrentUser] = useState<FirebaseAuthTypes.User | null>(null);
  // isLoading: 앱이 시작될 때 Firebase로부터 현재 인증 상태를 가져오는 동안 true로 설정됩니다.
  // 상태 확인이 완료되면 false로 변경됩니다. 이는 로딩 화면 표시에 사용됩니다.
  const [isLoading, setIsLoading] = useState(true);

  // --- [4b] Firebase 인증 상태 리스너 설정 ---
  // useEffect 훅은 컴포넌트가 렌더링된 후 특정 작업을 수행하도록 합니다.
  // 여기서는 Firebase의 onAuthStateChanged 리스너를 설정하여,
  // 사용자의 로그인 또는 로그아웃 상태가 변경될 때마다 콜백 함수가 실행되도록 합니다.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), user => {
      setCurrentUser(user);
      if (isLoading) {
        setIsLoading(false);
      }
    });
    return unsubscribe;
  }, [isLoading]);

  // --- [4c] 컨텍스트 Provider를 통해 상태 값 제공 ---
  // AuthContext.Provider는 value prop을 통해 하위 컴포넌트들에게 currentUser와 isLoading 값을 전달합니다.
  // children은 AuthProvider로 감싸진 모든 자식 컴포넌트들을 의미합니다.
  // 따라서 <AuthProvider><App /></AuthProvider> 와 같이 사용하면 App 컴포넌트 및 그 하위 모든 컴포넌트들이
  // AuthContext의 값들에 접근할 수 있게 됩니다.
  return (
    <AuthContext.Provider value={{ currentUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- [5] useAuth 커스텀 훅 ---
// useAuth 훅은 하위 컴포넌트에서 AuthContext의 값(currentUser, isLoading)을 쉽게 가져와 사용할 수 있도록 도와줍니다.
// useContext(AuthContext)를 호출하여 현재 컨텍스트 값을 가져옵니다.
// 만약 컨텍스트 값이 undefined라면 (즉, AuthProvider 외부에서 useAuth가 호출되었다면), 오류를 발생시켜 잘못된 사용을 방지합니다.
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 