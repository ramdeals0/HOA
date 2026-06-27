import {
  buildResultTotals,
  canManageResolutions,
  canViewResults,
  canVote,
  isVotingOpen,
} from './resolution.service';

describe('resolution helpers', () => {
  it('allows board members to manage resolutions', () => {
    expect(canManageResolutions('BOARD')).toBe(true);
    expect(canManageResolutions('MEMBER')).toBe(false);
  });

  it('allows active tenant members to vote', () => {
    expect(canVote('MEMBER')).toBe(true);
    expect(canVote('RESIDENT')).toBe(true);
    expect(canVote(undefined)).toBe(false);
  });

  it('checks whether voting is currently open', () => {
    const now = new Date('2026-06-15T12:00:00.000Z');
    expect(
      isVotingOpen('OPEN', new Date('2026-06-01T00:00:00.000Z'), new Date('2026-06-30T23:59:59.999Z'), now),
    ).toBe(true);
    expect(
      isVotingOpen('OPEN', new Date('2026-06-20T00:00:00.000Z'), new Date('2026-06-30T23:59:59.999Z'), now),
    ).toBe(false);
    expect(isVotingOpen('DRAFT', null, null, now)).toBe(false);
  });

  it('hides results from members until voting closes', () => {
    expect(canViewResults('OPEN', false)).toBe(false);
    expect(canViewResults('CLOSED', false)).toBe(true);
    expect(canViewResults('OPEN', true)).toBe(true);
  });

  it('builds vote totals with percentages', () => {
    const results = buildResultTotals(
      [
        { id: 'opt-1', label: 'Yes', sortOrder: 0 },
        { id: 'opt-2', label: 'No', sortOrder: 1 },
      ],
      [{ optionId: 'opt-1' }, { optionId: 'opt-1' }, { optionId: 'opt-2' }],
    );

    expect(results).toEqual([
      { optionId: 'opt-1', label: 'Yes', count: 2, percentage: 67 },
      { optionId: 'opt-2', label: 'No', count: 1, percentage: 33 },
    ]);
  });
});
