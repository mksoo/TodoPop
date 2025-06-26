import React, { FC, useEffect, useState } from 'react';
import { Text, TextInput, ScrollView, TouchableOpacity, Platform, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Controller, UseFormReturn } from 'react-hook-form';
import dayjs from 'dayjs';
import { colors, spacing, borderRadius } from '../styles';

export type FormValues = {
  title: string;
  startAt?: Date;
  endAt?: Date;
  description?: string;
};

export const useScheduleEntryFormSection = (form: UseFormReturn<FormValues>) => {
  const [pickerMode, setPickerMode] = useState<'start' | 'end' | null>(null);
  const [dateOrTime, setDateOrTime] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isAllDay, setIsAllDay] = useState(false);
  const startAt = form.watch('startAt');
  const endAt = form.watch('endAt');

  useEffect(() => {
    if (pickerMode && Platform.OS === 'android') {
      if (dateOrTime === 'date') {
        DateTimePickerAndroid.open({
          value: pickerMode === 'start' && startAt ? startAt : endAt || new Date(),
          onChange: (event, selectedDate) => {
            if (event.type === 'set' && selectedDate) {
              setTempDate(selectedDate);
              setDateOrTime('time');
              setIsAllDay(false);
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
              form.setValue(pickerMode === 'start' ? 'startAt' : 'endAt', finalDate);
              setIsAllDay(false);
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
  }, [pickerMode, dateOrTime, tempDate, startAt, endAt, form]);

  return {
    pickerMode, setPickerMode,
    dateOrTime, setDateOrTime,
    tempDate, setTempDate,
    showDatePicker, setShowDatePicker,
    isAllDay, setIsAllDay,
    startAt, endAt
  };
}

interface ScheduleEntryFormSectionProps {
  form: UseFormReturn<FormValues>;
  pickerMode: 'start' | 'end' | null;
  setPickerMode: (v: 'start' | 'end' | null) => void;
  showDatePicker: boolean;
  setShowDatePicker: (v: boolean) => void;
  isAllDay: boolean;
  setIsAllDay: (v: boolean) => void;
  dateOrTime: 'date' | 'time';
  setDateOrTime: (v: 'date' | 'time') => void;
  tempDate: Date | null;
  setTempDate: (v: Date | null) => void;
  startAt?: Date;
  endAt?: Date;
  styles: any;
}

export const ScheduleEntryFormSection: FC<ScheduleEntryFormSectionProps> = ({
  form, pickerMode, setPickerMode, showDatePicker, setShowDatePicker, isAllDay, setIsAllDay, dateOrTime, setDateOrTime, tempDate, setTempDate, startAt, endAt, styles
}) => (
  <ScrollView contentContainerStyle={styles.contentContainer}>
    <Text style={styles.label}>제목</Text>
    <Controller
      control={form.control}
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
          control={form.control}
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
          control={form.control}
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
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
      <TouchableOpacity
        style={[
          { 
            paddingVertical: spacing.sm, 
            paddingHorizontal: spacing.md, 
            borderRadius: borderRadius.sm, 
            borderWidth: 1, 
            borderColor: isAllDay ? colors.primary : colors.border.default, 
            backgroundColor: isAllDay ? colors.primary : colors.background.secondary,
            marginRight: 8,
          }
        ]}
        onPress={() => {
          let baseDate = startAt ? dayjs(startAt) : dayjs();
          form.setValue('startAt', baseDate.startOf('day').toDate());
          form.setValue('endAt', baseDate.add(1, 'day').startOf('day').toDate());
          setIsAllDay(true);
        }}
      >
        <Text style={{ color: isAllDay ? colors.grayscale[100] : colors.text.primary, fontWeight: 'bold' }}>종일</Text>
      </TouchableOpacity>
    </View>
    <Text style={styles.label}>설명</Text>
    <Controller
      control={form.control}
      name="description"
      render={({ field: { onChange, value } }) => (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder="설명"
          placeholderTextColor={colors.text.secondary}
        />
      )}
    />
    {showDatePicker && Platform.OS === 'ios' && (
      <DateTimePicker
        value={pickerMode === 'end' && endAt ? endAt : startAt || new Date()}
        mode="datetime"
        onChange={(event, selectedDate) => {
          if (selectedDate) {
            form.setValue(pickerMode === 'start' ? 'startAt' : 'endAt', selectedDate);
            setIsAllDay(false);
          }
          setShowDatePicker(false);
          setPickerMode(null);
        }}
      />
    )}
  </ScrollView>
); 