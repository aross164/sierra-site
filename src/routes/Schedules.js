import React, {useEffect, useContext} from 'react';
import AppContext from '../contexts/AppContext';

const nameMap = {
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

function Trades(){
    const {newestWeek, teams, league, scores, setScores} = useContext(AppContext);

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

    if(!Object.keys(scores).length){
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Schedules</h1>
            <div style={{overflow: 'auto'}}>
                <table className="schedules">
                    <thead>
                    <tr>
                        <th>Team</th>
                        {Object.keys(scores).map(rosterId => (
                            <th key={rosterId}>
                                {nameMap[Object.values(teams)
                                               .find(team => parseInt(team.rosterId) === parseInt(rosterId)).displayName]}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {Object.keys(scores).map(rowRosterId => {
                        const team = Object.values(teams)
                                           .find(team => parseInt(team.rosterId) === parseInt(rowRosterId));
                        const actualWins = getRecord(rowRosterId, rowRosterId).wins;
                        return (
                            <tr key={rowRosterId}>
                                <td>{nameMap[team.displayName]}</td>
                                {Object.keys(scores).map(columnRosterId => {
                                    const {wins, losses, ties} = getRecord(rowRosterId, columnRosterId);
                                    let colorClass;
                                    if(rowRosterId === columnRosterId){
                                        colorClass = 'same';
                                    } else if(actualWins < wins){
                                        colorClass = 'more';
                                    } else if(actualWins > wins){
                                        colorClass = 'less';
                                    }
                                    return (
                                        <td key={columnRosterId}
                                            className={colorClass}>{wins}&nbsp;-&nbsp;{losses}{ties ?
                                            <span>&nbsp;-&nbsp;{ties}</span> : null}</td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Trades;