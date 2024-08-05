import React, {useContext, useEffect, useState} from 'react';
import TierList from '../components/TierList';
import AppContext from '../contexts/AppContext';
import {fetchPlayerInfo} from '../utils/utils';

const options = [
    '6804',
    '9509',
    '4199',
    '2449',
    '4037',
    '8110',
    '6803',
    '9231',
    '3451'
];

export default function TierListPage(){
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        Promise.all(options.map(option => fetchPlayerInfo(option)))
            .then(newPlayers => setPlayers(newPlayers.map(player => ({...player, id: player.player_id}))));
    }, []);

    const {teams} = useContext(AppContext);
    // console.log(teams);

    // return <TierList entities={players}/>;
    return <TierList entities={Object.entries(teams).map(([teamId, team]) => ({...team, id: teamId}))} editable={true} type="team"/>;
}