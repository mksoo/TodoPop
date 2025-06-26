import React, { useCallback, FC, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Platform, SafeAreaView, Alert } from 'react-native';
import { MainStackScreenProps } from '@/navigation/navigation';
import { colors, spacing, fontSize, borderRadius } from '../styles';
import dayjs from 'dayjs';
import { useUpdateScheduleEntry } from '@/hooks/useScheduleEntryMutations'; // 실제 구현 필요
import ScreenHeader from '@/components/ScreenHeader';
import SvgIcon from '@/components/common/SvgIcon';
import { useForm } from 'react-hook-form';
import firestore from '@react-native-firebase/firestore';
import { ScheduleEntryFormSection, FormValues, useScheduleEntryFormSection } from '../components/ScheduleEntryFormSection';
import { useScheduleEntryByIdQuery } from '@/hooks/useScheduleEntryQueries';
import { Timestamp } from '@react-native-firebase/firestore';

// navigation param에 entry(기존 일정 데이터)가 있다고 가정
const ScheduleEntryEditScreen: FC<MainStackScreenProps<'ScheduleEntryEdit'>> = ({ navigation, route }) => {
  const { scheduleEntryId } = route.params;
  const { data: entry } = useScheduleEntryByIdQuery({ id: scheduleEntryId });
  const { mutate: updateScheduleEntry, isPending: isUpdating } = useUpdateScheduleEntry();
  const form = useForm<FormValues>({
    defaultValues: {
      title: entry?.title || '',
      startAt: entry?.startAt ? dayjs(entry.startAt.toDate ? entry.startAt.toDate() : entry.startAt instanceof Date ? entry.startAt : undefined).toDate() : undefined,
      endAt: entry?.endAt ? dayjs(entry.endAt.toDate ? entry.endAt.toDate() : entry.endAt instanceof Date ? entry.endAt : undefined).toDate() : undefined,
      description: entry?.description || '',
    },
  });
  useEffect(() => {
    if (entry) {
      form.reset({
        title: entry.title || '',
        startAt: entry.startAt ? (entry.startAt.toDate ? entry.startAt.toDate() : entry.startAt instanceof Date ? entry.startAt : undefined) : undefined,
        endAt: entry.endAt ? (entry.endAt.toDate ? entry.endAt.toDate() : entry.endAt instanceof Date ? entry.endAt : undefined) : undefined,
        description: entry.description || '',
      });
    }
  }, [entry, form]);
  const formSection = useScheduleEntryFormSection(form);

  const handleClose = useCallback(() => {
    const values = form.getValues();
    const entryStartAt = entry?.startAt ? (entry.startAt.toDate ? entry.startAt.toDate() : entry.startAt) : undefined;
    const entryEndAt = entry?.endAt ? (entry.endAt.toDate ? entry.endAt.toDate() : entry.endAt) : undefined;
    const hasValue = values.title !== entry?.title || values.description !== entry?.description ||
      (values.startAt && (!entryStartAt || dayjs(values.startAt).isSame(dayjs(entryStartAt instanceof Timestamp ? entryStartAt.toDate() : entryStartAt), 'minute') === false)) ||
      (values.endAt && (!entryEndAt || dayjs(values.endAt).isSame(dayjs(entryEndAt instanceof Timestamp ? entryEndAt.toDate() : entryEndAt), 'minute') === false));
    if (hasValue) {
      Alert.alert(
        '수정 중인 내용이 있습니다',
        '수정 중인 내용이 사라집니다. 정말 닫으시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '닫기', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [form, navigation, entry]);

  const onSubmit = useCallback((data: FormValues) => {
    if (!entry) return;
    // 데이터가 달라질 때만 update 호출
    const entryStartAt = entry.startAt ? (entry.startAt.toDate ? entry.startAt.toDate() : entry.startAt) : undefined;
    const entryEndAt = entry.endAt ? (entry.endAt.toDate ? entry.endAt.toDate() : entry.endAt) : undefined;
    const isDifferent = data.title !== entry.title || data.description !== entry.description ||
      (data.startAt && (!entryStartAt || dayjs(data.startAt).isSame(dayjs(entryStartAt instanceof Timestamp ? entryStartAt.toDate() : entryStartAt), 'minute') === false)) ||
      (data.endAt && (!entryEndAt || dayjs(data.endAt).isSame(dayjs(entryEndAt instanceof Timestamp ? entryEndAt.toDate() : entryEndAt), 'minute') === false));
    if (!isDifferent) return;

    updateScheduleEntry({
      id: entry?.id ?? '',
      data: {
        title: data.title,
        startAt: data.startAt ? firestore.Timestamp.fromDate(data.startAt) : undefined,
        endAt: data.endAt ? firestore.Timestamp.fromDate(data.endAt) : undefined,
        description: data.description,
      }
    }, {
      onSuccess: () => {
        navigation.goBack();
        form.reset();
      }
    });
    navigation.goBack();
  }, [updateScheduleEntry, navigation, form, entry]);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader 
        left={
          <TouchableOpacity onPress={handleClose}>
            <SvgIcon name="alphabet-x" color={colors.grayscale[100]} size={24} />
          </TouchableOpacity>
        }
        title="일정 수정"
        right={
          <TouchableOpacity onPress={form.handleSubmit(onSubmit)} /*disabled={isUpdating}*/>
            <SvgIcon name="check" color={colors.grayscale[100]} size={32} />
          </TouchableOpacity>
        }
        titleStyle={{ color: colors.grayscale[100] }}
        containerStyle={{ backgroundColor: colors.secondary }}
      />
      <ScheduleEntryFormSection {...formSection} form={form} styles={styles}/>
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

export default ScheduleEntryEditScreen; 