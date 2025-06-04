import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Switch, TouchableOpacity, Platform } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/AppNavigator';
import { useGetTodoById } from '../hooks/useTodosQueries';
import { useUpdateTodo } from '../hooks/useTodosMutations';
import { Todo, RepeatSettings, RepeatFrequency } from '../types/todo.types';
import { colors, spacing, fontSize, borderRadius } from '../styles';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import dayjs from 'dayjs';

type TodoEditScreenRouteProp = RouteProp<MainStackParamList, 'TodoEdit'>;

const frequencies: RepeatFrequency[] = ['daily', 'weekly', 'monthly'];
const daysInWeek = ['일', '월', '화', '수', '목', '금', '토'];

const TodoEditScreen: React.FC = () => {
  const route = useRoute<TodoEditScreenRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { todoId } = route.params;

  const { data: todo, isLoading, isError, error } = useGetTodoById({ id: todoId });
  const { mutate: updateTodo, isPending: isUpdating } = useUpdateTodo();

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isRepeatEnabled, setIsRepeatEnabled] = useState(false);
  const [repeatSettings, setRepeatSettings] = useState<RepeatSettings | undefined>(undefined);

  useEffect(() => {
    if (todo) {
      setTitle(todo.title || '');
      setDueDate(todo.dueDate?.toDate());
      setIsRepeatEnabled(!!todo.repeatSettings);
      setRepeatSettings(todo.repeatSettings);
    }
  }, [todo]);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || dueDate;
    setShowDatePicker(Platform.OS === 'ios');
    if (currentDate) {
      setDueDate(currentDate);
    }
  };

  const handleSave = useCallback(() => {
    if (!todo) return;

    const updates: Partial<Omit<Todo, 'id' | 'createdAt' | 'status'>> & { dueDate?: FirebaseFirestoreTypes.Timestamp | undefined } = {
      title,
      dueDate: dueDate ? firestore.Timestamp.fromDate(dueDate) : undefined,
    };

    if (isRepeatEnabled && repeatSettings) {
      updates.repeatSettings = repeatSettings;
    } else {
      updates.repeatSettings = undefined;
    }
    
    updateTodo({ id: todoId, updates }, {
      onSuccess: () => {
        navigation.goBack();
      }
    });
  }, [todo, todoId, title, dueDate, isRepeatEnabled, repeatSettings, updateTodo, navigation]);

  const updateRepeatSetting = <K extends keyof RepeatSettings>(key: K, value: RepeatSettings[K]) => {
    setRepeatSettings(prev => ({
      ...(prev || { frequency: 'daily', interval: 1 }),
      [key]: value,
    }));
  };

  if (isLoading) return <View style={styles.container}><Text>Loading...</Text></View>;
  if (isError) return <View style={styles.container}><Text>Error loading todo: {error?.message}</Text></View>;
  if (!todo) return <View style={styles.container}><Text>Todo not found.</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.label}>제목</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="할 일 제목"
        placeholderTextColor={colors.text.secondary}
      />

      <Text style={styles.label}>마감일</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateDisplay}>
        <Text style={styles.dateText}>{dueDate ? dayjs(dueDate).format('YYYY-MM-DD') : '날짜 선택'}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
      <TouchableOpacity 
        style={styles.secondaryButton} 
        onPress={() => setDueDate(undefined)}
      >
        <Text style={styles.secondaryButtonText}>
          {dueDate ? "마감일 초기화" : "마감일 설정 안 함"}
        </Text>
      </TouchableOpacity>

      <View style={styles.switchContainer}>
        <Text style={styles.label}>반복 설정</Text>
        <Switch
          trackColor={{ false: colors.border.default, true: colors.primary }}
          thumbColor={isRepeatEnabled ? colors.background.primary : colors.background.secondary}
          ios_backgroundColor={colors.border.default}
          onValueChange={setIsRepeatEnabled}
          value={isRepeatEnabled}
        />
      </View>

      {isRepeatEnabled && (
        <View style={styles.repeatSettingsContainer}>
          <Text style={styles.label}>반복 주기</Text>
          <View style={styles.optionsContainer}>
            {frequencies.map(freq => (
              <TouchableOpacity
                key={freq}
                style={[
                  styles.optionButton,
                  repeatSettings?.frequency === freq && styles.optionButtonSelected
                ]}
                onPress={() => updateRepeatSetting('frequency', freq)}
              >
                <Text style={[
                    styles.optionButtonText,
                    repeatSettings?.frequency === freq && styles.optionButtonTextSelected
                ]}>{freq === 'daily' ? '매일' : freq === 'weekly' ? '매주' : '매월'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>간격 (며칠/몇 주/몇 달 마다)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={repeatSettings?.interval?.toString() || '1'}
            onChangeText={(text) => {
                const num = parseInt(text);
                if (isNaN(num) && text !== '') return;
                updateRepeatSetting('interval', isNaN(num) ? 1 : Math.max(1, num));
            }}
            placeholder="1"
          />

          {repeatSettings?.frequency === 'weekly' && (
            <View>
              <Text style={styles.label}>요일 선택</Text>
              <View style={styles.optionsContainer}>
                {daysInWeek.map((dayName, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      repeatSettings?.daysOfWeek?.includes(index) && styles.optionButtonSelected
                    ]}
                    onPress={() => {
                      const currentDays = repeatSettings?.daysOfWeek || [];
                      const newDays = currentDays.includes(index) 
                        ? currentDays.filter(d => d !== index)
                        : [...currentDays, index].sort((a,b)=>a-b);
                      updateRepeatSetting('daysOfWeek', newDays);
                    }}
                  >
                    <Text style={[
                        styles.optionButtonText,
                        repeatSettings?.daysOfWeek?.includes(index) && styles.optionButtonTextSelected
                    ]}>{dayName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          {/* 월간 반복 시 날짜 선택 UI는 일단 생략 */}
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.saveButton, isUpdating && styles.saveButtonDisabled]} 
          onPress={handleSave} 
          disabled={isUpdating}
        >
          <Text style={styles.saveButtonText}>
            {isUpdating ? "저장 중..." : "저장"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  label: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.background.secondary,
    color: colors.text.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm + 2 : spacing.sm,
    borderRadius: borderRadius.sm,
    fontSize: fontSize.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.md,
  },
  dateDisplay: {
    backgroundColor: colors.background.secondary,
    padding: spacing.sm + 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.xs,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  secondaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  secondaryButtonText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.light,
  },
  repeatSettingsContainer: {
    paddingVertical: spacing.md,
    borderBottomWidth:1,
    borderColor: colors.border.light,
    marginBottom: spacing.lg,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  optionButton: {
    backgroundColor: colors.background.secondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  optionButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionButtonText: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
  },
  optionButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  saveButtonDisabled: {
    backgroundColor: colors.text.disabled,
    elevation: 0,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: 'bold',
  },
});

export default TodoEditScreen; 