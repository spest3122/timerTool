import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveTake,
  loadAllTakes,
  deleteTake,
  clearAllTakes,
  _resetMemoryFallback,
} from './mirrorStorage';

describe('mirrorStorage module', () => {
  beforeEach(() => {
    _resetMemoryFallback();
  });

  it('saves and loads takes successfully', async () => {
    const mockBlob = new Blob(['video data'], { type: 'video/webm' });
    const take = await saveTake({ blob: mockBlob, duration: 12 });

    expect(take.id).toBeDefined();
    expect(take.duration).toBe(12);
    expect(take.timestamp).toBeDefined();

    const all = await loadAllTakes();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(take.id);
  });

  it('deletes an individual take by id', async () => {
    const mockBlob = new Blob(['video data'], { type: 'video/webm' });
    const take1 = await saveTake({ blob: mockBlob, duration: 5 });
    const take2 = await saveTake({ blob: mockBlob, duration: 10 });

    await deleteTake(take1.id);

    const remaining = await loadAllTakes();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(take2.id);
  });

  it('clears all takes', async () => {
    const mockBlob = new Blob(['video data'], { type: 'video/webm' });
    await saveTake({ blob: mockBlob, duration: 5 });
    await saveTake({ blob: mockBlob, duration: 10 });

    await clearAllTakes();

    const remaining = await loadAllTakes();
    expect(remaining).toHaveLength(0);
  });
});
