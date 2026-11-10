import { ActivityPayload, ActivityType, Exercise } from '../types';

export interface ExerciseInput {
  name: string;
  sets: string;
  reps: string;
  weightKg: string;
  restSeconds: string;
}

export interface ActivityInput {
  type: ActivityType;
  duration: string;
  caloriesBurned: string;
  exercises: ExerciseInput[];
}

export const createEmptyExercise = (): ExerciseInput => ({
  name: '',
  sets: '',
  reps: '',
  weightKg: '',
  restSeconds: '',
});

export const createInitialActivity = (): ActivityInput => ({
  type: 'RUNNING',
  duration: '',
  caloriesBurned: '',
  exercises: [createEmptyExercise()],
});

const toNonNegativeInteger = (value: string, label: string): number | string => {
  if (value.trim() === '') {
    return 0;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : `${label} must be a non-negative whole number.`;
};

const validateExercise = (exercise: ExerciseInput, index: number): Exercise | string => {
  const number = index + 1;
  const sets = Number(exercise.sets);
  const reps = Number(exercise.reps);
  const weightKg = Number(exercise.weightKg);
  const restSeconds = Number(exercise.restSeconds);
  if (!exercise.name.trim() || !Number.isInteger(sets) || sets < 1
      || !Number.isInteger(reps) || reps < 1
      || exercise.weightKg.trim() === '' || !Number.isFinite(weightKg) || weightKg < 0
      || exercise.restSeconds.trim() === '' || !Number.isInteger(restSeconds) || restSeconds < 0) {
    return `Enter an exercise name, positive sets and reps, and non-negative weight and rest time for exercise ${number}.`;
  }
  return { name: exercise.name.trim(), sets, reps, weightKg, restSeconds };
};

export const buildActivityPayload = (input: ActivityInput): ActivityPayload | string => {
  const duration = toNonNegativeInteger(input.duration, 'Duration');
  if (typeof duration === 'string') {
    return duration;
  }
  const caloriesBurned = toNonNegativeInteger(input.caloriesBurned, 'Calories');
  if (typeof caloriesBurned === 'string') {
    return caloriesBurned;
  }

  const payload: ActivityPayload = {
    type: input.type,
    duration,
    caloriesBurned,
    additionalMetrics: {},
  };
  if (input.type !== 'WEIGHT_TRAINING') {
    return payload;
  }
  if (input.exercises.length === 0) {
    return 'Add at least one exercise to a weight-training session.';
  }
  const exercises: Exercise[] = [];
  for (const [index, exercise] of input.exercises.entries()) {
    const validated = validateExercise(exercise, index);
    if (typeof validated === 'string') {
      return validated;
    }
    exercises.push(validated);
  }
  payload.exercises = exercises;
  return payload;
};
