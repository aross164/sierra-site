export function groupBySeason(entries){
    return Object.entries(
        entries.reduce((bySeason, [id, info]) => {
            const season = info.season || 'Unknown';
            if(!bySeason[season]){
                bySeason[season] = [];
            }
            bySeason[season].push([id, info]);
            return bySeason;
        }, {})
    ).sort(([seasonA], [seasonB]) => {
        if(seasonA === 'Unknown'){
            return 1;
        }
        if(seasonB === 'Unknown'){
            return -1;
        }
        return seasonB - seasonA;
    });
}

// Sleeper only returns a user's leagues for a single season at a time, so walk each
// league's previous_league_id chain to pull in every earlier season's league too.
export async function fetchLeagueHistory(seasonLeagues){
    const allLeagues = [...seasonLeagues];
    const seenIds = new Set(seasonLeagues.map(({league_id}) => league_id));
    const queue = seasonLeagues.map(({previous_league_id}) => previous_league_id).filter(Boolean);

    while(queue.length){
        const previousLeagueId = queue.shift();
        if(!previousLeagueId || previousLeagueId === '0' || seenIds.has(previousLeagueId)){
            continue;
        }
        seenIds.add(previousLeagueId);

        const response = await fetch(`https://api.sleeper.app/v1/league/${previousLeagueId}`);
        if(!response.ok){
            continue;
        }
        const previousLeague = await response.json();
        if(!previousLeague || !previousLeague.league_id){
            continue;
        }

        allLeagues.push(previousLeague);
        if(previousLeague.previous_league_id){
            queue.push(previousLeague.previous_league_id);
        }
    }

    return allLeagues;
}
