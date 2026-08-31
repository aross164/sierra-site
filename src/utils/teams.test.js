import {buildTeams} from './teams';

describe('buildTeams', () => {
    test('merges roster ids from the rosters response into the users map', () => {
        const usersRaw = [
            {user_id: 'u1', display_name: 'Alice', metadata: {team_name: 'Team A', avatar: 'a.png'}},
            {user_id: 'u2', display_name: 'Bob', metadata: {team_name: 'Team B'}},
        ];
        const rostersRaw = [
            {owner_id: 'u1', roster_id: 1},
            {owner_id: 'u2', roster_id: 2},
        ];

        const teams = buildTeams(usersRaw, rostersRaw);

        expect(teams).toEqual({
            u1: {teamName: 'Team A', displayName: 'Alice', avatar: 'a.png', rosterId: 1},
            u2: {teamName: 'Team B', displayName: 'Bob', avatar: '', rosterId: 2},
        });
    });

    test('defaults avatar to an empty string when metadata has none', () => {
        const usersRaw = [{user_id: 'u1', display_name: 'Alice', metadata: {team_name: 'Team A'}}];

        const teams = buildTeams(usersRaw, []);

        expect(teams.u1.avatar).toBe('');
    });
});
