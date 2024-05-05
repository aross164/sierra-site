import React, {useEffect, useState} from 'react';
import {fetchPlayerInfo} from "../utils/utils";
import 'drag-drop-touch';

const options = [
    "6804",
    "9509",
    "4199",
    "2449",
    "4037",
    "8110",
    "6803",
    "9231",
    "3451"
];

export default function TierList() {
    const [players, setPlayers] = useState([]);
    const [tiers, setTiers] = useState([
        {name: 'S', color: '#ff807f', players: []},
        {name: 'A', color: '#ffbe81', players: []},
        {name: 'B', color: '#ffdf82', players: []},
        {name: 'C', color: '#ffff7f', players: []},
        {name: 'D', color: '#bfff80', players: []},
        {name: 'F', color: '#7fff7f', players: []}
    ]);
    const [draggingPlayer, setDraggingPlayer] = useState({});
    const unranked = tiers.reduce((curPlayers, tier) => {
        const newCurPlayers = [...curPlayers];
        tier.players.forEach(tierPlayer => {
            if (tierPlayer.ghost) {
                return;
            }
            newCurPlayers.splice(newCurPlayers.findIndex(player => player.player_id === tierPlayer.player_id), 1)
        })
        return newCurPlayers;
    }, players);

    useEffect(() => {
        Promise.all(options.map(option => fetchPlayerInfo(option)))
            .then(newPlayers => setPlayers(newPlayers))
    }, []);

    function addGhostPlayer(e, tierName) {
        e?.stopPropagation();
        let newTiers = structuredClone(tiers);
        newTiers = hideGhostPlayer(e, newTiers);
        const tier = newTiers.find(curTier => curTier.name === tierName);
        const playerAlreadyExists = tier.players.find(player => player.player_id === draggingPlayer.player_id);
        if (playerAlreadyExists) {
            if (playerAlreadyExists.ghost && !playerAlreadyExists.hidden) {
                return;
            }
            playerAlreadyExists.ghost = true;
            playerAlreadyExists.hidden = false;
        } else {
            tier.players.push({...draggingPlayer, ghost: true});
        }
        setTiers(newTiers);
    }

    function removeGhostPlayers(passedTiers) {
        let newTiers = passedTiers;
        if (!newTiers) {
            newTiers = structuredClone(tiers);
        }
        newTiers.forEach(tier => {
            tier.players = tier.players.filter(player => {
                return !player.ghost
            });
        })
        if (passedTiers) {
            return newTiers;
        }
        setTiers(newTiers);
    }

    function hideGhostPlayer(e, passedTiers) {
        e.stopPropagation();
        let newTiers = passedTiers;
        if (!newTiers) {
            newTiers = structuredClone(tiers);
        }
        let ghostPlayer;
        let numGhostPlayers = 0;
        newTiers.forEach(tier => {
            return tier.players.forEach(player => {
                if (player.ghost && !player.hidden) {
                    ghostPlayer = player;
                    numGhostPlayers++;
                    return true;
                }
                return false;
            })
        });
        if (!ghostPlayer) {
            return newTiers;
        }
        ghostPlayer.hidden = true;
        if (passedTiers) {
            return newTiers;
        }
        setTiers(newTiers);
    }

    function startDraggingPlayer(e) {
        const playerId = e?.target.dataset.playerId;
        e.dataTransfer.setData('text/plain', 'Im dragging')
        if (!playerId) {
            return;
        }
        setDraggingPlayer(players.find(player => player.player_id === playerId))
    }

    function startDraggingRankedPlayer(e, tierName, playerId) {
        // addGhostPlayer(e, tierName);
        const newTiers = structuredClone(tiers);
        const tier = newTiers.find(curTier => curTier.name === tierName);
        const player = tier.players.find(player => player.player_id === playerId);
        player.ghost = true;
        setTiers(newTiers);
        startDraggingPlayer(e);
    }

    function stopDraggingPlayer() {
        setDraggingPlayer({});
    }

    useEffect(() => {
        if (!Object.keys(draggingPlayer).length) {
            removeGhostPlayers();
        }
    }, [draggingPlayer])

    function movePlayerToIndex(e, tierName, index) {
        e?.stopPropagation();
        const newTiers = structuredClone(tiers);
        const tier = newTiers.find(curTier => curTier.name === tierName);
        const ghostIndex = tier.players.findIndex(player => player.ghost && !player.hidden);
        if (ghostIndex === index) {
            return;
        }
        if (ghostIndex === -1) {
            if (!Object.keys(draggingPlayer).length) {
                return;
            }
            addGhostPlayer(e, tierName);
            return;
        }
        const [ghostPlayer] = tier.players.splice(ghostIndex, 1);
        tier.players.splice(index, 0, ghostPlayer);
        setTiers(newTiers);
    }

    function convertGhostToReal(tierName) {
        let newTiers = structuredClone(tiers);
        const tier = newTiers.find(tier => tier.name === tierName);
        const ghostPlayer = tier.players.find(player => player.ghost);
        if (!ghostPlayer) {
            return;
        }
        ghostPlayer.ghost = false;
        ghostPlayer.hidden = false;
        // newTiers = removeGhostPlayers(newTiers);
        stopDraggingPlayer();
        setTiers(newTiers);
    }

    if (!players.length) {
        return <div>No players</div>
    }

    return (
        <div className="tier-list-container" onDragEnter={hideGhostPlayer}>
            <div className="tier-list">
                {tiers.map(tier =>
                    <div
                        className="row" key={tier.name}
                        style={{backgroundColor: tier.color}}>
                        <div className="tier-name" onDragEnter={hideGhostPlayer}>{tier.name}</div>
                        <div
                            className="rankings" onDragEnter={e => addGhostPlayer(e, tier.name)}
                            onDragOver={e => e.preventDefault()}
                            onDrop={() => convertGhostToReal(tier.name)}>
                            {tier.players.map((player, index) =>
                                <Player
                                    firstName={player.first_name} lastName={player.last_name} key={player.player_id}
                                    draggable
                                    startDraggingPlayer={e => startDraggingRankedPlayer(e, tier.name, player.player_id)}
                                    stopDraggingPlayer={stopDraggingPlayer} playerId={player.player_id}
                                    ghost={player.ghost} tierName={tier.name} index={index}
                                    movePlayerToIndex={movePlayerToIndex} sortable hidden={player.hidden}/>
                            )}
                            <div className="last-index"
                                 onDragEnter={e => movePlayerToIndex(e, tier.name, tier.players.length)}>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="options-list">
                {unranked.map(player =>
                    <Player
                        key={player.player_id} playerId={player.player_id} firstName={player.first_name}
                        lastName={player.last_name} startDraggingPlayer={startDraggingPlayer}
                        stopDraggingPlayer={stopDraggingPlayer} draggable/>
                )}
            </div>
        </div>
    )
}

function Player({
                    firstName,
                    lastName,
                    playerId,
                    startDraggingPlayer,
                    stopDraggingPlayer,
                    draggable,
                    ghost,
                    tierName,
                    index,
                    movePlayerToIndex,
                    sortable,
                    hidden
                }) {
    return (
        <div style={{position: 'relative', display: hidden ? 'none' : 'block'}} key={playerId}
             onDragStart={startDraggingPlayer}
             onDragEnd={stopDraggingPlayer}
             data-player-id={playerId}
             draggable={draggable}>
            {sortable ? <div className="reorder left"
                             onDragEnter={e => movePlayerToIndex(e, tierName, index)}></div> : null}

            <div className={`option ${ghost ? 'ghost' : ''}`}>
                <img src={`https://sleepercdn.com/content/nfl/players/${playerId}.jpg`} alt={`${firstName} ${lastName}`}
                     draggable="false"/>
                <div className="player-name">
                    <span className="player-name-text">{firstName?.[0]}. {lastName}</span>
                </div>
            </div>
            {sortable ? <div className="reorder right"
                             onDragEnter={e => movePlayerToIndex(e, tierName, index + 1)}></div> : null}
        </div>
    )
}