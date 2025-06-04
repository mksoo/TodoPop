import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, FlatList, Button, TextInput, StyleSheet, Alert } from 'react-native';
import { Todo, RepeatSettings } from '../types/todo.types';
import { useGetTodos } from '../hooks/useTodosQueries';
import { useAddTodo } from '../hooks/useTodosMutations';
import TodoItem from '../components/TodoItem';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/AppNavigator';
import { shouldShowTodo } from '../utils/repeatUtils';
import { Timestamp } from '@react-native-firebase/firestore';
import { colors, spacing, fontSize, borderRadius } from '../styles';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const TodoListScreen: React.FC = () => {
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList, 'TodoList'>>();

  const { data: todos, isLoading, isError, error } = useGetTodos();
  const { mutate: addTodoMutate } = useAddTodo();

  const handleLogout = useCallback(async () => {
    try {
      await GoogleSignin.signOut();
      await auth().signOut();
    } catch (e: any) {
      Alert.alert('로그아웃 오류', e.message || '알 수 없는 오류가 발생했습니다.');
      console.error('Logout error:', e);
    }
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button onPress={handleLogout} title="로그아웃" color={colors.danger} />
      ),
    });
  }, [navigation, handleLogout]);

  const handleAdd = useCallback(() => {
    if (!newTodoTitle.trim()) return;
    addTodoMutate({ 
      title: newTodoTitle, 
      nextOccurrence: Timestamp.now(),
    });
    setNewTodoTitle('');
  }, [newTodoTitle, addTodoMutate]);
  
  const visibleTodos = useMemo(() => {
    if (!todos) return [];
    return todos.filter(todo => shouldShowTodo({
      status: todo.status,
      nextOccurrence: todo.nextOccurrence,
      repeatSettings: todo.repeatSettings,
    }));
  }, [todos]);

  const renderItem = useCallback(({ item }: { item: Todo }) => {
    return (
      <TodoItem item={item} />
    );
  }, []);

  if (isLoading) return <Text style={styles.loadingText}>로딩 중...</Text>;
  if (isError || error) return <Text style={styles.errorText}>오류: {error?.message || '알 수 없는 오류'}</Text>;

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="새로운 할 일 입력..."
          value={newTodoTitle}
          onChangeText={setNewTodoTitle}
          onSubmitEditing={handleAdd}
          placeholderTextColor={colors.text.secondary}
        />
        <Button title="추가" onPress={handleAdd} color={colors.primary} />
      </View>
      <FlatList
        data={visibleTodos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContentContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.primary,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontSize: fontSize.md,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: fontSize.lg,
    color: colors.text.secondary,
    padding: spacing.lg,
  },
  listContentContainer: {
    paddingBottom: spacing.md,
  }
});

export default TodoListScreen; 