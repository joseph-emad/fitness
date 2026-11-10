import { describe, expect, it } from 'vitest';
import { buildActivityPayload, createInitialActivity } from './activity';

describe('activity payload validation', () => {
  it('matches the backend payload for a cardio activity without a user id', () => {
    const input = { ...createInitialActivity(), type: 'RUNNING' as const, duration: '35', caloriesBurned: '280' };
    expect(buildActivityPayload(input)).toEqual({
      type: 'RUNNING',
      duration: 35,
      caloriesBurned: 280,
      additionalMetrics: {},
    });
  });

  it('includes all exercises for weight training and validates their fields', () => {
    const input = {
      ...createInitialActivity(),
      type: 'WEIGHT_TRAINING' as const,
      exercises: [
        { name: ' Squat ', sets: '4', reps: '8', weightKg: '60.5', restSeconds: '90' },
        { name: 'Bench press', sets: '3', reps: '10', weightKg: '40', restSeconds: '60' },
      ],
    };
    expect(buildActivityPayload(input)).toEqual({
      type: 'WEIGHT_TRAINING',
      duration: 0,
      caloriesBurned: 0,
      additionalMetrics: {},
      exercises: [
        { name: 'Squat', sets: 4, reps: 8, weightKg: 60.5, restSeconds: 90 },
        { name: 'Bench press', sets: 3, reps: 10, weightKg: 40, restSeconds: 60 },
      ],
    });
  });

  it('rejects invalid numbers and incomplete strength exercises', () => {
    expect(buildActivityPayload({
      ...createInitialActivity(),
      duration: '-5',
    })).toContain('Duration must be a non-negative whole number.');
    expect(buildActivityPayload({
      ...createInitialActivity(),
      type: 'WEIGHT_TRAINING',
    })).toContain('Enter an exercise name');
  });
});
