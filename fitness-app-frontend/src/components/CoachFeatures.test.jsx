import React from 'react';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CoachesPage from './CoachesPage';
import RoleSelection from './RoleSelection';
import TraineesPage from './TraineesPage';

const api = vi.hoisted(() => ({
    chooseRole: vi.fn(),
    getCoaches: vi.fn(),
    getSentRequests: vi.fn(),
    sendTrainingRequest: vi.fn(),
    cancelRequest: vi.fn(),
    getReceivedRequests: vi.fn(),
    acceptRequest: vi.fn(),
    declineRequest: vi.fn()
}));

vi.mock('../services/api', () => api);

afterEach(() => cleanup());
beforeEach(() => vi.clearAllMocks());

describe('coach role and training requests', () => {
    it('saves the chosen role', async () => {
        api.chooseRole.mockResolvedValue({ data: { role: 'COACH', roleChosen: true } });
        const onChosen = vi.fn();
        render(<RoleSelection onChosen={onChosen} />);

        fireEvent.click(screen.getByRole('button', { name: /coach/i }));

        await waitFor(() => expect(onChosen).toHaveBeenCalledWith({ role: 'COACH', roleChosen: true }));
        expect(api.chooseRole).toHaveBeenCalledWith('COACH');
    });

    it('lets a trainee request a coach with a message', async () => {
        api.getCoaches.mockResolvedValue({ data: [{ keycloakId: 'c1', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.test' }] });
        api.getSentRequests.mockResolvedValue({ data: [] });
        api.sendTrainingRequest.mockResolvedValue({});
        render(<MemoryRouter><CoachesPage onLogout={() => {}} /></MemoryRouter>);

        fireEvent.change(await screen.findByLabelText('Message (optional)'), { target: { value: 'Help me' } });
        fireEvent.click(screen.getByRole('button', { name: 'Request training' }));

        await waitFor(() => expect(api.sendTrainingRequest).toHaveBeenCalledWith('c1', 'Help me'));
    });

    it('lets a coach accept a pending request', async () => {
        api.getReceivedRequests.mockResolvedValue({ data: [{ id: 'r1', traineeId: 't1', traineeName: 'Sam', status: 'PENDING' }] });
        api.acceptRequest.mockResolvedValue({});
        render(<MemoryRouter><TraineesPage onLogout={() => {}} /></MemoryRouter>);

        fireEvent.click(await screen.findByRole('button', { name: 'Accept' }));

        await waitFor(() => expect(api.acceptRequest).toHaveBeenCalledWith('r1'));
    });
});
