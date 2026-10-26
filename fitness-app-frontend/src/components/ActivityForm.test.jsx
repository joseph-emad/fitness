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
