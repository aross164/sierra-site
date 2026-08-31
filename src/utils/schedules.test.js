import {getRecord, computeWhatIfScores, scoresCoverWeeks, sortPositions, defaultPositionForStarterIndex, normalizePosition} from './schedules';

// scores[rosterId][week] = {pf, pa, opponent}. newestWeek is exclusive in getRecord's loop
// (weeks 1..newestWeek-1 have been played), matching how Schedules.js calls it.
describe('getRecord', () => {
    test('team 1 vs itself is its actual record (wins when it outscored its real opponent)', () => {
        const scores = {
            1: {1: {pf: 100, pa: 90, opponent: 2}, 2: {pf: 80, pa: 85, opponent: 2}},
            2: {1: {pf: 90, pa: 100, opponent: 1}, 2: {pf: 85, pa: 80, opponent: 1}},
        };
        // week1: 100 > 90 (win), week2: 80 < 85 (loss)
        expect(getRecord(scores, 3, 1, 1)).toEqual({wins: 1, losses: 1, ties: 0});
    });

    test('a what-if record uses the column team\'s actual points-against for that week', () => {
        const scores = {
            1: {1: {pf: 100, pa: 0, opponent: 9}},
            // team 3 didn't play team 1 this week, so its own points-against (65) is what's compared.
            3: {1: {pf: 60, pa: 65, opponent: 4}},
        };
        // team1's what-if record playing team3's schedule: 100 (team1 pf) > 65 (team3 pa) => win
        expect(getRecord(scores, 2, 1, 3)).toEqual({wins: 1, losses: 0, ties: 0});
    });

    test('uses the column team\'s points-for when the column team played the row team that week', () => {
        const scores = {
            1: {1: {pf: 80, pa: 0, opponent: 9}},
            // team 3 played team 1 (row) this week, so team3's own points-for (85) is used instead of pa.
            3: {1: {pf: 85, pa: 20, opponent: 1}},
        };
        // 80 (team1 pf) < 85 (team3 pf, since team3 played team1) => loss
        expect(getRecord(scores, 2, 1, 3)).toEqual({wins: 0, losses: 1, ties: 0});
    });

    test('equal points-for and points-against count as a tie', () => {
        const scores = {
            2: {1: {pf: 70, pa: 0, opponent: 9}},
            4: {1: {pf: 70, pa: 70, opponent: 9}},
        };
        expect(getRecord(scores, 2, 2, 4)).toEqual({wins: 0, losses: 0, ties: 1});
    });

    test('stops before the given newestWeek (in-progress week is excluded)', () => {
        const scores = {
            1: {1: {pf: 100, pa: 90, opponent: 2}, 2: {pf: 0, pa: 999, opponent: 2}},
            2: {1: {pf: 90, pa: 100, opponent: 1}, 2: {pf: 999, pa: 0, opponent: 1}},
        };
        expect(getRecord(scores, 2, 1, 1)).toEqual({wins: 1, losses: 0, ties: 0});
    });
});

describe('computeWhatIfScores', () => {
    const scores = {
        1: {1: {pf: 100, pa: 90, opponent: 2}},
        2: {1: {pf: 90, pa: 100, opponent: 1}},
    };

    test('computes actual wins from the diagonal (team vs its own real schedule)', () => {
        const result = computeWhatIfScores(scores, 2, 2);

        expect(result[1].actualWins).toBe(1);
        expect(result[2].actualWins).toBe(0);
    });

    test('true record averages a team\'s what-if record across every opponent\'s schedule', () => {
        const result = computeWhatIfScores(scores, 2, 2);

        // Team 2's opponent that week was team 1 itself, so the "column" comparison uses team2's
        // own points-for (90) rather than points-against: team1 pf=100 > 90 => win.
        expect(result[1].records[2]).toEqual({wins: 1, losses: 0, ties: 0});
        // trueRecord averages the what-if wins (1 vs itself + 1 vs team2 = 2) across totalRosters (2).
        expect(result[1].trueRecord).toEqual({wins: '1.0', losses: '0.0', ties: '0.0'});
    });

    test('reports null (not "0.0") for a team that never ties across its avg record', () => {
        const scores3 = {
            1: {1: {pf: 100, pa: 90, opponent: 2}},
            2: {1: {pf: 90, pa: 100, opponent: 1}},
            3: {1: {pf: 50, pa: 40, opponent: 4}},
            4: {1: {pf: 40, pa: 50, opponent: 3}},
        };
        const result = computeWhatIfScores(scores3, 2, 4);

        expect(result[1].avgRecord.ties).toBeNull();
    });
});

describe('scoresCoverWeeks', () => {
    test('false when scores is empty (nothing fetched yet)', () => {
        expect(scoresCoverWeeks({}, 3)).toBe(false);
    });

    test('true when every roster has an entry for every week before newestWeek', () => {
        const scores = {
            1: {1: {pf: 100}, 2: {pf: 90}},
            2: {1: {pf: 80}, 2: {pf: 70}},
        };
        expect(scoresCoverWeeks(scores, 3)).toBe(true);
    });

    test('false when a roster is missing a week newestWeek expects (stale/partial fetch)', () => {
        const scores = {
            1: {1: {pf: 100}, 2: {pf: 90}},
            2: {1: {pf: 80}},
        };
        expect(scoresCoverWeeks(scores, 3)).toBe(false);
    });

    test('true when newestWeek is 1 (no weeks played yet, nothing to require)', () => {
        const scores = {1: {}, 2: {}};
        expect(scoresCoverWeeks(scores, 1)).toBe(true);
    });
});

describe('sortPositions', () => {
    test('orders positions QB, RB, WR, TE, IDP, DEF, K', () => {
        expect(sortPositions(['K', 'QB', 'DEF', 'WR', 'RB', 'IDP', 'TE'])).toEqual(
            ['QB', 'RB', 'WR', 'TE', 'IDP', 'DEF', 'K']
        );
    });

    test('does not mutate the input array', () => {
        const input = ['K', 'QB'];
        sortPositions(input);
        expect(input).toEqual(['K', 'QB']);
    });
});

describe('defaultPositionForStarterIndex', () => {
    test('maps the standard skill-position slots by index', () => {
        expect(defaultPositionForStarterIndex(0)).toBe('QB');
        expect(defaultPositionForStarterIndex(1)).toBe('RB');
        expect(defaultPositionForStarterIndex(2)).toBe('RB');
        expect(defaultPositionForStarterIndex(3)).toBe('WR');
        expect(defaultPositionForStarterIndex(4)).toBe('WR');
        expect(defaultPositionForStarterIndex(5)).toBe('TE');
        expect(defaultPositionForStarterIndex(8)).toBe('K');
        expect(defaultPositionForStarterIndex(9)).toBe('DEF');
    });

    test('returns null for flex/bench slots that need a real player lookup', () => {
        expect(defaultPositionForStarterIndex(6)).toBeNull();
        expect(defaultPositionForStarterIndex(7)).toBeNull();
    });
});

describe('normalizePosition', () => {
    test('passes standard fantasy positions through unchanged', () => {
        ['QB', 'RB', 'WR', 'TE', 'DEF', 'K'].forEach(position => {
            expect(normalizePosition(position)).toBe(position);
        });
    });

    test('buckets anything else as IDP', () => {
        expect(normalizePosition('LB')).toBe('IDP');
        expect(normalizePosition(undefined)).toBe('IDP');
    });
});
