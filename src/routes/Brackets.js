import React, {useContext, useEffect, useState} from 'react';
import AppContext from '../contexts/AppContext';
import Bracket from '../components/Bracket';
import {onValue, ref} from 'firebase/database';

export default function Brackets() {
    const [winnersBracket, setWinnersBracket] = useState(null);
    const [losersBracket, setLosersBracket] = useState(null);
    const [picks, setPicks] = useState(null);
    const [bracketRef, setBracketRef] = useState(null);
    const {db, league, season, teams} = useContext(AppContext);
    const teamsByRosterId = Object.entries(teams).reduce((curTeams, [userId, team]) => {
        curTeams[team.rosterId] = {...team, userId: userId, teamId: team.id};
        return curTeams;
    }, {});

    const user = new URLSearchParams(window.location.search).get('user');
    const otherUser = new URLSearchParams(window.location.search).get('otherUser');
    useEffect(() => {
        if (!(user || otherUser) || !db || !season) {
            return;
        }
        if (Object.keys(teams).length && !teams[user || otherUser]) {
            alert('Wrong user id');
            return;
        }

        setBracketRef(ref(db, `brackets/${season}/${user || otherUser}`));
    }, [db, season, teams, user, otherUser]);

    useEffect(() => {
        if (!bracketRef) {
            return;
        }

        return onValue(bracketRef, snapshot => {
            const data = snapshot.val();
            setPicks(data);
        });
    }, [bracketRef]);

    useEffect(() => {
        if (!league) {
            return;
        }

        async function fetchBracket() {
            const winnersBracketRes = fetch(`https://api.sleeper.app/v1/league/${league}/winners_bracket`);
            const losersBracketRes = fetch(`https://api.sleeper.app/v1/league/${league}/losers_bracket`);
            const [winnerBracketJson, losersBracketJson] = await Promise.all([winnersBracketRes, losersBracketRes]);
            const [curWinnersBracket, curLosersBracket] = await Promise.all([winnerBracketJson.json(), losersBracketJson.json()]);
            setWinnersBracket(curWinnersBracket);
            setLosersBracket(curLosersBracket);
        }

        fetchBracket();
    }, [league]);

    if (!(winnersBracket && losersBracket)) {
        return <div>Getting brackets</div>;
    }

    return (<div>
        {
            otherUser ? <h1>{`${teams[otherUser]?.displayName}'s Bracket`}</h1> : null
        }
        <Bracket bracket={winnersBracket} bracketRef={bracketRef} picks={picks?.winning} teams={teamsByRosterId}
                 title="Winners Bracket" winning editable={user}
        />
        <div style={{marginTop: '4em'}}></div>
        <Bracket bracket={losersBracket} bracketRef={bracketRef} picks={picks?.losing} teams={teamsByRosterId}
                 title="Losers Bracket" editable={user}
        />
    </div>);
}