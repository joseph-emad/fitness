import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../auth/AuthProvider';
import { buildActivityPayload, createEmptyExercise, createInitialActivity, ExerciseInput } from '../domain/activity';
import { HistoryRefreshError, saveActivityAndRefresh } from '../domain/activityWorkflow';
import { ACTIVITY_TYPES } from '../types';

interface ActivityEntryFormProps {
  onSaved: () => Promise<void>;
}

const activityLabels: Record<(typeof ACTIVITY_TYPES)[number], string> = {
  RUNNING: 'Running',
  WALKING: 'Walking',
  CYCLING: 'Cycling',
  SWIMMING: 'Swimming',
  WEIGHT_TRAINING: 'Weight training',
  YOGA: 'Yoga',
  HIIT: 'HIIT',
  CARDIO: 'Cardio',
  STRETCHING: 'Stretching',
  OTHER: 'Other',
};

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
}

function Field({ label, value, onChangeText, keyboardType = 'default' }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder="0"
        placeholderTextColor="#828c80"
        style={styles.input}
        value={value}
      />
    </View>
  );
}

export function ActivityEntryForm({ onSaved }: ActivityEntryFormProps) {
  const { api } = useAuth();
  const [activity, setActivity] = useState(createInitialActivity);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const submitting = useRef(false);

  const updateExercise = (index: number, field: keyof ExerciseInput, value: string) => {
    setActivity((current) => ({
      ...current,
      exercises: current.exercises.map((exercise, exerciseIndex) =>
        exerciseIndex === index ? { ...exercise, [field]: value } : exercise),
    }));
  };

  const submit = async () => {
    if (submitting.current) {
      return;
    }
    setError('');
    setSaved(false);
    const payload = buildActivityPayload(activity);
    if (typeof payload === 'string') {
      setError(payload);
      return;
    }

    submitting.current = true;
    setIsSubmitting(true);
    try {
      await saveActivityAndRefresh(
        () => api.addActivity(payload),
        () => onSaved(),
        () => {
          setActivity(createInitialActivity());
          setSaved(true);
        },
      );
    } catch (caught) {
      if (caught instanceof HistoryRefreshError) {
        setError(`${caught.message} ${caught.cause instanceof Error ? caught.cause.message : ''}`.trim());
      } else {
        setError(caught instanceof Error
          ? `Could not save this activity. ${caught.message}`
          : 'Could not save this activity. Check your connection and try again.');
      }
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>Activity type</Text>
        <View style={styles.pickerWrap}>
          <Picker
            accessibilityLabel="Activity type"
            dropdownIconColor="#cbff67"
            onValueChange={(type) => setActivity((current) => ({ ...current, type }))}
            selectedValue={activity.type}
            style={styles.picker}
          >
            {ACTIVITY_TYPES.map((type) => (
              <Picker.Item key={type} label={activityLabels[type]} value={type} />
            ))}
          </Picker>
        </View>
      </View>
      <Field
        keyboardType="numeric"
        label="Duration (minutes)"
        onChangeText={(duration) => setActivity((current) => ({ ...current, duration }))}
        value={activity.duration}
      />
      <Field
        keyboardType="numeric"
        label="Calories burned"
        onChangeText={(caloriesBurned) => setActivity((current) => ({ ...current, caloriesBurned }))}
        value={activity.caloriesBurned}
      />

      {activity.type === 'WEIGHT_TRAINING' ? (
        <View style={styles.exerciseList}>
          <Text style={styles.label}>Exercises</Text>
          {activity.exercises.map((exercise, index) => (
            <View key={`exercise-${index}`} style={styles.exerciseCard}>
              <Text style={styles.exerciseTitle}>Exercise {index + 1}</Text>
              <Field
                label="Exercise name"
                onChangeText={(value) => updateExercise(index, 'name', value)}
                value={exercise.name}
              />
              <Field
                keyboardType="numeric"
                label="Sets"
                onChangeText={(value) => updateExercise(index, 'sets', value)}
                value={exercise.sets}
              />
              <Field
                keyboardType="numeric"
                label="Reps per set"
                onChangeText={(value) => updateExercise(index, 'reps', value)}
                value={exercise.reps}
              />
              <Field
                keyboardType="decimal-pad"
                label="Weight (kg)"
                onChangeText={(value) => updateExercise(index, 'weightKg', value)}
                value={exercise.weightKg}
              />
              <Field
                keyboardType="numeric"
                label="Rest (seconds)"
                onChangeText={(value) => updateExercise(index, 'restSeconds', value)}
                value={exercise.restSeconds}
              />
              {activity.exercises.length > 1 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setActivity((current) => ({
                    ...current,
                    exercises: current.exercises.filter((_, exerciseIndex) => exerciseIndex !== index),
                  }))}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeText}>Remove exercise</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
          <Pressable
            accessibilityRole="button"
            onPress={() => setActivity((current) => ({
              ...current,
              exercises: [...current.exercises, createEmptyExercise()],
            }))}
            style={styles.outlineButton}
          >
            <Text style={styles.outlineButtonText}>Add exercise</Text>
          </Pressable>
        </View>
      ) : null}

      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {saved ? <Text accessibilityRole="status" style={styles.success}>Activity saved.</Text> : null}
      <Pressable
        accessibilityRole="button"
        disabled={isSubmitting}
        onPress={() => void submit()}
        style={[styles.submitButton, isSubmitting && styles.disabled]}
      >
        {isSubmitting
          ? <ActivityIndicator color="#111813" />
          : <Text style={styles.submitText}>Add activity</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 15 },
  field: { gap: 7 },
  label: { color: '#dce2d7', fontSize: 14, fontWeight: '700' },
  input: { backgroundColor: '#1b251e', borderColor: '#384539', borderWidth: 1, borderRadius: 10, color: '#f5f6ef', paddingHorizontal: 13, paddingVertical: 12, fontSize: 16 },
  pickerWrap: { backgroundColor: '#1b251e', borderColor: '#384539', borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  picker: { color: '#f5f6ef' },
  exerciseList: { gap: 12, paddingTop: 4 },
  exerciseCard: { backgroundColor: '#18211b', borderColor: '#344033', borderWidth: 1, borderRadius: 12, padding: 13, gap: 11 },
  exerciseTitle: { color: '#cbff67', fontWeight: '800', fontSize: 16 },
  removeButton: { paddingVertical: 7, alignSelf: 'flex-start' },
  removeText: { color: '#ffc0b8', fontWeight: '700' },
  outlineButton: { borderColor: '#71806f', borderWidth: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  outlineButtonText: { color: '#f5f6ef', fontWeight: '700' },
  error: { color: '#ffc0b8', fontSize: 14, lineHeight: 20 },
  success: { color: '#cbff67', fontWeight: '700' },
  submitButton: { backgroundColor: '#cbff67', borderRadius: 11, padding: 15, alignItems: 'center', marginTop: 3 },
  submitText: { color: '#111813', fontSize: 15, fontWeight: '800' },
  disabled: { opacity: 0.6 },
});
