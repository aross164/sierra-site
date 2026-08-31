import {groupBySeason, fetchLeagueHistory} from './leagueHistory';

describe('groupBySeason', () => {
    test('groups leagues by season and sorts seasons newest-first', () => {
        const entries = [
            ['l2022', {season: '2022', name: 'League 2022'}],
            ['l2024', {season: '2024', name: 'League 2024'}],
            ['l2023', {season: '2023', name: 'League 2023'}],
        ];

        const grouped = groupBySeason(entries);

        expect(grouped.map(([season]) => season)).toEqual(['2024', '2023', '2022']);
    });

    test('puts leagues with an unknown season last', () => {
        const entries = [
            ['l2023', {season: '2023', name: 'League 2023'}],
            ['lUnknown', {name: 'No Season League'}],
        ];

        const grouped = groupBySeason(entries);

        expect(grouped.map(([season]) => season)).toEqual(['2023', 'Unknown']);
    });

    test('keeps all leagues for the same season together', () => {
        const entries = [
            ['a', {season: '2023', name: 'A'}],
            ['b', {season: '2023', name: 'B'}],
        ];

        const grouped = groupBySeason(entries);

        expect(grouped).toEqual([
            ['2023', [['a', {season: '2023', name: 'A'}], ['b', {season: '2023', name: 'B'}]]],
        ]);
    });
});

describe('fetchLeagueHistory', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
    });

    test('walks the previous_league_id chain and includes every earlier season', async () => {
        const current = {league_id: '3', previous_league_id: '2'};
        const middle = {league_id: '2', previous_league_id: '1'};
        const oldest = {league_id: '1', previous_league_id: '0'};

        global.fetch.mockImplementation((url) => {
            if (url.endsWith('/2')) {
                return Promise.resolve({ok: true, json: () => Promise.resolve(middle)});
            }
            if (url.endsWith('/1')) {
                return Promise.resolve({ok: true, json: () => Promise.resolve(oldest)});
            }
            return Promise.resolve({ok: false});
        });

        const result = await fetchLeagueHistory([current]);

        expect(result).toEqual([current, middle, oldest]);
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    test('stops walking when previous_league_id is "0"', async () => {
        const current = {league_id: '1', previous_league_id: '0'};

        const result = await fetchLeagueHistory([current]);

        expect(result).toEqual([current]);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('skips a previous league that fails to fetch without throwing', async () => {
        const current = {league_id: '2', previous_league_id: '1'};
        global.fetch.mockResolvedValue({ok: false});

        const result = await fetchLeagueHistory([current]);

        expect(result).toEqual([current]);
    });

    test('does not revisit a league id already seen (avoids infinite loops on cyclic data)', async () => {
        const a = {league_id: 'a', previous_league_id: 'b'};
        const b = {league_id: 'b', previous_league_id: 'a'};

        global.fetch.mockImplementation((url) => {
            if (url.endsWith('/b')) {
                return Promise.resolve({ok: true, json: () => Promise.resolve(b)});
            }
            return Promise.resolve({ok: false});
        });

        const result = await fetchLeagueHistory([a]);

        expect(result).toEqual([a, b]);
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });
});
