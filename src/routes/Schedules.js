import React, {useEffect, useContext, useState} from 'react';
import AppContext from '../contexts/AppContext';
import LeaguePicker from '../components/LeaguePicker';
import {
    computeWhatIfScores,
    scoresCoverWeeks,
    sortPositions,
    defaultPositionForStarterIndex,
    normalizePosition
} from '../utils/schedules';

function Schedules(){
    const {newestWeek, teams, league, scores, setScores, sierraId} = useContext(AppContext);
    const [leagues, setLeagues] = useState(JSON.parse(localStorage.getItem('leagues')) || {});
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

    useEffect(() => {
        if(!newestWeek || !Object.keys(teams).length){
            return;
        }

        async function fetchScores(){
            const weeks = [];
            let i = 1;
            while (i < newestWeek) {
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
                            position = defaultPositionForStarterIndex(index);

                            if(!position){
                                const playerResponse = await fetch(`https://api.sleeper.com/players/nfl/${starter}`);
                                const playerInfo = await playerResponse.json();
                                position = playerInfo.position;
                                playerPositions[starter] = position;
                            }

                            if(!position){
                                alert(`Error getting position for ${starter}`);
                            }
                        }
                        position = normalizePosition(position);

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
        if(!leagueInfo?.total_rosters || !scoresCoverWeeks(scores, newestWeek)){
            return;
        }

        setWhatIfScores(computeWhatIfScores(scores, newestWeek, leagueInfo.total_rosters));
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
                const {league_id, name, total_rosters, season} = await response.json();
                const newLeagues = {...leagues};
                newLeagues[league] = {league_id, name, total_rosters, season};
                localStorage.setItem('leagues', JSON.stringify(newLeagues));
                setLeagues(newLeagues);
            })();
        }
    }, [league, leagues]);

    useEffect(() => {
        const storedLeagues = JSON.parse(localStorage.getItem('leagues')) || {};
        const missingSeasonIds = Object.keys(storedLeagues).filter(id => !storedLeagues[id]?.season);
        if(!missingSeasonIds.length){
            return;
        }

        (async () => {
            const newLeagues = {...storedLeagues};
            await Promise.all(missingSeasonIds.map(async id => {
                const response = await fetch(`https://api.sleeper.app/v1/league/${id}`);
                if(!response.ok){
                    return;
                }
                const {season} = await response.json();
                if(season){
                    newLeagues[id] = {...newLeagues[id], season};
                }
            }));
            localStorage.setItem('leagues', JSON.stringify(newLeagues));
            setLeagues(newLeagues);
        })();
    }, []);

    if(isInvalidLeague || league === null){
        return (<>
            <h2 style={{textAlign: 'center', marginBottom: '1em'}}>
                {isInvalidLeague ? 'Invalid League ID' : 'Select a League'}
            </h2>
            <div style={{marginBottom: '0.5em'}}>To Find league ID in Sleeper app:</div>
            <div style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1em'}}>
                <span style={{whiteSpace: 'nowrap'}}>"LEAGUE" tab -></span>
                <div style={{whiteSpace: 'nowrap', display: 'flex', alignItems: 'center'}}>
                    <img alt="settings-icon" src="/images/cog.png" style={{height: '24px', width: '24px'}}/>
                    <span>-> General -></span>
                </div>
                <span style={{whiteSpace: 'nowrap'}}>"COPY LEAGUE ID"</span>
            </div>
            <LeaguePicker basePath="schedules" league={league} leagues={leagues}/>
        </>);
    }

    if(newestWeek === 1){
        return (<div>
            <h1 style={{marginBottom: 0}}>Schedules</h1>
            <LeaguePicker basePath="schedules" league={league} leagues={leagues}/>
            <div>No games have finished yet this season — check back once Week 1 wraps up.</div>
        </div>);
    }

    if(!Object.keys(scores).length || !Object.keys(Object.values(scores)[0].positionScores).length || !Object.keys(whatIfScores).length || !leagues){
        return <div>Loading...</div>;
    }

    return (<div>
        <h1 style={{marginBottom: 0}}>Schedules</h1>
        <LeaguePicker basePath="schedules" league={league} leagues={leagues}/>
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
                        <td className="grid-team"><div className="grid-team-name">{nameMap[team.displayName] || (team.teamName || team.displayName)}</div></td>
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
                {sortPositions(Object.keys(Object.values(scores)[0].positionScores)).map(position => (
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
                       const order = sortPositions(Object.keys(positionScores));
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