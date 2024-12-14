import React, {useContext, useEffect, useState} from 'react';
import AppContext from '../contexts/AppContext';
import {child, get, ref} from 'firebase/database';
import {Link} from 'react-router-dom';

export default function BracketResults() {
    const {db, league, teams} = useContext(AppContext);
    const [brackets, setBrackets] = useState({});
    const [teamResults, setTeamResults] = useState([]);

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
        if (!Object.values(brackets).length || !Object.values(teams).length) {
            return;
        }

        const init = Object.entries(teams).reduce((result, [userId, team]) => {
            result[team.rosterId] = {
                userId,
                total: 0,
                trophies: 0
            };
            return result;
        }, {});

        const newResults = Object.values(brackets).reduce((results, userBrackets) => {
            const {winning, losing} = userBrackets;
            winning.forEach(round => {
                if(!round.p){
                    return;
                }
                if (round.p === 1) {
                    results[round.w].trophies += 1;
                }
                if(round.w){
                    results[round.w].total += round.p
                    results[round.l].total += round.p + 1;
                } else {
                    results[winning[round.t1_from.l - 1].l].total += round.p + 0.5;
                    results[winning[round.t2_from.l - 1].l].total += round.p + 0.5;
                }
            });
            losing.forEach(round => {
                if(!round.p) {
                    return;
                }
                // losers bracket still uses 1st/3rd/5th places games, so subtract from 12 to get place
                if (round.p === 1) {
                    results[round.l].trophies += 1;
                }
                if(round.w){
                    results[round.w].total += 12 - round.p;
                    results[round.l].total += 12 - round.p + 1;
                } else {
                    results[losing[round.t1_from.l - 1].w].total += 12 - round.p + 0.5;
                    results[losing[round.t2_from.l - 1].w].total += 12 - round.p + 0.5;
                }
            });
            return results;
        }, init);
        setTeamResults(newResults);
    }, [brackets, teams]);

    if (!Object.keys(brackets).length) {
        return <div>Adding up bracket results...</div>;
    }

    return (<div className="bracket-results">
        <h1>Bracket Results</h1>
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
                    <td data-user={totals.userId}>
                        {brackets[totals.userId] ?
                            <Link to={`/brackets?league=${league}&otherUser=${totals.userId}`}>
                                {teams[totals.userId]?.displayName}
                            </Link>
                            : teams[totals.userId]?.displayName
                        }
                    </td>
                    <td>{(totals.total / Object.keys(brackets).length).toFixed(1)}</td>
                    <td>{totals.trophies}</td>
                </tr>)}
                </tbody>
            </table>
        </div>
    </div>);
}