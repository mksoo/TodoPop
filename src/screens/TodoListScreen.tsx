import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, FlatList, Button, TextInput, StyleSheet, Alert, Image, TouchableOpacity, ActivityIndicator, SectionList } from 'react-native';
import { Todo, RepeatSettings } from '../types/todo.types';
import { useGetTodos } from '../hooks/useTodosQueries';
import { useAddTodo } from '../hooks/useTodosMutations';
import TodoItem from '../components/TodoItem';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/AppNavigator';
import { Timestamp } from '@react-native-firebase/firestore';
import { colors, spacing, fontSize, borderRadius } from '../styles';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useAuth } from '../contexts/AuthContext';

const TodoListScreen: React.FC = () => {
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList, 'TodoList'>>();

  const { currentUser } = useAuth();

  const { data: todos, isLoading: isTodosLoading, isError: todosError, error } = useGetTodos({uid: currentUser?.uid ?? ''});
  const { mutateAsync: addTodoMutate } = useAddTodo({uid: currentUser?.uid ?? ''});

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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {currentUser?.photoURL && (
            <Image 
              source={{ uri: currentUser.photoURL }}
              style={styles.userPhoto} 
            />
          )}
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: spacing.md }}>
            <Text style={{ color: colors.primary }}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, handleLogout, currentUser]);

  const handleAdd = useCallback(() => {
    if (!newTodoTitle.trim()) return;
    addTodoMutate({ 
      title: newTodoTitle, 
      nextOccurrence: Timestamp.now(),
    });
    setNewTodoTitle('');
  }, [newTodoTitle, addTodoMutate]);

  const renderItem = useCallback(({ item }: { item: Todo }) => {
    return (
      <TodoItem item={item} />
    );
  }, []);

  if (isTodosLoading) return <Text style={styles.loadingText}>로딩 중...</Text>;
  if (todosError || error) return <Text style={[styles.errorText, {color: colors.danger}]}>할 일 목록을 불러오는 중 오류가 발생했습니다: {error?.message || '알 수 없는 오류'}</Text>;

  const ongoingTodos = todos?.filter(todo => todo.status === 'ONGOING') || [];
  const completedTodos = todos?.filter(todo => todo.status === 'COMPLETED') || [];
  const failedTodos = todos?.filter(todo => todo.status === 'FAILED') || [];

  const sections = [
    {
      title: '진행중',
      data: ongoingTodos,
      emptyText: '할 일이 없습니다.',
    },
    {
      title: '완료됨',
      data: completedTodos,
      emptyText: '완료된 할 일이 없습니다.',
    },
    {
      title: '실패',
      data: failedTodos,
      emptyText: '실패한 할 일이 없습니다.',
    },
  ];

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
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item }) => <TodoItem item={item} />}
        renderSectionFooter={({ section }) =>
          section.data.length === 0 ? (
            <Text style={styles.emptyText}>{section.emptyText}</Text>
          ) : null
        }
        contentContainerStyle={styles.listContentContainer}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background.primary,
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
    padding: spacing.md,
    textAlign: 'center',
    fontSize: 16,
  },
  loadingText: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 18,
    color: colors.text.secondary,
  },
  listContentContainer: {
    paddingBottom: spacing.md,
  },
  welcomeContainer: {
    padding: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.text.primary,
  },
  userPhoto: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: fontSize.md,
    marginBottom: spacing.md,
    marginLeft: spacing.sm,
  },
});

export default TodoListScreen; 