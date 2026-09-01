import './App.css';
import 'draft-js/dist/Draft.css';
import React, {useState, useEffect} from 'react';
import {Link, Outlet, useLocation} from 'react-router-dom';
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import AppContext from './contexts/AppContext';
// import {stateToHTML} from 'draft-js-export-html';

// Import the functions you need from the SDKs you need
import {initializeApp} from "firebase/app";
import {getDatabase, ref, get} from 'firebase/database';
import {FIREBASE_CONFIG} from './constants';
import {buildTeams} from './utils/teams';
import {resolveNflWeek, computeNewestWeek} from './utils/week';

const app = initializeApp(FIREBASE_CONFIG);
const db = getDatabase(app);

function App({sierraId}) {
    const [teams, setTeams] = useState({});
    const [newestWeek, setNewestWeek] = useState(0);
    const [allRankings, setAllRankings] = useState([]);
    const [scores, setScores] = useState({});
    const [league, setLeague] = useState('');
    const [season, setSeason] = useState(null);
    const [rankingsRef, setRankingsRef] = useState(null);
    const [sierraLeagueIds, setSierraLeagueIds] = useState(null);
    const [sierraSeasonLeagues, setSierraSeasonLeagues] = useState({});
    const [bracketSeasons, setBracketSeasons] = useState(null);
    const [rankingsSeasons, setRankingsSeasons] = useState(null);
    const [hasBrackets, setHasBrackets] = useState(false);
    const location = useLocation();

    useEffect(() => {
        if(!location){
            return;
        }
        setLeague(new URLSearchParams(location.search).get('league'));
    }, [location]);

    // The initial theme class is set synchronously in public/index.html to avoid a flash
    // of the wrong theme; this just keeps it in sync if the OS theme changes while open.
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const applyTheme = ({matches}) => {
            document.documentElement.classList.toggle('wa-dark', matches);
            document.documentElement.classList.toggle('wa-light', !matches);
        };
        mediaQuery.addEventListener('change', applyTheme);
        return () => mediaQuery.removeEventListener('change', applyTheme);
    }, []);

    // Sleeper renews a league into a new league ID each season, so walk the chain of
    // previous_league_id back from this season's Sierra league to find every past one too.
    useEffect(() => {
        (async () => {
            const ids = [sierraId];
            const seasonLeagues = {};
            let currentId = sierraId;
            while(currentId){
                const response = await fetch(`https://api.sleeper.app/v1/league/${currentId}`);
                if(!response.ok){
                    break;
                }
                const {season: leagueSeason, previous_league_id} = await response.json();
                if(leagueSeason){
                    seasonLeagues[leagueSeason] = currentId;
                }
                if(!previous_league_id || previous_league_id === '0'){
                    break;
                }
                ids.push(previous_league_id);
                currentId = previous_league_id;
            }
            setSierraLeagueIds(ids);
            setSierraSeasonLeagues(seasonLeagues);
        })();
    }, [sierraId]);

    // Only some seasons have predicted brackets stored in Firebase - fetch the list once
    // so the bracket results page can offer a select limited to years with real data.
    useEffect(() => {
        get(ref(db, 'brackets')).then(snapshot => setBracketSeasons(snapshot.exists() ? Object.keys(snapshot.val()) : []));
    }, []);

    // Rankings are also stored per-season in Firebase - fetch the list once so the
    // rankings page can offer a select limited to years with real data.
    useEffect(() => {
        get(ref(db, 'rankings')).then(snapshot => setRankingsSeasons(snapshot.exists() ? Object.keys(snapshot.val()) : []));
    }, []);

    useEffect(() => {
        if(!league){
            return;
        }

        async function fetchTeams(){
            const usersResponse = await fetch(`https://api.sleeper.app/v1/league/${league}/users`);
            const usersRaw = await usersResponse.json();

            const rostersResponse = await fetch(`https://api.sleeper.app/v1/league/${league}/rosters`);
            const rostersRaw = await rostersResponse.json();

            setTeams(buildTeams(usersRaw, rostersRaw));
        }

        async function fetchWeek(){
            async function fetchNflWeek(){
                const response = await fetch('https://api.sleeper.app/v1/state/nfl');
                const weekInfo = await response.json();
                return resolveNflWeek(weekInfo);
            }

            async function fetchLeagueInfo(){
                const leagueInfoResponse = await fetch(`https://api.sleeper.app/v1/league/${league}`);
                const json = await leagueInfoResponse.json();
                const {season: curSeason, settings, status} = json;
                setSeason(curSeason);
                return {playoffStart: settings.playoff_week_start, status};
            }

            const nflWeekPromise = fetchNflWeek();
            const leagueInfoPromise = fetchLeagueInfo();

            const [nflWeek, {playoffStart, status}] = await Promise.all([nflWeekPromise, leagueInfoPromise]);

            setNewestWeek(computeNewestWeek(nflWeek, playoffStart, status));
        }

        fetchTeams();
        fetchWeek();
    }, [league]);

    // The season isn't known until fetchWeek resolves the league's info, so the
    // rankings ref (and the fetch of its data) waits until season is set.
    useEffect(() => {
        if(!season){
            return;
        }

        setRankingsRef(ref(db, `rankings/${season}`));

        get(ref(db, `brackets/${season}`)).then(snapshot => setHasBrackets(snapshot.exists()));
    }, [season]);

    useEffect(() => {
        if(!rankingsRef){
            return;
        }

        async function fetchRankings(){
            const snapshot = await get(rankingsRef);
            setAllRankings(snapshot.val());
        }

        fetchRankings();
    }, [rankingsRef]);

    const sierraLeagueOptions = Object.entries(sierraSeasonLeagues)
        .sort(([seasonA], [seasonB]) => seasonB - seasonA);

    const bracketLeagueOptions = sierraLeagueOptions
        .filter(([season]) => bracketSeasons?.includes(season));

    const rankingsLeagueOptions = sierraLeagueOptions
        .filter(([season]) => rankingsSeasons?.includes(season));

    return (
        <AppContext.Provider
            value={{
                league, newestWeek, teams, allRankings, db, rankingsRef, season, scores, setScores, sierraId,
                sierraLeagueIds, sierraLeagueOptions, bracketLeagueOptions, rankingsLeagueOptions
            }}>
            <div className="app">
                <Outlet/>
                <br/><br/><br/><br/><br/><br/><br/><br/><br/>
            </div>
            {
                sierraLeagueIds?.includes(league) ?
                    <footer>
                        <Link to={`/rankings?league=${league}`} className="footerPage">
                            <div>Rankings</div>
                            {
                                (location.pathname === '/' || location.pathname.includes('rankings')) &&
                                <div className="activePage"/>
                            }
                        </Link>
                        <div style={{display: 'flex', width: '2px', height: '100%', alignItems: 'center'}}>
                            <div style={{height: '60%', width: '100%', backgroundColor: 'white'}}/>
                        </div>
                        <Link to={`/trades?league=${league}`} className="footerPage">
                            <div>Trades</div>
                            {
                                location.pathname === '/trades' && <div className="activePage"/>
                            }
                        </Link>
                        <div style={{display: 'flex', width: '2px', height: '100%', alignItems: 'center'}}>
                            <div style={{height: '60%', width: '100%', backgroundColor: 'white'}}/>
                        </div>
                        <Link to={`/schedules?league=${league}`} className="footerPage">
                            <div>Schedules</div>
                            {
                                location.pathname === '/schedules' && <div className="activePage"/>
                            }
                        </Link>
                        {
                            hasBrackets && <>
                                <div style={{display: 'flex', width: '2px', height: '100%', alignItems: 'center'}}>
                                    <div style={{height: '60%', width: '100%', backgroundColor: 'white'}}/>
                                </div>
                                <Link to={`/bracketresults?league=${league}`} className="footerPage">
                                    <div>Brackets</div>
                                    {
                                        (location.pathname === '/' || location.pathname.includes('bracketresults')) &&
                                        <div className="activePage"/>
                                    }
                                </Link>
                            </>
                        }
                    </footer>
                    : null
            }
        </AppContext.Provider>
    );
}

export default App;
