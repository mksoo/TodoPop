// --- 네비게이션 스택별 파라미터 타입 정의 --- 

import { NativeStackScreenProps } from "@react-navigation/native-stack";

// MainStack (로그인 후 사용되는 주요 기능 화면들)의 각 화면이 받을 수 있는 파라미터를 정의합니다.
export type MainStackParamList = {
  TodoList: undefined; // TodoList 화면은 파라미터를 받지 않습니다.
  TodoEdit: { todoId: string }; // TodoEdit 화면은 todoId 문자열을 파라미터로 받습니다.
  Calendar: undefined; // Calendar 화면은 파라미터를 받지 않습니다.
  ScheduleEntryAdd: undefined; // ScheduleEntryAdd 화면은 파라미터를 받지 않습니다.
};

// AuthStack (로그인 전 사용되는 인증 관련 화면들)의 각 화면이 받을 수 있는 파라미터를 정의합니다.
export type AuthStackParamList = {
  Login: undefined; // Login 화면은 파라미터를 받지 않습니다.
};

export type MainStackScreenProps<T extends keyof MainStackParamList> = NativeStackScreenProps<MainStackParamList, T>;