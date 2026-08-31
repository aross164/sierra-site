import {resolveNflWeek, computeNewestWeek} from './week';

describe('resolveNflWeek', () => {
    test('returns week 1 during preseason regardless of the reported week', () => {
        expect(resolveNflWeek({season_type: 'pre', week: 4})).toBe(1);
    });

    test('returns the reported week during the regular season', () => {
        expect(resolveNflWeek({season_type: 'regular', week: 7})).toBe(7);
    });

    test('defaults to 18 when no week is reported', () => {
        expect(resolveNflWeek({season_type: 'regular', week: 0})).toBe(18);
        expect(resolveNflWeek({season_type: 'post'})).toBe(18);
    });
});

describe('computeNewestWeek', () => {
    test('returns the live NFL week when the league is active and before playoffs', () => {
        expect(computeNewestWeek(5, 15, 'in_season')).toBe(5);
    });

    test('clamps to the last regular-season week once playoffs have started', () => {
        expect(computeNewestWeek(16, 15, 'in_season')).toBe(14);
    });

    test('treats a completed league as fully played out regardless of the live NFL week', () => {
        // A past season's league is "complete" even though the live NFL week reflects the current season.
        expect(computeNewestWeek(3, 15, 'complete')).toBe(14);
    });
});
