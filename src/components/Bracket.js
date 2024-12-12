import React, {useContext, useEffect, useState} from 'react';
import Matchup from './Matchup';
import {update} from 'firebase/database';

export default function Bracket(props) {
    const {bracket, bracketRef, picks, teams, title, winning} = props;

    const advance = winning ? 'w' : 'l';

    async function savePicks(matchupNum, team, otherTeam, curAdvance) {
        if (!bracketRef) {
            return;
        }

        const newSavedPicks = {};
        const type = winning ? 'winning' : 'losing';
        let newPicks;
        if (picks) {
            newPicks = picks.map(pick => ({...pick}));
        } else {
            newPicks = bracket.map(pick => ({...pick}));
        }
        const matchupIndex = newPicks.findIndex(match => match.m === matchupNum);
        newPicks[matchupIndex][curAdvance] = team;
        newPicks[matchupIndex][curAdvance === 'w' ? 'l' : 'w'] = otherTeam;
        newSavedPicks[`/${type}`] = newPicks;

        newPicks.forEach((round, index) => {
            if(index <= matchupIndex) {
                return;
            }
            if(round.w === otherTeam){
                round.w = null;
            } else if(round.l === otherTeam){
                round.l = null;
            }
        })

        try {
            await update(bracketRef, newSavedPicks);
        } catch (e) {
            console.log(e);
            alert('Error saving pick. Try again or refresh.');
        }
    }

    return (<div className="bracket-container">
        <h2>{title}</h2>
        <div className="bracket">
            <div className="round first-round">
                <Matchup t1={bracket[2].t1} teams={teams}/>
                <Matchup bracket={bracket} matchupIndex={0} picks={picks} savePicks={savePicks} teams={teams}
                         advance={advance} winning={winning}
                />
                <Matchup t1={bracket[3].t1} teams={teams}/>
                <Matchup bracket={bracket} matchupIndex={1} picks={picks} savePicks={savePicks} teams={teams}
                         advance={advance} winning={winning}
                />
                <Matchup hidden/>
            </div>
            <div className="round second-round">
                {/*<Matchup hidden/>*/}
                <Matchup bracket={bracket} matchupIndex={2} picks={picks} savePicks={savePicks} teams={teams}
                         advance={advance} winning={winning}
                />
                <Matchup hidden/>
                <Matchup bracket={bracket} matchupIndex={3} picks={picks} savePicks={savePicks} teams={teams}
                         advance={advance} winning={winning}
                />
                <Matchup bracket={bracket} matchupIndex={4} picks={picks} savePicks={savePicks} teams={teams}
                         advance="w" winning={winning}
                />
            </div>
            <div className="round third-round">
                {/*<Matchup hidden />*/}
                <Matchup bracket={bracket} matchupIndex={5} picks={picks} savePicks={savePicks} teams={teams}
                         advance={advance} winning={winning}
                />
                <Matchup bracket={bracket} matchupIndex={6} picks={picks} savePicks={savePicks} teams={teams}
                         advance="w" winning={winning}
                />
            </div>
        </div>
    </div>);
}