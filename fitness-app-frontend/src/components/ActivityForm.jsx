import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { addActivity } from '../services/api';

const createEmptyExercise = () => ({
    name: '',
    sets: '',
    reps: '',
    weightKg: '',
    restSeconds: ''
});

const createInitialActivity = () => ({
    type: 'RUNNING',
    duration: '',
    caloriesBurned: '',
    additionalMetrics: {},
    exercises: [createEmptyExercise()]
});

const ActivityForm = ({ onActivityAdded }) => {
    const [activity, setActivity] = useState(createInitialActivity);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateExercise = (index, field, value) => {
        setActivity((current) => ({
            ...current,
            exercises: current.exercises.map((exercise, exerciseIndex) =>
                exerciseIndex === index ? { ...exercise, [field]: value } : exercise
            )
        }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (activity.type === 'WEIGHT_TRAINING') {
            const exercisesAreValid = activity.exercises.length > 0 && activity.exercises.every((exercise) =>
                exercise.name.trim()
                && Number(exercise.sets) >= 1
                && Number(exercise.reps) >= 1
                && exercise.weightKg !== ''
                && Number(exercise.weightKg) >= 0
                && exercise.restSeconds !== ''
                && Number(exercise.restSeconds) >= 0
            );
            if (!exercisesAreValid) {
                setError('Enter an exercise name, positive sets and reps, and non-negative weight and rest time for each exercise.');
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const activityToSave = {
                ...activity,
                duration: Number(activity.duration),
                caloriesBurned: Number(activity.caloriesBurned)
            };
            if (activity.type === 'WEIGHT_TRAINING') {
                activityToSave.exercises = activity.exercises.map((exercise) => ({
                    ...exercise,
                    sets: Number(exercise.sets),
                    reps: Number(exercise.reps),
                    weightKg: Number(exercise.weightKg),
                    restSeconds: Number(exercise.restSeconds)
                }));
            } else {
                delete activityToSave.exercises;
            }
            await addActivity(activityToSave);
            setActivity(createInitialActivity());
            onActivityAdded();
        } catch {
            setError('Could not save this activity. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }
    
    return (
        <Box component="form" className="activity-form" onSubmit={handleSubmit}>
            {error && <Box role="alert">{error}</Box>}
            <FormControl fullWidth>
                <InputLabel id="activity-type-label" htmlFor="activity-type-select">Activity Type</InputLabel>
                <Select
                    id="activity-type-select"
                    labelId="activity-type-label"
                    value={activity.type}
                    label="Activity Type"
                    onChange={(e) => setActivity((current) => ({ ...current, type: e.target.value }))}>
                    <MenuItem value="RUNNING">Running</MenuItem>
                    <MenuItem value="WALKING">Walking</MenuItem>
                    <MenuItem value="CYCLING">Cycling</MenuItem>
                    <MenuItem value="SWIMMING">Swimming</MenuItem>
                    <MenuItem value="WEIGHT_TRAINING">Weight training</MenuItem>
                    <MenuItem value="YOGA">Yoga</MenuItem>
                    <MenuItem value="HIIT">HIIT</MenuItem>
                    <MenuItem value="CARDIO">Cardio</MenuItem>
                    <MenuItem value="STRETCHING">Stretching</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                </Select>
            </FormControl>
            <TextField
                fullWidth
                className="activity-form__field"
                label="Duration (Minutes)"
                type="number"
                value={activity.duration}
                onChange={(e) => setActivity((current) => ({ ...current, duration: e.target.value }))} />
            
            <TextField
                fullWidth
                className="activity-form__field"
                label="Calories Burned"
                type="number"
                value={activity.caloriesBurned}
                onChange={(e) => setActivity((current) => ({ ...current, caloriesBurned: e.target.value }))} />

            {activity.type === 'WEIGHT_TRAINING' && (
                <Box className="exercise-list">
                    <Typography className="exercise-list__heading" component="h3">Exercises</Typography>
                    {activity.exercises.map((exercise, index) => (
                        <Box className="exercise-entry" key={index}>
                            <Typography className="exercise-entry__title" component="h4">
                                Exercise {index + 1}
                            </Typography>
                            <TextField
                                fullWidth
                                label="Exercise name"
                                value={exercise.name}
                                onChange={(e) => updateExercise(index, 'name', e.target.value)} />
                            <Box className="exercise-entry__fields">
                                <TextField
                                    label="Sets"
                                    type="number"
                                    inputProps={{ min: 1, step: 1 }}
                                    value={exercise.sets}
                                    onChange={(e) => updateExercise(index, 'sets', e.target.value)} />
                                <TextField
                                    label="Reps per set"
                                    type="number"
                                    inputProps={{ min: 1, step: 1 }}
                                    value={exercise.reps}
                                    onChange={(e) => updateExercise(index, 'reps', e.target.value)} />
                                <TextField
                                    label="Weight (kg)"
                                    type="number"
                                    inputProps={{ min: 0, step: 'any' }}
                                    value={exercise.weightKg}
                                    onChange={(e) => updateExercise(index, 'weightKg', e.target.value)} />
                                <TextField
                                    label="Rest (seconds)"
                                    type="number"
                                    inputProps={{ min: 0, step: 1 }}
                                    value={exercise.restSeconds}
                                    onChange={(e) => updateExercise(index, 'restSeconds', e.target.value)} />
                            </Box>
                            {activity.exercises.length > 1 && (
                                <Button
                                    type="button"
                                    className="exercise-entry__remove"
                                    onClick={() => setActivity((current) => ({
                                        ...current,
                                        exercises: current.exercises.filter((_, exerciseIndex) => exerciseIndex !== index)
                                    }))}>
                                    Remove exercise
                                </Button>
                            )}
                        </Box>
                    ))}
                    <Button
                        type="button"
                        className="exercise-list__add"
                        onClick={() => setActivity((current) => ({
                            ...current,
                            exercises: [...current.exercises, createEmptyExercise()]
                        }))}>
                        Add exercise
                    </Button>
                </Box>
            )}

            <Button className="activity-form__submit" type="submit" variant="contained" disabled={isSubmitting}>
                Add Activity
            </Button>
        </Box>
    )
}

export default ActivityForm