import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TodoListScreen from '../screens/TodoListScreen'; // 경로 수정
import TodoEditScreen from '../screens/TodoEditScreen'; // TodoEditScreen import

export type RootStackParamList = {
  TodoList: undefined;
  TodoEdit: { todoId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="TodoList">
      <Stack.Screen 
        name="TodoList" 
        component={TodoListScreen} 
        options={{ title: '나의 할 일' }}
      />
      <Stack.Screen 
        name="TodoEdit" 
        component={TodoEditScreen} 
        options={{ title: '할 일 수정' }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator; 