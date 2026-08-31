// A trade completed Monday or Tuesday almost certainly happened after that week's games were
// already played, so it's attributed to the following week rather than the week it was logged
// under - otherwise it would look like the traded players were available for a week they weren't.
export function getTradeWeek(trade){
    let week = trade.week;

    const date = new Date(trade.status_updated);
    const dayName = date.toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        weekday: 'long'
    });
    if(['Monday', 'Tuesday'].includes(dayName)){
        week++;
    }

    return week;
}

// Points/game average a traded player produced from the trade week onward. Returns null when
// the player didn't play any qualifying weeks (so the caller can leave points/average unset
// rather than show a misleading 0).
export function computeTradeValue(playerData, tradeWeek){
    const stats = Object.entries(playerData.stats);
    let numWeeks = 0;
    let totalPoints = 0;
    stats.forEach(([week, weekStats]) => {
        if(week < tradeWeek || !(weekStats?.stats.off_snp || weekStats?.stats.def_snp)){
            // probably didn't play
            return;
        }
        numWeeks++;
        let points = weekStats.stats.pts_ppr || 0;
        if(playerData.position === 'QB'){
            // sleeper only counts INTs as -1
            points -= (weekStats.stats.pass_int || 0) * 1;
        }
        totalPoints += points;
    });

    if(!numWeeks){
        return null;
    }

    return {points: totalPoints, average: totalPoints / numWeeks};
}
