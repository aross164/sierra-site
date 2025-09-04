import React, {useEffect, useContext, useState} from 'react';
import AppContext from '../contexts/AppContext';

function Schedules(){
    const {newestWeek, teams, league, scores, setScores, sierraId} = useContext(AppContext);
    const [leagues, setLeagues] = useState(JSON.parse(localStorage.getItem('leagues')) || {});
    const [newLeagueId, setNewLeagueId] = useState('');
    const [isInvalidLeague, setIsInvalidLeague] = useState(false);
    const [positionSort, setPositionSort] = useState('QB');

    const leagueInfo = leagues && leagues[league];

    let nameMap = {
        rossAlex: 'AlR',
        ChiefRainwater: 'AvR',
        RyanYarbrough: 'RY',
        DRYAN6: 'DeR',
        bellyyyy: 'CB',
        cnave21: 'CN',
        danrobe: 'DaR',
        DartySZN: 'BL',
        bamuzny: 'BM',
        HThrash21: 'HT',
        ChillBill96: 'WN',
        jgermash1: 'JG'
    };
    if(league !== sierraId){
        nameMap = {};
    }

    const [whatIfScores, setWhatIfScores] = useState({});

    function goToLeague(){
        if(!newLeagueId || isNaN(newLeagueId)){
            alert('League ID must be a number');
            return;
        }

        window.location.replace(`${window.location.origin}/schedules?league=${newLeagueId}`);
    }

    useEffect(() => {
        if(!newestWeek || !Object.keys(teams).length){
            return;
        }

        async function fetchScores(){
            const weeks = [];
            let i = 0;
            while (i < (newestWeek)) {
                weeks.push(i);
                i++;
            }

            const newScores = Object.values(teams).reduce((initialized, team) => {
                if(!team.rosterId){
                    return initialized;
                }
                initialized[team.rosterId] = {
                    positionScores: {}
                };
                return initialized;
            }, {});

            const playerPositions = {};

            await Promise.all(weeks.map(async week => {
                const response = await fetch(`https://api.sleeper.app/v1/league/${league}/matchups/${week}`);
                const weekInfo = await response.json();

                return await Promise.all(weekInfo.map(async roster => {
                    newScores[roster.roster_id][week] = {};
                    newScores[roster.roster_id][week].pf = roster.points;

                    const opponent = weekInfo.find(user => user.matchup_id === roster.matchup_id && user.roster_id !== roster.roster_id);
                    newScores[roster.roster_id][week].opponent = opponent.roster_id;
                    newScores[roster.roster_id][week].pa = opponent.points;

                    return await Promise.all(roster.starters.map(async (starter, index) => {
                        let position = playerPositions[starter];

                        if(!position){
                            if(index === 0){
                                position = 'QB';
                            } else if([1, 2].includes(index)){
                                position = 'RB';
                            } else if([3, 4].includes(index)){
                                position = 'WR';
                            } else if(index === 5){
                                position = 'TE';
                            } else if(index === 8){
                                position = 'K';
                            } else if(index === 9){
                                position = 'DEF';
                            } else{
                                const playerResponse = await fetch(`https://api.sleeper.com/players/nfl/${starter}`);
                                const playerInfo = await playerResponse.json();
                                position = playerInfo.position;
                                playerPositions[starter] = position;
                            }

                            if(!position){
                                alert(`Error getting position for ${starter}`);
                            }
                        }
                        if(!['QB', 'RB', 'WR', 'TE', 'DEF', 'K'].includes(position)){
                            position = 'IDP';
                        }

                        if(!newScores[roster.roster_id].positionScores[position]){
                            newScores[roster.roster_id].positionScores[position] = {points: 0, numPlayers: 0};
                        }
                        newScores[roster.roster_id].positionScores[position].numPlayers++;
                        if(isNaN(roster.players_points[starter])){
                            // I assume this means they left the sport empty
                            return;
                        }
                        newScores[roster.roster_id].positionScores[position].points += roster.players_points[starter];
                    }));
                }));
            }));

            setScores(newScores);
        }

        fetchScores();
    }, [newestWeek, teams, league, setScores]);

    useEffect(() => {
        if(!Object.keys(scores).length || !leagueInfo?.total_rosters){
            return;
        }

        const newWhatIfScores = {};
        Object.keys(scores).forEach(rowRosterId => {
            newWhatIfScores[rowRosterId] = {};
            newWhatIfScores[rowRosterId].actualWins = getRecord(rowRosterId, rowRosterId).wins;
            newWhatIfScores[rowRosterId].records = {};

            let totalWins = 0;
            let totalLosses = 0;
            let totalTies = 0;
            Object.keys(scores).forEach(columnRosterId => {
                const {wins, losses, ties} = getRecord(rowRosterId, columnRosterId);
                newWhatIfScores[rowRosterId].records[columnRosterId] = {wins, losses, ties};

                totalWins += wins;
                totalLosses += losses;
                totalTies += ties;
            });
            newWhatIfScores[rowRosterId].trueRecord = {
                wins: (totalWins / leagueInfo.total_rosters).toFixed(1),
                losses: (totalLosses / leagueInfo.total_rosters).toFixed(1),
                ties: (totalTies / leagueInfo.total_rosters).toFixed(1),
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
            const wins = (totalWins / leagueInfo.total_rosters).toFixed(1);
            const losses = (totalLosses / leagueInfo.total_rosters).toFixed(1);
            let ties = (totalTies / leagueInfo.total_rosters).toFixed(1);
            if(ties === '0.0'){
                ties = null;
            }
            newWhatIfScores[teamRosterId].avgRecord = {wins, losses, ties};
        });

        setWhatIfScores(newWhatIfScores);

        function getRecord(rowRosterId, columnRosterId){
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
    }, [scores, newestWeek, leagueInfo]);

    useEffect(() => {
        if(!league){
            return;
        }

        if(!leagues || !leagues[league]?.total_rosters){
            (async () => {
                const response = await fetch(`https://api.sleeper.app/v1/league/${league}`);
                if(response.status === 404){
                    setIsInvalidLeague(true);
                    return;
                }
                const {league_id, name, total_rosters} = await response.json();
                const newLeagues = {...leagues};
                newLeagues[league] = {league_id, name, total_rosters};
                localStorage.setItem('leagues', JSON.stringify(newLeagues));
                setLeagues(newLeagues);
            })();
        }
    }, [league, leagues]);

    if(isInvalidLeague || league === null){
        return (<>
            <h2 style={{textAlign: 'center', marginBottom: '1em'}}>Invalid League ID</h2>
            <div style={{marginBottom: '0.5em'}}>To Find league ID in Sleeper app:</div>
            <div style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1em'}}>
                <span style={{whiteSpace: 'nowrap'}}>"LEAGUE" tab -></span>
                <div style={{whiteSpace: 'nowrap', display: 'flex', alignItems: 'center'}}>
                    <img alt="settings-icon" src="/images/cog.png" style={{height: '24px', width: '24px'}}/>
                    <span>-> General -></span>
                </div>
                <span style={{whiteSpace: 'nowrap'}}>"COPY LEAGUE ID"</span>
            </div>
            <label htmlFor="add-league">Add League: </label>
            <input value={newLeagueId} onChange={e => setNewLeagueId(e.target.value)} type="number"
                   placeholder="League ID"/>
            <button
                onClick={goToLeague}>
                Go
            </button>
        </>);
    }

    if(newestWeek === 1){
        return <div>No games played yet</div>
    }

    if(!Object.keys(scores).length || !Object.keys(Object.values(scores)[0].positionScores).length || !Object.keys(whatIfScores).length || !leagues){
        return <div>Loading...</div>;
    }

    return (<div>
        <h1 style={{marginBottom: 0}}>Schedules</h1>
        <div>
            <label htmlFor="league">League: </label>
            <select defaultValue={league} id="league"
                    onChange={e => window.location.replace(`${window.location.origin}/schedules?league=${e.target.value}`)}>
                {Object.entries(leagues)
                       .map(([league_id, {name}]) => (<option key={league_id} value={league_id}>{name}</option>))}
            </select>
        </div>
        <div style={{marginBottom: '1.33em'}}>
            <label htmlFor="add-league">Add League: </label>
            <input value={newLeagueId} onChange={e => setNewLeagueId(e.target.value)} type="number"
                   placeholder="League ID"/>
            <button
                onClick={goToLeague}>
                Go
            </button>
        </div>
        <h2>Grid</h2>
        <div style={{overflow: 'auto'}}>
            <table className="schedules">
                <thead>
                <tr>
                    <th>Team</th>
                    {Object.keys(scores).map(rosterId => {
                        const team = Object.values(teams)
                                           .find(team => parseInt(team.rosterId) === parseInt(rosterId));
                        return (<th key={rosterId} className="grid-team">
                            {nameMap[team.displayName] || (team.teamName || team.displayName)}
                        </th>);
                    })}
                </tr>
                </thead>
                <tbody>
                {Object.entries(whatIfScores).map(([rowRosterId, {actualWins, records}]) => {
                    const team = Object.values(teams)
                                       .find(team => parseInt(team.rosterId) === parseInt(rowRosterId));
                    return (<tr key={rowRosterId}>
                        <td className="grid-team">{nameMap[team.displayName] || (team.teamName || team.displayName)}</td>
                        {Object.entries(records).map(([columnRosterId, {wins, losses, ties}]) => {
                            let colorClass;
                            if(rowRosterId === columnRosterId){
                                colorClass = 'same';
                            } else if(actualWins < wins){
                                colorClass = 'more';
                            } else if(actualWins > wins){
                                colorClass = 'less';
                            }
                            return (<td key={columnRosterId}
                                        className={colorClass}>{wins}&nbsp;-&nbsp;{losses}{ties ?
                                <span>&nbsp;-&nbsp;{ties}</span> : null}</td>);
                        })}
                    </tr>);
                })}
                </tbody>
            </table>
        </div>
        <div className="table-title">
            <h2>True Records</h2>
            <div className="clarification"><span>* Average record from playing all schedules</span></div>
        </div>
        <table className="schedules">
            <tbody>
            {Object.entries(whatIfScores).sort((a, b) => b[1].trueRecord.wins - a[1].trueRecord.wins)
                   .map(([rowRosterId, {trueRecord}], index) => {
                       const team = Object.values(teams)
                                          .find(team => parseInt(team.rosterId) === parseInt(rowRosterId));
                       const {wins, losses, ties} = trueRecord;
                       return <tr key={rowRosterId}>
                           <td>{index + 1}</td>
                           <td style={{textAlign: 'left'}}>{team.teamName || team.displayName} {nameMap[team.displayName] ?
                               <span>({nameMap[team.displayName]})</span> : null}</td>
                           <td>
                               {wins}&nbsp;-&nbsp;{losses}{ties !== '0.0' ? <span>&nbsp;-&nbsp;{ties}</span> : null}
                           </td>
                       </tr>;
                   })}
            </tbody>
        </table>
        <div className="table-title">
            <h2>Hardest Schedules</h2>
            <div className="clarification"><span>* Average record with team's schedule</span></div>
        </div>
        <table className="schedules">
            <tbody>
            {Object.entries(whatIfScores).sort((a, b) => a[1].avgRecord.wins - b[1].avgRecord.wins)
                   .map(([rowRosterId, {avgRecord}], index) => {
                       const team = Object.values(teams)
                                          .find(team => parseInt(team.rosterId) === parseInt(rowRosterId));
                       const {wins, losses, ties} = avgRecord;
                       return <tr key={rowRosterId}>
                           <td>{index + 1}</td>
                           <td style={{textAlign: 'left'}}>{team.teamName || team.displayName} {nameMap[team.displayName] ?
                               <span>({nameMap[team.displayName]})</span> : null}</td>
                           <td>
                               {wins}&nbsp;-&nbsp;{losses}{ties ? <span>&nbsp;-&nbsp;{ties}</span> : null}
                           </td>
                       </tr>;
                   })}
            </tbody>
        </table>
        <div className="table-title">
            <h2>Avg. Per Position</h2>
            <div className="clarification"><span>* tap position name to sort</span></div>
        </div>
        <table className="schedules">
            <thead>
            <tr>
                <th></th>
                <th>Team</th>
                {Object.keys(Object.values(scores)[0].positionScores).sort((a, b) => {
                    const sort = ['QB', 'RB', 'WR', 'TE', 'IDP', 'DEF', 'K'];
                    const indexA = sort.indexOf(a);
                    const indexB = sort.indexOf(b);
                    if(indexA > indexB){
                        return 1;
                    }
                    if(indexB > indexA){
                        return -1;
                    }
                    return 0;
                }).map(position => (
                    <th key={position} style={{cursor: 'pointer', fontWeight: positionSort === position ? 'bold' : 'normal'}}
                        onClick={() => setPositionSort(position)}>{position}
                    </th>
                ))}
            </tr>
            </thead>
            <tbody>
            {Object.entries(scores)
                   .sort((a, b) => b[1].positionScores[positionSort].points / b[1].positionScores[positionSort].numPlayers - a[1].positionScores[positionSort].points / a[1].positionScores[positionSort].numPlayers)
                   .map(([rowRosterId, {positionScores}], index) => {
                       const team = Object.values(teams)
                                          .find(team => parseInt(team.rosterId) === parseInt(rowRosterId));
                       const sort = ['QB', 'RB', 'WR', 'TE', 'IDP', 'DEF', 'K'];
                       const order = Object.keys(positionScores).sort((a, b) => {
                           const indexA = sort.indexOf(a);
                           const indexB = sort.indexOf(b);
                           if(indexA > indexB){
                               return 1;
                           }
                           if(indexB > indexA){
                               return -1;
                           }
                           return 0;
                       });
                       return (<tr key={rowRosterId}>
                           <td>{index + 1}</td>
                           <td style={{textAlign: 'left'}}>{nameMap[team.displayName] || (team.teamName || team.displayName)}</td>
                           {order.map(position => (
                               <td key={position}>{(positionScores[position].points / positionScores[position].numPlayers).toFixed(1)}</td>))}
                       </tr>);
                   })}
            </tbody>
        </table>
    </div>);
}

export default Schedules;