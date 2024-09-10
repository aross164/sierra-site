import React, {useContext, useEffect, useState} from 'react';
import AppContext from '../contexts/AppContext';
import {fetchPlayerInfo} from "../utils/utils";

function Trades(){
    const {newestWeek, league, teams, sierraId, season} = useContext(AppContext);

    if(league && league !== sierraId){
        window.location.replace(`${window.location.origin}/schedules?league=${league}`)
    }

    const [trades, setTrades] = useState([]);
    const [players, setPlayers] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if(!newestWeek){
            return;
        }

        async function fetchTrades(){
            const weeks = [];
            let i = 0;
            while (i <= newestWeek) {
                weeks.push(i);
                i++;
            }

            let newTrades = [];
            await Promise.all(weeks.map(async week => {
                const response = await fetch(`https://api.sleeper.app/v1/league/${league}/transactions/${week}`);
                const transactions = await response.json();
                const curTrades = transactions.filter(transaction => transaction.type === 'trade')
                                              .map(trade => ({
                                                  ...trade,
                                                  week,
                                                  adds: Object.entries(trade.adds)
                                                              .map(([playerId, rosterId]) => ({playerId, rosterId}))
                                                              .reduce((grouped, add) => {
                                                                  if(!grouped[add.rosterId]){
                                                                      grouped[add.rosterId] = [];
                                                                  }
                                                                  grouped[add.rosterId].push(add);
                                                                  return grouped;
                                                              }, {})
                                              }));
                newTrades = newTrades.concat(curTrades);
            }));

            const uniquePlayers = [];
            newTrades.forEach(trade => {
                Object.values(trade.adds).forEach(addGroup => {
                    addGroup.forEach(({playerId}) => {
                        if(!uniquePlayers.includes(playerId)){
                            uniquePlayers.push(playerId);
                        }
                    });
                });
            });

            const newPlayers = {};
            await Promise.all(uniquePlayers.map(async playerId => {
                newPlayers[playerId] = await fetchPlayer(playerId);
            }));
            setPlayers(newPlayers);

            newTrades.forEach(trade => {
                Object.values(trade.adds).forEach(addGroup => {
                    addGroup.forEach(add => {
                        const stats = Object.entries(newPlayers[add.playerId].stats);
                        let numWeeks = 0;
                        let totalPoints = 0;
                        stats.forEach(([week, weekStats]) => {
                            const tradeWeek = getTradeWeek(trade);
                            if(week < tradeWeek || !(weekStats?.stats.off_snp || weekStats?.stats.def_snp)){
                                // probably didn't play
                                return;
                            }
                            numWeeks++;
                            let points = weekStats.stats.pts_ppr || 0;
                            if(newPlayers[add.playerId].position === 'QB'){
                                // sleeper only counts INTs as -1
                                points -= weekStats.stats.pass_int * 1;
                            }
                            totalPoints += points;
                        });
                        if(numWeeks){
                            add.points = totalPoints;
                            add.average = totalPoints / numWeeks;
                        }
                    });
                });
            });

            const groupedTrades = newTrades.reduce((grouped, trade) => {
                const week = getTradeWeek(trade);

                if(!grouped[week]){
                    grouped[week] = [];
                }
                grouped[week].push(trade);
                return grouped;
            }, {});

            setTrades(groupedTrades);
            setLoading(false);
        }

        async function fetchPlayer(playerId){
            const playerResponse = fetchPlayerInfo(playerId);
            const statsResponse = fetch(`https://api.sleeper.com/stats/nfl/player/${playerId}?season_type=regular&season=${season}&grouping=week`);
            const promises = await Promise.all([playerResponse, statsResponse]);
            const [playerData, statsData] = await Promise.all([promises[0], promises[1].json()]);
            playerData.stats = statsData;
            return playerData;
        }

        function getTradeWeek(trade){
            let week = trade.week;

            const date = new Date(trade.status_updated);
            const dayName = date.toLocaleString("en-US", {
                timeZone: "America/Chicago",
                weekday: 'long'
            });
            if(['Monday', 'Tuesday'].includes(dayName)){ // really need to see if players already played before trade
                week++;
            }

            return week;
        }

        fetchTrades();
    }, [newestWeek, league, season]);

    if(loading){
        return <div>Loading</div>;
    }

    if(!Object.keys(trades).length){
        return <div>No trades</div>;
    }

    return (
        <div className="trades-page flex justify-center">
            <div>
                <h1>Trades</h1>
                {Object.entries(trades).map(([week, curTrades]) => (
                    <div key={week} style={{marginBottom: '3em'}}>
                        <h2 style={{fontSize: '1.75em'}}>Week {week - 1}.5</h2>
                        {curTrades.map(trade => (
                            <div key={trade.transaction_id} className="trade-container">
                                {Object.entries(trade.adds)
                                       .map(([rosterId, addGroup], addGroupIndex) => {
                                               const team = Object.values(teams)
                                                                  .find(team => team.rosterId === parseInt(rosterId));
                                               return (
                                                   <React.Fragment key={`${trade.transaction_id} ${rosterId}`}>
                                                       <h3 className="flex align-center justify-center">
                                                           {team.avatar ?
                                                               <img className="avatar" src={team.avatar}
                                                                    alt="avatar"/> : null}
                                                           <span>
                                                               <div>{team.teamName}</div>
                                                               <div className="team-name"
                                                                    style={{textAlign: 'left'}}>{team.displayName}</div>
                                                           </span>
                                                       </h3>
                                                       <div className="flex justify-center">
                                                           <table>
                                                               <thead>
                                                               <tr>
                                                                   <th>Player</th>
                                                                   <th>Tot. Pts</th>
                                                                   <th>Avg. Pts</th>
                                                               </tr>
                                                               </thead>
                                                               <tbody>
                                                               {addGroup.map(({
                                                                                  playerId,
                                                                                  points,
                                                                                  average
                                                                              }) => (
                                                                       <tr key={`${trade.transaction_id} ${playerId}`}>
                                                                           <td>
                                                                               <div className="flex justify-center">
                                                                                   <div>
                                                                                       <span>{players[playerId].first_name} {players[playerId].last_name}</span>
                                                                                       <div className="trade-player-info">
                                                                                           <span>{players[playerId].position}</span>
                                                                                           <span
                                                                                               className="trade-player-info-team">{players[playerId].team}</span>
                                                                                       </div>
                                                                                   </div>
                                                                               </div>
                                                                           </td>
                                                                           <td>
                                                                               {points?.toFixed(1) || 0}
                                                                           </td>
                                                                           <td>
                                                                               {average?.toFixed(1) || 0}
                                                                           </td>
                                                                       </tr>
                                                                   )
                                                               )}
                                                               </tbody>
                                                           </table>
                                                       </div>
                                                       {addGroupIndex !== Object.values(trade.adds).length - 1 ?
                                                           <hr/> : null}
                                                   </React.Fragment>
                                               );
                                           }
                                       )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Trades;