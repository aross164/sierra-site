import React, {useEffect, useContext, useState} from 'react';
import AppContext from '../contexts/AppContext';

function Trades(){
    const {newestWeek, teams, league, scores, setScores} = useContext(AppContext);

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
    if(league !== '855884259620188160'){
        nameMap = {};
    }

    const [whatIfScores, setWhatIfScores] = useState({});

    useEffect(() => {
        if(!newestWeek || !Object.keys(teams).length){
            return;
        }

        async function fetchScores(){
            const weeks = [];
            let i = 0;
            while (i <= (newestWeek - 1)) {
                weeks.push(i);
                i++;
            }

            const newScores = Object.values(teams).reduce((initialized, team) => {
                if(!team.rosterId){
                    return initialized;
                }
                initialized[team.rosterId] = {};
                return initialized;
            }, {});

            await Promise.all(weeks.map(async week => {
                const response = await fetch(`https://api.sleeper.app/v1/league/${league}/matchups/${week}`);
                const weekInfo = await response.json();

                weekInfo.forEach((roster) => {
                    newScores[roster.roster_id][week] = {};
                    newScores[roster.roster_id][week].pf = roster.points;

                    const opponent = weekInfo.find(user => user.matchup_id === roster.matchup_id && user.roster_id !== roster.roster_id);
                    newScores[roster.roster_id][week].opponent = opponent.roster_id;
                    newScores[roster.roster_id][week].pa = opponent.points;
                });
            }));

            setScores(newScores);
        }

        fetchScores();
    }, [newestWeek, teams, league, setScores]);

    useEffect(() => {
        if(!Object.keys(scores).length){
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
                wins: (totalWins / 12).toFixed(1),
                losses: (totalLosses / 12).toFixed(1),
                ties: (totalTies / 12).toFixed(1),
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
            const wins = (totalWins / 12).toFixed(1);
            const losses = (totalLosses / 12).toFixed(1);
            let ties = (totalTies / 12).toFixed(1);
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
            while (i <= newestWeek - 1) {
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
    }, [scores, newestWeek]);

    if(!Object.keys(whatIfScores).length){
        return <div>Loading...</div>;
    }

    return (<div>
        <h1>Schedules</h1>
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
                {Object.entries(whatIfScores).map(([rowRosterId, {actualWins, records, trueRecord}]) => {
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
    </div>);
}

export default Trades;