import React from 'react';

export default function Matchup(props) {
    const {advance, bracket, hidden, matchupIndex, picks, savePicks, t1, teams, winning} = props;
    const teamsByRosterId = Object.entries(teams || {}).reduce((curTeams, [userId, team]) => {
        curTeams[team.rosterId] = {...team, userId: userId, teamId: team.id};
        return curTeams;
    }, {});

    let matchupPicks;
    if (picks) {
        matchupPicks = picks.map(pick => ({...pick}));
    } else if (bracket) {
        matchupPicks = bracket.map(pick => ({...pick}));
    }

    const matchup = matchupPicks?.[matchupIndex];

    let team1 = '';
    let team2 = '';
    if (!matchup) {
        team1 = getDisplayName(t1);
        team2 = 'Bye';
    } else if (matchup) { // team 1 had a bye or it's second round
        if (!(matchup.t1)) {
            matchup.t1 = getTeam('t1_from');
        }
        if (!matchup.t2) {
            matchup.t2 = getTeam('t2_from');
        }
    }

    function getTeam(from) {
        let curAdvance = Object.keys(matchup[from])[0];
        const prevMatchupNum = matchup[from][curAdvance];
        // even in the loser bracket, sleeper is counting the loser as the winner,
        // so we need to flip it
        if (!winning) {
            if (curAdvance === 'w') {
                curAdvance = 'l';
            } else {
                curAdvance = 'w';
            }
        }
        const prevMatchup = matchupPicks.find(match => match.m === prevMatchupNum);
        if (prevMatchup?.[curAdvance]) {
            return prevMatchup[curAdvance];
        }
        if (!(prevMatchup?.t1 && prevMatchup?.t2)) {
            return '';
        }
        return [prevMatchup?.t1, prevMatchup?.t2];
    }

    function getBothTeams(curTeams) {
        return (
            <div style={{display: 'flex', alignItems: 'center', gap: '3px'}}>
                <span className="split-team">{getDisplayName(curTeams[0])}</span>
                <span>/</span>
                <span className="split-team">{getDisplayName(curTeams[1])}</span>
            </div>
        );
    }

    function getDisplayName(team) {
        if (Array.isArray(team)) {
            return getBothTeams(team);
        }

        return teams?.[team]?.displayName || '';
    }

    function updatePick(team) {
        if (!matchup || !team) {
            return;
        }
        if (!(matchup.t1 && matchup.t2 && !Array.isArray(matchup.t1) && !Array.isArray(matchup.t2))) {
            return;
        }

        savePicks(matchup.m, team, matchup.t1 === team ? matchup.t2 : matchup.t1, advance);
    }

    return (<div className={`matchup-container ${hidden ? 'hidden' : ''}`} data-matchup={matchup?.m}>
        <div className={`matchup ${advance === 'w' ? 'win-advance' : 'loss-advance'}`}>
            <div className={`team first ${(matchup?.t1 && matchup.t1 === matchup[advance]) ? 'advance' : ''}`}
                 onClick={() => updatePick(matchup?.t1)} data-team={matchup?.t1}
            >
                {(t1 || (matchup?.t1 && !Array.isArray(matchup?.t1))) ?
                    <div className="img-container">
                        <img src={teamsByRosterId[matchup?.t1 || t1]?.avatar} alt="logo"/>
                    </div>
                    :
                    <div className="img-placeholder"></div>}
                {getDisplayName(matchup?.t1) || team1 || <span>&nbsp;</span>}
            </div>
            <hr/>
            <div className={`team second ${(matchup?.t2 && matchup.t2 === matchup[advance]) ? 'advance' : ''}`}
                 onClick={() => updatePick(matchup?.t2)} data-team={matchup?.t2}
            >
                {(matchup?.t2 && !Array.isArray(matchup?.t2)) ?
                    <div className="img-container">
                        <img src={teamsByRosterId[matchup.t2]?.avatar} alt="logo"/>
                    </div>
                    :
                    <div className="img-placeholder"></div>}
                {getDisplayName(matchup?.t2) || team2 || <span>&nbsp;</span>}
            </div>
        </div>
    </div>);
}