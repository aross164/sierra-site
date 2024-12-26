import React, {useContext, useEffect, useState} from 'react';
import AppContext from '../contexts/AppContext';
import {child, get, ref} from 'firebase/database';
import {Link} from 'react-router-dom';

export default function BracketResults() {
    const {db, league, teams} = useContext(AppContext);
    const [brackets, setBrackets] = useState({});
    const [teamResults, setTeamResults] = useState({});
    const [bracketPoints, setBracketPoints] = useState({});
    const [winnersBracket, setWinnersBracket] = useState(null);
    const [losersBracket, setLosersBracket] = useState(null);

    useEffect(() => {
        if (!db) {
            return;
        }

        const dbRef = ref(db);
        try {
            get(child(dbRef, 'brackets/2024')).then(snapshot => {
                if (snapshot.exists()) {
                    setBrackets(snapshot.val());
                }
            });
        } catch (err) {
        }
    }, [db]);

    useEffect(() => {
        if (!Object.values(brackets).length || !Object.values(teams).length || !winnersBracket || !losersBracket) {
            return;
        }

        const newScores = {};
        const init = Object.entries(teams).reduce((result, [userId, team]) => {
            result[team.rosterId] = {
                userId,
                total: 0,
                trophies: 0
            };
            newScores[userId] = {
                userId,
                total: 0,
                winnersPotential: 0,
                losersPotential: 0,
                eliminated: [],
            };
            return result;
        }, {});

        const newResults = Object.entries(brackets).reduce((results, [userId, userBrackets]) => {
            const {winning, losing} = userBrackets;
            //TODO: abstact the scoring logic for winners/losers bracket
            winning.forEach((round, index) => {
                if (!round.p || round.p === 1) {
                    if (round.w === winnersBracket[index].w) {
                        newScores[userId].total += 2 ** (round.r - 1) * 10;
                    }
                    if (winnersBracket[index].l) {
                        newScores[userId].eliminated.push(winnersBracket[index].l);
                    } else if (!newScores[userId].eliminated.includes(round.w)) {
                        newScores[userId].winnersPotential += 2 ** (round.r - 1) * 10;
                    }
                } else {
                    if (round.w === winnersBracket[index].w) {
                        newScores[userId].total += 10;
                    } else if(!winnersBracket[index].w){
                        if (round.p === 5 && round.w && ![winnersBracket[0].w, winnersBracket[1].w].includes(round.w)) {
                            newScores[userId].winnersPotential += 10;
                        } else if (round.p === 3 && round.w && ![winnersBracket[0].l, winnersBracket[1].l, winnersBracket[2].w, winnersBracket[3].w].includes(round.w)) {
                            newScores[userId].winnersPotential += 10;
                        }
                    }
                }

                if (!round.p) {
                    return;
                }
                if (round.p === 1) {
                    results[round.w].trophies += 1;
                }
                if (round.w) {
                    results[round.w].total += round.p;
                    results[round.l].total += round.p + 1;
                } else {
                    results[winning[round.t1_from.l - 1].l].total += round.p + 0.5;
                    results[winning[round.t2_from.l - 1].l].total += round.p + 0.5;
                }
            });
            losing.forEach((round, index) => {
                if (!round.p || round.p === 1) {
                    if (round.l === losersBracket[index].w) {
                        newScores[userId].total += 2 ** (round.r - 1) * 10;
                    }
                    if (losersBracket[index].l) {
                        newScores[userId].eliminated.push(losersBracket[index].l);
                    } else if (!newScores[userId].eliminated.includes(round.l)) {
                        newScores[userId].losersPotential += 2 ** (round.r - 1) * 10;
                    }
                } else {
                    if (round.w === losersBracket[index].w) {
                        newScores[userId].total += 10;
                    } else if (!losersBracket[index].w){
                        if (round.p === 5 && round.w && ![losersBracket[0].w, losersBracket[1].w].includes(round.w)) {
                            newScores[userId].losersPotential += 10;
                        } else if (round.p === 3 && round.w && ![losersBracket[0].l, losersBracket[1].l, losersBracket[2].w, losersBracket[3].w].includes(round.w)) {
                            newScores[userId].losersPotential += 10;
                        }
                    }
                }

                if (!round.p) {
                    return;
                }
                // losers bracket still uses 1st/3rd/5th places games, so subtract from 12 to get place
                if (round.p === 1) {
                    results[round.l].trophies += 1;
                }
                if (round.w) {
                    results[round.w].total += 12 - round.p;
                    results[round.l].total += 12 - round.p + 1;
                } else {
                    results[losing[round.t1_from.l - 1].w].total += 12 - round.p + 0.5;
                    results[losing[round.t2_from.l - 1].w].total += 12 - round.p + 0.5;
                }
            });
            return results;
        }, init);
        setBracketPoints(newScores);
        setTeamResults(newResults);
    }, [brackets, teams, winnersBracket, losersBracket]);

    useEffect(() => {
        if (!league) {
            return;
        }
        fetchBracket();
        // eslint-disable-next-line
    }, [league]);

    async function fetchBracket() {
        const winnersBracketRes = fetch(`https://api.sleeper.app/v1/league/${league}/winners_bracket`);
        const losersBracketRes = fetch(`https://api.sleeper.app/v1/league/${league}/losers_bracket`);
        const [winnerBracketJson, losersBracketJson] = await Promise.all([winnersBracketRes, losersBracketRes]);
        const [curWinnersBracket, curLosersBracket] = await Promise.all([winnerBracketJson.json(), losersBracketJson.json()]);
        setWinnersBracket(curWinnersBracket);
        setLosersBracket(curLosersBracket);
    }

    if (!Object.keys(brackets).length) {
        return <div>Adding up bracket results...</div>;
    }

    return (<div className="bracket-results">
        <h1>Bracket Results</h1>
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