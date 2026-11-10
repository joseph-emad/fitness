export class HistoryRefreshError extends Error {
  constructor(readonly cause: unknown) {
    super('Activity saved, but history could not be refreshed.');
    this.name = 'HistoryRefreshError';
  }
}

export async function saveActivityAndRefresh<T>(
  save: () => Promise<T>,
  refresh: () => Promise<void>,
  onSaved: () => void,
): Promise<T> {
  const result = await save();
  onSaved();
  try {
    await refresh();
  } catch (error) {
    throw new HistoryRefreshError(error);
  }
  return result;
}
