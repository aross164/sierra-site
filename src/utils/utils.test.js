import {fetchPlayerInfo} from './utils';

describe('fetchPlayerInfo', () => {
    beforeEach(() => {
        localStorage.clear();
        global.fetch = jest.fn();
    });

    test('fetches and caches player info when not already in localStorage', async () => {
        const playerData = {player_id: '123', full_name: 'Test Player'};
        global.fetch.mockResolvedValue({
            json: () => Promise.resolve(playerData),
        });

        const result = await fetchPlayerInfo('123');

        expect(global.fetch).toHaveBeenCalledWith('https://api.sleeper.com/players/nfl/123');
        expect(result).toEqual(playerData);
        expect(JSON.parse(localStorage.getItem('123'))).toEqual(playerData);
    });

    test('returns cached info from localStorage without hitting the network', async () => {
        const cached = {player_id: '456', full_name: 'Cached Player'};
        localStorage.setItem('456', JSON.stringify(cached));

        const result = await fetchPlayerInfo('456');

        expect(global.fetch).not.toHaveBeenCalled();
        expect(result).toEqual(cached);
    });
});
