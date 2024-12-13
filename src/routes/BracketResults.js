import React, {useContext, useEffect, useState} from 'react';
import AppContext from '../contexts/AppContext';
import {child, get, ref} from 'firebase/database';

export default function BracketResults() {
    const {db, teams} = useContext(AppContext);
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
                if (round.m === 6) {
                    results[round.w].total += 1;
                    results[round.w].trophies += 1;
                    results[round.l].total += 2;
                    return;
                }
                if (round.m === 7) {
                    if (round.w) {
                        results[round.w].total += 3;
                        results[round.l].total += 4;
                    } else {
                        results[winning[round.t1_from.l - 1].l].total += 3.5;
                        results[winning[round.t2_from.l - 1].l].total += 3.5;
                    }
                    return;
                }
                if (round.m === 5) {
                    if (round.w && results[round.w]) {
                        results[round.w].total += 5;
                        results[round.l].total += 6;
                    } else {
                        results[winning[round.t1_from.l - 1].l].total += 5.5;
                        results[winning[round.t2_from.l - 1].l].total += 5.5;
                    }
                }
            });
            losing.forEach(round => {
                if (round.m === 6) {
                    results[round.w].total += 11;
                    results[round.l].total += 12;
                    results[round.l].trophies += 1;
                    return;
                }
                if (round.m === 7) {
                    if (round.w) {
                        results[round.w].total += 9;
                        results[round.l].total += 10;
                    } else {
                        results[losing[round.t1_from.l - 1].w].total += 9.5;
                        results[losing[round.t2_from.l - 1].w].total += 9.5;
                    }
                    return;
                }
                if (round.m === 5) {
                    if (round.w) {
                        results[round.w].total += 7;
                        results[round.l].total += 8;
                    } else {
                        results[losing[round.t1_from.l - 1].w].total += 7.5;
                        results[losing[round.t2_from.l - 1].w].total += 7.5;
                    }
                }
            });
            return results;
        }, init);
        setTeamResults(newResults);
    }, [brackets]);

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
                    <td data-user={totals.userId}>{teams[totals.userId]?.displayName}</td>
                    <td>{(totals.total / Object.keys(brackets).length).toFixed(1)}</td>
                    <td>{totals.trophies}</td>
                </tr>)}
                </tbody>
            </table>
        </div>
    </div>);
}