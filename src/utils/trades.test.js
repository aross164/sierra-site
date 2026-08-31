import {getTradeWeek, computeTradeValue} from './trades';

describe('getTradeWeek', () => {
    test('attributes a trade to the following week when it happened on a Monday', () => {
        // 2024-01-15 is a Monday.
        const trade = {week: 5, status_updated: new Date('2024-01-15T12:00:00-06:00').getTime()};
        expect(getTradeWeek(trade)).toBe(6);
    });

    test('attributes a trade to the following week when it happened on a Tuesday', () => {
        // 2024-01-16 is a Tuesday.
        const trade = {week: 5, status_updated: new Date('2024-01-16T12:00:00-06:00').getTime()};
        expect(getTradeWeek(trade)).toBe(6);
    });

    test('leaves the trade week unchanged on any other day', () => {
        // 2024-01-17 is a Wednesday.
        const trade = {week: 5, status_updated: new Date('2024-01-17T12:00:00-06:00').getTime()};
        expect(getTradeWeek(trade)).toBe(5);
    });
});

describe('computeTradeValue', () => {
    test('sums points and averages them across qualifying weeks from the trade week onward', () => {
        const playerData = {
            position: 'RB',
            stats: {
                4: {stats: {off_snp: 10, pts_ppr: 8}}, // before trade week, excluded
                5: {stats: {off_snp: 20, pts_ppr: 12}},
                6: {stats: {off_snp: 15, pts_ppr: 18}},
            },
        };

        const result = computeTradeValue(playerData, 5);

        expect(result).toEqual({points: 30, average: 15});
    });

    test('excludes weeks with no offensive or defensive snaps (did not play)', () => {
        const playerData = {
            position: 'WR',
            stats: {
                5: {stats: {off_snp: 0, def_snp: 0, pts_ppr: 5}},
                6: {stats: {off_snp: 10, pts_ppr: 10}},
            },
        };

        const result = computeTradeValue(playerData, 5);

        expect(result).toEqual({points: 10, average: 10});
    });

    test('returns null when the player never played a qualifying week', () => {
        const playerData = {
            position: 'WR',
            stats: {
                5: {stats: {off_snp: 0, pts_ppr: 5}},
            },
        };

        expect(computeTradeValue(playerData, 5)).toBeNull();
    });

    test('subtracts interceptions from a QB\'s points, but not from other positions', () => {
        const qb = {
            position: 'QB',
            stats: {5: {stats: {off_snp: 60, pts_ppr: 20, pass_int: 2}}},
        };
        const rb = {
            position: 'RB',
            stats: {5: {stats: {off_snp: 60, pts_ppr: 20, pass_int: 2}}},
        };

        expect(computeTradeValue(qb, 5)).toEqual({points: 18, average: 18});
        expect(computeTradeValue(rb, 5)).toEqual({points: 20, average: 20});
    });
});
