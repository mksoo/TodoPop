import React, { useCallback, FC, useState, useEffect } from 'react';
import { Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Platform, SafeAreaView, View } from 'react-native';
import { MainStackScreenProps } from '@/navigation/navigation';
import { colors, spacing, fontSize, borderRadius } from '../styles';
import DateTimePicker, { DateTimePickerEvent, DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { useAddScheduleEntry } from '@/hooks/useScheduleEntryMutations';
import ScreenHeader from '@/components/ScreenHeader';
import SvgIcon from '@/components/common/SvgIcon';
import { useForm, Controller } from 'react-hook-form';
import firestore from '@react-native-firebase/firestore';

type Props = MainStackScreenProps<"ScheduleEntryAdd">;

type FormValues = {
  title: string;
  startAt?: Date;
  endAt?: Date;
};

const ScheduleEntryAddScreen: FC<Props> = ({ navigation }) => {
  const { mutate: addScheduleEntry, isPending: isAdding } = useAddScheduleEntry();

  const { control, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: { title: '', startAt: undefined, endAt: undefined },
  });

  const [pickerMode, setPickerMode] = useState<'start' | 'end' | null>(null);
  const [dateOrTime, setDateOrTime] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const startAt = watch('startAt');
  const endAt = watch('endAt');

  useEffect(() => {
    if (pickerMode && Platform.OS === 'android') {
      if (dateOrTime === 'date') {
        DateTimePickerAndroid.open({
          value: pickerMode === 'start' && startAt ? startAt : endAt || new Date(),
          onChange: (event, selectedDate) => {
            if (event.type === 'set' && selectedDate) {
              setTempDate(selectedDate);
              setDateOrTime('time');
            } else {
              setPickerMode(null);
              setDateOrTime('date');
              setTempDate(null);
            }
          },
          display: 'spinner',
          mode: 'date',
        });
      } else if (dateOrTime === 'time' && tempDate) {
        DateTimePickerAndroid.open({
          value: tempDate,
          onChange: (event, selectedTime) => {
            if (event.type === 'set' && selectedTime) {
              const finalDate = new Date(
                tempDate.getFullYear(),
                tempDate.getMonth(),
                tempDate.getDate(),
                selectedTime.getHours(),
                selectedTime.getMinutes()
              );
              setValue(pickerMode === 'start' ? 'startAt' : 'endAt', finalDate);
            }
            setPickerMode(null);
            setDateOrTime('date');
            setTempDate(null);
          },
          display: 'spinner',
          mode: 'time',
        });
      }
    }
  }, [pickerMode, dateOrTime, tempDate]);

  const onSubmit = useCallback((data: FormValues) => {
    addScheduleEntry({
      data: {
        title: data.title,
        type: "EVENT",
        startAt: data.startAt ? firestore.Timestamp.fromDate(data.startAt) : firestore.Timestamp.fromDate(dayjs().toDate()),
        endAt: data.endAt ? firestore.Timestamp.fromDate(data.endAt) : firestore.Timestamp.fromDate(dayjs().add(1, 'hour').toDate()),
      }
    }, {
      onSuccess: () => {
        navigation.goBack();
        reset();
      }
    });
  }, [addScheduleEntry, navigation, reset]);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader 
      left={
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <SvgIcon name="alphabet-x" color={colors.grayscale[100]} size={24} />
        </TouchableOpacity>
      }
      title="일정 추가"
      right={
        <TouchableOpacity onPress={handleSubmit(onSubmit)} disabled={isAdding}>
          <SvgIcon name="check" color={isAdding ? colors.text.disabled : colors.grayscale[100]} size={32} />
        </TouchableOpacity>
      }
      titleStyle={{
        color: colors.grayscale[100],
      }}
      containerStyle={{
        backgroundColor: colors.primary,
      }}
       />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.label}>제목</Text>
        <Controller
          control={control}
          name="title"
          rules={{ required: true }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={onChange}
              placeholder="일정 제목"
              placeholderTextColor={colors.text.secondary}
            />
          )}
        />

        <View style={styles.rowContainer}>
          <View style={styles.dateTimeColumn}>
            <Text style={styles.label}>시작</Text>
            <Controller
              control={control}
              name="startAt"
              render={({ field: { value } }) => (
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => {
                    if (Platform.OS === 'android') {
                      setPickerMode('start');
                      setDateOrTime('date');
                      setTempDate(null);
                    } else {
                      setPickerMode('start');
                      setShowDatePicker(true);
                    }
                  }}
                >
                  <Text style={styles.dateTimeText}>
                    {value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '시작 날짜/시간'}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
          <View style={styles.dateTimeColumn}>
            <Text style={styles.label}>종료</Text>
            <Controller
              control={control}
              name="endAt"
              render={({ field: { value } }) => (
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => {
                    if (Platform.OS === 'android') {
                      setPickerMode('end');
                      setDateOrTime('date');
                      setTempDate(null);
                    } else {
                      setPickerMode('end');
                      setShowDatePicker(true);
                    }
                  }}
                >
                  <Text style={styles.dateTimeText}>
                    {value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '종료 날짜/시간'}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
        {showDatePicker && Platform.OS === 'ios' && (
          <DateTimePicker
            value={pickerMode === 'end' && endAt ? endAt : startAt || new Date()}
            mode="datetime"
            onChange={(event, selectedDate) => {
              if (selectedDate) {
                setValue(pickerMode === 'start' ? 'startAt' : 'endAt', selectedDate);
              }
              setShowDatePicker(false);
              setPickerMode(null);
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
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
    backgroundColor: colors.background.primary,
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
    borderBottomWidth: 1,
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
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: 12,
  },
  dateTimeColumn: {
    flex: 1,
  },
  dateTimeButton: {
    backgroundColor: colors.background.secondary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    marginTop: 4,
  },
  dateTimeText: {
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
});

export default ScheduleEntryAddScreen; 