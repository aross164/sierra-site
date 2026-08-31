// Sleeper reports the *current* NFL week even for a preseason state that hasn't started
// the regular season's week 1 yet - treat preseason as week 1 rather than whatever
// leftover week number the state endpoint reports.
export function resolveNflWeek(weekInfo){
    if(weekInfo.season_type === 'pre'){
        return 1;
    }
    return weekInfo.week || 18;
}

// Clamps the "newest week with data" to the last regular-season week (playoffs aren't
// ranked), and treats a league whose season is already marked complete as fully played
// out regardless of what the live NFL week currently is (relevant for past seasons,
// since the live NFL week reflects the *current* season, not the one being viewed).
export function computeNewestWeek(nflWeek, playoffStart, status){
    const effectiveNflWeek = status === 'complete' ? 18 : nflWeek;
    return effectiveNflWeek > playoffStart - 1 ? playoffStart - 1 : effectiveNflWeek;
}
