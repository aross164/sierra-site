import React, {useState} from 'react';
import WaSelect from '@awesome.me/webawesome/dist/react/select/index.js';
import WaOption from '@awesome.me/webawesome/dist/react/option/index.js';
import WaDivider from '@awesome.me/webawesome/dist/react/divider/index.js';
import useWaSelectChange from '../hooks/useWaSelectChange';
import {groupBySeason, fetchLeagueHistory} from '../utils/leagueHistory';

function renderGroupedOptions(entries){
    return groupBySeason(entries).map(([season, seasonLeagues], index) => (
        <React.Fragment key={season}>
            {index > 0 && <WaDivider/>}
            <small>{season}</small>
            {seasonLeagues.map(([id, {name}]) => (
                <WaOption key={id} value={id}>{name}</WaOption>
            ))}
        </React.Fragment>
    ));
}

function LeaguePicker({basePath, league, leagues}){
    const [newLeagueId, setNewLeagueId] = useState('');
    const [username, setUsername] = useState('');
    const [isSearchingLeagues, setIsSearchingLeagues] = useState(false);
    const [usernameError, setUsernameError] = useState('');
    const [foundLeagues, setFoundLeagues] = useState([]);
    const [isAddingLeague, setIsAddingLeague] = useState(false);

    const leagueSelectRef = useWaSelectChange(
        value => window.location.replace(`${window.location.origin}/${basePath}?league=${value}`)
    );
    const foundLeagueSelectRef = useWaSelectChange(goToFoundLeague);

    function goToLeague(){
        if(!newLeagueId || isNaN(newLeagueId)){
            alert('League ID must be a number');
            return;
        }

        window.location.replace(`${window.location.origin}/${basePath}?league=${newLeagueId}`);
    }

    function goToFoundLeague(leagueId){
        if(!leagueId){
            return;
        }
        window.location.replace(`${window.location.origin}/${basePath}?league=${leagueId}`);
    }

    async function findLeaguesByUsername(){
        if(!username.trim()){
            return;
        }

        setIsSearchingLeagues(true);
        setUsernameError('');
        setFoundLeagues([]);

        try{
            const userResponse = await fetch(`https://api.sleeper.app/v1/user/${username.trim()}`);
            const user = await userResponse.json();
            if(!user || !user.user_id){
                setUsernameError('Username not found');
                return;
            }

            const stateResponse = await fetch('https://api.sleeper.app/v1/state/nfl');
            const {season} = await stateResponse.json();

            const leaguesResponse = await fetch(`https://api.sleeper.app/v1/user/${user.user_id}/leagues/nfl/${season}`);
            const userLeagues = await leaguesResponse.json();
            if(!userLeagues || !userLeagues.length){
                setUsernameError('No leagues found for this user');
                return;
            }

            setFoundLeagues(await fetchLeagueHistory(userLeagues));
        } catch(err){
            console.error('Failed to find leagues by username:', err);
            setUsernameError('Something went wrong finding leagues');
        } finally{
            setIsSearchingLeagues(false);
        }
    }

    return (<>
        {!!Object.keys(leagues).length && (
            <div style={{marginBottom: '0.25em'}}>
                <WaSelect ref={leagueSelectRef} label="Previous Leagues" defaultValue={league}>
                    {renderGroupedOptions(Object.entries(leagues))}
                </WaSelect>
            </div>
        )}
        {isAddingLeague ? (<>
            <div style={{marginBottom: '1.33em', marginTop: '1em'}}>
                <label htmlFor="add-league">Add League: </label>
                <input style={{marginBottom: '0.25em'}} value={newLeagueId} onChange={e => setNewLeagueId(e.target.value)} type="number"
                       placeholder="League ID"/>
                <button
                    onClick={goToLeague}>
                    Go
                </button>
            </div>
            <div style={{marginBottom: '1.33em'}}>
                <div style={{marginBottom: '0.5em'}}>Or find your leagues by Sleeper username:</div>
                <div style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap'}}>
                    <label htmlFor="username">Username: </label>
                    <input id="username" value={username} onChange={e => setUsername(e.target.value)} type="text"
                           placeholder="Sleeper username" style={{marginBottom: '0.25em'}}
                           onKeyDown={e => e.key === 'Enter' && findLeaguesByUsername()}/>
                    <button onClick={findLeaguesByUsername} disabled={isSearchingLeagues}>
                        {isSearchingLeagues ? 'Searching...' : 'Find Leagues'}
                    </button>
                </div>
                {usernameError && <div style={{color: 'red', marginTop: '0.5em'}}>{usernameError}</div>}
                {!!foundLeagues.length && (
                    <div style={{marginTop: '0.5em'}}>
                        <WaSelect ref={foundLeagueSelectRef} label="Select a league" placeholder="Choose a league">
                            {renderGroupedOptions(foundLeagues.map(({league_id, name, season}) => [league_id, {name, season}]))}
                        </WaSelect>
                    </div>
                )}
            </div>
        </>) : (
            <div style={{marginBottom: '1.33em'}}>
                <button onClick={() => setIsAddingLeague(true)}>
                    Add a League
                </button>
            </div>
        )}
    </>);
}

export default LeaguePicker;
