import { describe, expect, it, vi } from 'vitest';
import { HistoryRefreshError, saveActivityAndRefresh } from './activityWorkflow';

describe('activity save and history refresh', () => {
  it('refreshes history only after creation succeeds', async () => {
    const events: string[] = [];
    const save = vi.fn(async () => {
      events.push('saved');
      return { id: 'activity-1' };
    });
    const refresh = vi.fn(async () => {
      events.push('refreshed');
    });
    const onSaved = vi.fn(() => events.push('reset'));

    await expect(saveActivityAndRefresh(save, refresh, onSaved)).resolves.toEqual({ id: 'activity-1' });
    expect(events).toEqual(['saved', 'reset', 'refreshed']);
  });

  it('preserves the form when save fails and reports history errors separately', async () => {
    const refresh = vi.fn(async () => {});
    await expect(saveActivityAndRefresh(
      async () => { throw new Error('offline'); },
      refresh,
      vi.fn(),
    )).rejects.toThrow('offline');
    expect(refresh).not.toHaveBeenCalled();

    await expect(saveActivityAndRefresh(
      async () => ({ id: 'activity-1' }),
      async () => { throw new Error('network unavailable'); },
      vi.fn(),
    )).rejects.toBeInstanceOf(HistoryRefreshError);
  });
});
