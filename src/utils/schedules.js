// "What if every team played every other team's schedule" record, computed by replaying
// each week's actual points-for against each *other* team's actual points-against.
export function getRecord(scores, newestWeek, rowRosterId, columnRosterId){
    let i = 1;
    let wins = 0;
    let losses = 0;
    let ties = 0;
    while (i < newestWeek) {
        const forPoints = scores[rowRosterId][i].pf;
        // column's points against unless it's the row user, then it's points for
        const againstPoints = parseInt(scores[columnRosterId][i].opponent) !== parseInt(rowRosterId) ? scores[columnRosterId][i].pa : scores[columnRosterId][i].pf;

        if(forPoints > againstPoints){
            wins++;
        } else if(forPoints < againstPoints){
            losses++;
        } else{
            ties++;
        }

        i++;
    }

    return {wins, losses, ties};
}

// Schedules.js's own `scores` fetch and the app-level `newestWeek` are populated by
// separate async effects that can settle out of order (e.g. switching leagues quickly) - so
// `scores` may not yet cover every week `newestWeek` expects. Checked before computeWhatIfScores
// runs, since getRecord assumes every roster has an entry for every week < newestWeek.
export function scoresCoverWeeks(scores, newestWeek){
    const rosterScores = Object.values(scores);
    if(!rosterScores.length){
        return false;
    }

    return rosterScores.every(teamScores => {
        for(let week = 1; week < newestWeek; week++){
            if(!teamScores[week]){
                return false;
            }
        }
        return true;
    });
}

// Builds the "Grid" (head-to-head what-if records), "True Records" (average record across
// every other team's schedule), and "Hardest Schedules" (average record playing this team's
// own schedule) tables in one pass.
export function computeWhatIfScores(scores, newestWeek, totalRosters){
    const newWhatIfScores = {};
    Object.keys(scores).forEach(rowRosterId => {
        newWhatIfScores[rowRosterId] = {};
        newWhatIfScores[rowRosterId].actualWins = getRecord(scores, newestWeek, rowRosterId, rowRosterId).wins;
        newWhatIfScores[rowRosterId].records = {};

        let totalWins = 0;
        let totalLosses = 0;
        let totalTies = 0;
        Object.keys(scores).forEach(columnRosterId => {
            const {wins, losses, ties} = getRecord(scores, newestWeek, rowRosterId, columnRosterId);
            newWhatIfScores[rowRosterId].records[columnRosterId] = {wins, losses, ties};

            totalWins += wins;
            totalLosses += losses;
            totalTies += ties;
        });
        newWhatIfScores[rowRosterId].trueRecord = {
            wins: (totalWins / totalRosters).toFixed(1),
            losses: (totalLosses / totalRosters).toFixed(1),
            ties: (totalTies / totalRosters).toFixed(1),
        };
    });

    Object.entries(newWhatIfScores).forEach(([teamRosterId, teamData]) => {
        let totalWins = 0;
        let totalLosses = 0;
        let totalTies = 0;
        Object.keys(teamData.records).forEach(otherRosterId => {
            totalWins += newWhatIfScores[otherRosterId].records[teamRosterId].wins;
            totalLosses += newWhatIfScores[otherRosterId].records[teamRosterId].losses;
            totalTies += newWhatIfScores[otherRosterId].records[teamRosterId].ties;
        });
        const wins = (totalWins / totalRosters).toFixed(1);
        const losses = (totalLosses / totalRosters).toFixed(1);
        let ties = (totalTies / totalRosters).toFixed(1);
        if(ties === '0.0'){
            ties = null;
        }
        newWhatIfScores[teamRosterId].avgRecord = {wins, losses, ties};
    });

    return newWhatIfScores;
}

const POSITION_ORDER = ['QB', 'RB', 'WR', 'TE', 'IDP', 'DEF', 'K'];

export function sortPositions(positions){
    return [...positions].sort((a, b) => {
        const indexA = POSITION_ORDER.indexOf(a);
        const indexB = POSITION_ORDER.indexOf(b);
        if(indexA > indexB){
            return 1;
        }
        if(indexB > indexA){
            return -1;
        }
        return 0;
    });
}

// Sleeper's matchup `starters` array is positional (slot 0 is always the starting QB, etc.)
// for the "skill" slots; anything past slot 9 (or a slot without a fixed position, like most
// leagues' flex spots) needs a real player lookup instead. Returns null when the slot index
// alone doesn't determine the position.
export function defaultPositionForStarterIndex(index){
    if(index === 0){
        return 'QB';
    }
    if([1, 2].includes(index)){
        return 'RB';
    }
    if([3, 4].includes(index)){
        return 'WR';
    }
    if(index === 5){
        return 'TE';
    }
    if(index === 8){
        return 'K';
    }
    if(index === 9){
        return 'DEF';
    }
    return null;
}

// Any position outside the standard fantasy set (e.g. a flex slot's actual player position)
// gets bucketed as IDP for display purposes.
export function normalizePosition(position){
    return ['QB', 'RB', 'WR', 'TE', 'DEF', 'K'].includes(position) ? position : 'IDP';
}
