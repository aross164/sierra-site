// Merges Sleeper's separate users/ and rosters/ league endpoints into one team map
// keyed by userId, since roster ownership (and rosterId) is only available on the
// rosters response, not the users response.
export function buildTeams(usersRaw, rostersRaw){
    const users = usersRaw.reduce((foundUsers, user) => {
        foundUsers[user.user_id] = {
            teamName: user.metadata.team_name,
            displayName: user.display_name,
            avatar: user.metadata.avatar || ''
        };

        return foundUsers;
    }, {});

    rostersRaw.forEach(roster => users[roster.owner_id].rosterId = roster.roster_id);

    return users;
}
