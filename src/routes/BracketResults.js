import React, {useContext, useEffect, useState} from 'react';
import AppContext from '../contexts/AppContext';
import {child, get, ref} from 'firebase/database';
import {Link, useNavigate} from 'react-router-dom';
import WaSelect from '@awesome.me/webawesome/dist/react/select/index.js';
import WaOption from '@awesome.me/webawesome/dist/react/option/index.js';
import useWaSelectChange from '../hooks/useWaSelectChange';
import {scoreBrackets} from '../utils/bracketScoring';

export default function BracketResults() {
    const {db, league, teams, season, sierraLeagueIds, bracketLeagueOptions} = useContext(AppContext);
    const [brackets, setBrackets] = useState({});
    const [teamResults, setTeamResults] = useState({});
    const [bracketPoints, setBracketPoints] = useState({});
    const [winnersBracket, setWinnersBracket] = useState(null);
    const [losersBracket, setLosersBracket] = useState(null);
    const navigate = useNavigate();

    if (league && sierraLeagueIds && !sierraLeagueIds.includes(league)) {
        window.location.replace(`${window.location.origin}/schedules?league=${league}`);
    }

    const seasonSelectRef = useWaSelectChange(
        selectedLeague => navigate(`/bracketresults?league=${selectedLeague}`)
    );

    const selectedSeasonLeague = bracketLeagueOptions?.some(([, optionLeague]) => optionLeague === league) ? league : undefined;

    const seasonSelect = bracketLeagueOptions?.length > 1 && (
        <WaSelect ref={seasonSelectRef} label="Season" value={selectedSeasonLeague} placeholder="Select a season"
                  style={{maxWidth: '10em', marginBottom: '1em'}}>
            {bracketLeagueOptions.map(([optionSeason, optionLeague]) => (
                <WaOption key={optionLeague} value={optionLeague}>{optionSeason}</WaOption>
            ))}
        </WaSelect>
    );

    useEffect(() => {
        if (!db || !season) {
            return;
        }

        const dbRef = ref(db);
        try {
            get(child(dbRef, `brackets/${season}`)).then(snapshot => {
                if (snapshot.exists()) {
                    setBrackets(snapshot.val());
                }
            }).catch(err => console.error('Failed to fetch brackets:', err));
        } catch (err) {
            console.error('Failed to fetch brackets:', err);
        }
    }, [db, season]);

    useEffect(() => {
        if (!Object.values(brackets).length || !Object.values(teams).length || !winnersBracket || !losersBracket) {
            return;
        }

        const {bracketPoints: newScores, teamResults: newResults} = scoreBrackets(brackets, teams, winnersBracket, losersBracket);
        setBracketPoints(newScores);
        setTeamResults(newResults);
    }, [brackets, teams, winnersBracket, losersBracket]);

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

    if (!Object.keys(brackets).length) {
        return (<div>
            {seasonSelect}
            <div>Adding up bracket results...</div>
        </div>);
    }

    return (<div className="bracket-results">
        <h1>Bracket Results</h1>
        <div style={{display: 'flex', justifyContent: 'center'}}>{seasonSelect}</div>
        <h2>Predictions</h2>
        <div className="table-container">
            <table>
                <thead>
                <tr>
                    <th>Team</th>
                    <th>Finish</th>
                    <th>🏆</th>
                </tr>
                </thead>
                <tbody>
                {Object.values(teamResults).toSorted((a, b) => {
                    if (a.total > b.total) {
                        return 1;
                    }
                    if (a.total < b.total) {
                        return -1;
                    }
                    if ((a.total / 10) <= 6) {
                        if (a.trophies > b.trophies) {
                            return -1;
                        }
                        if (a.trophies < b.trophies) {
                            return 1;
                        }
                        return 0;
                    }
                    if (a.trophies > b.trophies) {
                        return 1;
                    }
                    if (a.trophies < b.trophies) {
                        return -1;
                    }
                    return 0;
                }).map((totals) => <tr key={totals.userId}>
                    <td data-user={totals.userId}>{teams[totals.userId]?.displayName}
                    </td>
                    <td>{(totals.total / Object.keys(brackets).length).toFixed(1)}</td>
                    <td>{totals.trophies}</td>
                </tr>)}
                </tbody>
            </table>
        </div>
        <h2 style={{marginTop: '2em'}}>Scores</h2>
        <div className="table-container">
            <table>
                <thead>
                <tr>
                    <th>Team</th>
                    <th>Points</th>
                    <th>Max</th>
                </tr>
                </thead>
                <tbody>
                {Object.values(bracketPoints).toSorted((a, b) => {
                    if (a.total > b.total) {
                        return -1;
                    }
                    if (a.total < b.total) {
                        return 1;
                    }
                    if ((a.losersPotential + a.winnersPotential) > (b.losersPotential + b.winnersPotential)) {
                        return -1;
                    }
                    if ((a.losersPotential + a.winnersPotential) < (b.losersPotential + b.winnersPotential)) {
                        return 1;
                    }
                    return 0;
                }).filter(totals => totals.total + totals.winnersPotential + totals.losersPotential + totals.eliminated.length).map((totals) => <tr
                    key={totals.userId}
                >
                    <td data-user={totals.userId}>
                        <Link to={`/brackets?league=${league}&otherUser=${totals.userId}`}>
                            {teams[totals.userId]?.displayName}
                        </Link>
                    </td>
                    <td>{(totals.total)}</td>
                    <td>{totals.total + totals.losersPotential + totals.winnersPotential}</td>
                </tr>)}
                </tbody>
            </table>
        </div>
    </div>);
}