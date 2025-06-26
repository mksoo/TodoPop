import React, { useState, useCallback, FC } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Switch, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList, MainStackScreenProps } from '@/navigation/navigation';
import { RepeatSettings, RepeatFrequency } from '../types/todo.types';
import { colors, spacing, fontSize, borderRadius } from '../styles';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import Badge from '../components/Badge';
import { useAddScheduleEntry } from '@/hooks/useScheduleEntryMutations';

const frequencies: RepeatFrequency[] = ['daily', 'weekly', 'monthly'];
const daysInWeek = ['일', '월', '화', '수', '목', '금', '토'];

type Props = MainStackScreenProps<"ScheduleEntryAdd">;

const ScheduleEntryAddScreen: FC<Props> = ({ navigation }) => {

  const { mutate: addScheduleEntry, isPending: isAdding } = useAddScheduleEntry();

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isRepeatEnabled, setIsRepeatEnabled] = useState(false);
  const [repeatSettings, setRepeatSettings] = useState<RepeatSettings | undefined>(undefined);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || dueDate;
    setShowDatePicker(Platform.OS === 'ios');
    if (currentDate) {
      setDueDate(currentDate);
    }
  };

  const handleSave = useCallback(() => {
    addScheduleEntry({ data: { title, } }, {
      onSuccess: () => {
        navigation.goBack();
      }
    });
  }, [title, dueDate, isRepeatEnabled, repeatSettings, addScheduleEntry, navigation]);

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

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.saveButton, isAdding && styles.saveButtonDisabled]} 
          onPress={handleSave} 
          disabled={isAdding}
        >
          <Text style={styles.saveButtonText}>
            {isAdding ? "저장 중..." : "저장"}
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
    color: colors.grayscale[100],
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
    shadowColor: colors.grayscale[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  saveButtonDisabled: {
    backgroundColor: colors.text.disabled,
    elevation: 0,
  },
  saveButtonText: {
    color: colors.grayscale[100],
    fontSize: fontSize.md,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
});

export default ScheduleEntryAddScreen; 