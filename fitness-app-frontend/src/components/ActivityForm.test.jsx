import React from 'react';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ActivityForm from './ActivityForm';
import ActivityList from './ActivityList';
import { MemoryRouter } from 'react-router';

const { addActivity, getActivities } = vi.hoisted(() => ({
    addActivity: vi.fn(),
    getActivities: vi.fn()
}));

vi.mock('../services/api', () => ({ addActivity, getActivities }));

afterEach(() => cleanup());

const selectWeightTraining = async () => {
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name: 'Weight training' }));
};

describe('activity entry and history refresh', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('saves the activity, resets the full form, and invokes the refresh callback', async () => {
        addActivity.mockResolvedValue({});
        const onActivityAdded = vi.fn();
        render(<ActivityForm onActivityAdded={onActivityAdded} />);

        fireEvent.change(screen.getByLabelText('Duration (Minutes)'), {
            target: { value: '35' }
        });
        fireEvent.change(screen.getByLabelText('Calories Burned'), {
            target: { value: '280' }
        });
        fireEvent.submit(screen.getByRole('button', { name: 'Add Activity' }).closest('form'));

        await waitFor(() => expect(addActivity).toHaveBeenCalledWith({
            type: 'RUNNING',
            duration: 35,
            caloriesBurned: 280,
            additionalMetrics: {}
        }));
        expect(onActivityAdded).toHaveBeenCalledOnce();
        expect(screen.getByLabelText('Duration (Minutes)')).toHaveValue(null);
        expect(screen.getByLabelText('Calories Burned')).toHaveValue(null);
    });

    it('keeps entered values and displays an error when saving fails', async () => {
        addActivity.mockRejectedValue(new Error('offline'));
        const onActivityAdded = vi.fn();
        render(<ActivityForm onActivityAdded={onActivityAdded} />);
        fireEvent.change(screen.getByLabelText('Duration (Minutes)'), {
            target: { value: '35' }
        });
        fireEvent.submit(screen.getByRole('button', { name: 'Add Activity' }).closest('form'));

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Could not save this activity. Please try again.'
        );
        expect(screen.getByLabelText('Duration (Minutes)')).toHaveValue(35);
        expect(onActivityAdded).not.toHaveBeenCalled();
    });

    it('saves weight training with multiple exercises and their set details', async () => {
        addActivity.mockResolvedValue({});
        const onActivityAdded = vi.fn();
        render(<ActivityForm onActivityAdded={onActivityAdded} />);

        await selectWeightTraining();
        fireEvent.change(screen.getByLabelText('Exercise name'), {
            target: { value: 'Squat' }
        });
        fireEvent.change(screen.getByLabelText('Sets'), {
            target: { value: '4' }
        });
        fireEvent.change(screen.getByLabelText('Reps per set'), {
            target: { value: '8' }
        });
        fireEvent.change(screen.getByLabelText('Weight (kg)'), {
            target: { value: '60.5' }
        });
        fireEvent.change(screen.getByLabelText('Rest (seconds)'), {
            target: { value: '90' }
        });
        fireEvent.click(screen.getByRole('button', { name: 'Add exercise' }));

        const exerciseNames = screen.getAllByLabelText('Exercise name');
        fireEvent.change(exerciseNames[1], { target: { value: 'Bench press' } });
        fireEvent.change(screen.getAllByLabelText('Sets')[1], { target: { value: '3' } });
        fireEvent.change(screen.getAllByLabelText('Reps per set')[1], { target: { value: '10' } });
        fireEvent.change(screen.getAllByLabelText('Weight (kg)')[1], { target: { value: '40' } });
        fireEvent.change(screen.getAllByLabelText('Rest (seconds)')[1], { target: { value: '60' } });
        fireEvent.submit(screen.getByRole('button', { name: 'Add Activity' }).closest('form'));

        await waitFor(() => expect(addActivity).toHaveBeenCalledWith({
            type: 'WEIGHT_TRAINING',
            duration: 0,
            caloriesBurned: 0,
            additionalMetrics: {},
            exercises: [
                { name: 'Squat', sets: 4, reps: 8, weightKg: 60.5, restSeconds: 90 },
                { name: 'Bench press', sets: 3, reps: 10, weightKg: 40, restSeconds: 60 }
            ]
        }));
        expect(onActivityAdded).toHaveBeenCalledOnce();
        expect(screen.getByRole('combobox')).toHaveTextContent('Running');
    });

    it('requires exercise details before saving weight training', async () => {
        const onActivityAdded = vi.fn();
        render(<ActivityForm onActivityAdded={onActivityAdded} />);

        await selectWeightTraining();
        fireEvent.submit(screen.getByRole('button', { name: 'Add Activity' }).closest('form'));

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Enter an exercise name, positive sets and reps'
        );
        expect(addActivity).not.toHaveBeenCalled();
        expect(onActivityAdded).not.toHaveBeenCalled();
    });

    it('reloads the activity history when the refresh token changes', async () => {
        getActivities
            .mockResolvedValueOnce({ data: [{ id: 'one', type: 'RUNNING', duration: 20, caloriesBurned: 100 }] })
            .mockResolvedValueOnce({ data: [{ id: 'two', type: 'CYCLING', duration: 45, caloriesBurned: 350 }] });
        const { rerender } = render(
            <MemoryRouter>
                <ActivityList refreshToken={0} />
            </MemoryRouter>
        );

        expect(await screen.findByText('RUNNING')).toBeInTheDocument();
        rerender(
            <MemoryRouter>
                <ActivityList refreshToken={1} />
            </MemoryRouter>
        );

        expect(await screen.findByText('CYCLING')).toBeInTheDocument();
        expect(getActivities).toHaveBeenCalledTimes(2);
    });
});
