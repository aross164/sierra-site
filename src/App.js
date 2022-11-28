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

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC6hAA-uE-l85kitNt91a2tss9H9lj7ZHE",
    authDomain: "sierra-site-300d4.firebaseapp.com",
    projectId: "sierra-site-300d4",
    storageBucket: "sierra-site-300d4.appspot.com",
    messagingSenderId: "133304947715",
    appId: "1:133304947715:web:c8ed9cf3af89829c4f6a36"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const rankingsRef = ref(db, 'rankings');

function App(){
    const [teams, setTeams] = useState({});
    const [newestWeek, setNewestWeek] = useState(0);
    const [allRankings, setAllRankings] = useState([]);
    const [scores, setScores] = useState({});
    const [league, setLeague] = useState('');
    const location = useLocation();

    useEffect(() => {
        if(!location){
            return;
        }
        setLeague(new URLSearchParams(location.search).get('league') || '855884259620188160');
    }, [location]);

    useEffect(() => {
        if(!league){
            return;
        }

        fetchTeams();
        fetchRankings();
        fetchWeek();
        // eslint-disable-next-line
    }, [league]);

    async function fetchTeams(){
        const usersResponse = await fetch(`https://api.sleeper.app/v1/league/${league}/users`);
        const usersRaw = await usersResponse.json();
        const users = usersRaw.reduce((foundUsers, user, index) => {
            foundUsers[user.user_id] = {
                teamName: user.metadata.team_name,
                displayName: user.display_name,
                avatar: user.metadata.avatar
            };

            return foundUsers;
        }, {});

        const rostersResponse = await fetch(`https://api.sleeper.app/v1/league/${league}/rosters`);
        const rostersRaw = await rostersResponse.json();
        rostersRaw.forEach(roster => users[roster.owner_id].rosterId = roster.roster_id);

        setTeams(users);
    }

    async function fetchRankings(){
        const snapshot = await get(rankingsRef);
        setAllRankings(snapshot.val());
    }

    async function fetchWeek(){
        const response = await fetch('https://api.sleeper.app/v1/state/nfl');
        const weekInfo = await response.json();
        setNewestWeek(weekInfo.week);
    }

    return (
        <AppContext.Provider value={{league, newestWeek, teams, allRankings, rankingsRef, scores, setScores}}>
            <div className="app">
                <Outlet/>
                <br/><br/><br/><br/><br/><br/><br/><br/><br/>
            </div>
            <footer>
                {
                    league === '855884259620188160' ?
                        <>
                            <Link to="/" className="footerPage">
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
                        </>
                        : null
                }
                <Link to={`/schedules?league=${league}`} className="footerPage">
                    <div>Schedules</div>
                    {
                        location.pathname === '/schedules' && <div className="activePage"/>
                    }
                </Link>
            </footer>
        </AppContext.Provider>
    );
}

export default App;
