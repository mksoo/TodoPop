import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TodoListScreen from '../screens/TodoListScreen'; // 경로 수정
import TodoEditScreen from '../screens/TodoEditScreen'; // TodoEditScreen import
import LoginScreen from '../screens/LoginScreen'; // LoginScreen import
import { FirebaseAuthTypes } from '@react-native-firebase/auth'; // Firebase auth types import
import { ActivityIndicator, View, StyleSheet } from 'react-native'; // 로딩 인디케이터

// 앱의 주요 기능 스택 (로그인 후)
export type MainStackParamList = {
  TodoList: undefined;
  TodoEdit: { todoId: string };
};

// 인증 관련 스택 (로그인 전)
export type AuthStackParamList = {
  Login: undefined;
};

const MainStack = createNativeStackNavigator<MainStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

interface AppNavigatorProps {
  currentUser: FirebaseAuthTypes.User | null;
  isLoading: boolean;
}

const AppNavigator: React.FC<AppNavigatorProps> = ({ currentUser, isLoading }) => {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return currentUser ? (
    <MainStack.Navigator initialRouteName="TodoList">
      <MainStack.Screen 
        name="TodoList" 
        component={TodoListScreen} 
        options={{ title: '나의 할 일' }}
      />
      <MainStack.Screen 
        name="TodoEdit" 
        component={TodoEditScreen} 
        options={{ title: '할 일 수정' }}
      />
    </MainStack.Navigator>
  ) : (
    <AuthStack.Navigator>
      <AuthStack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }} // 로그인 화면은 헤더 숨김
      />
    </AuthStack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator; 