import './App.css';
import 'draft-js/dist/Draft.css';
import React, {useState, useEffect} from 'react';
import {Outlet} from 'react-router-dom';
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

const league = '855884259620188160';

function App(){
    const [teams, setTeams] = useState({});
    const [newestWeek, setNewestWeek] = useState(0);
    const [allRankings, setAllRankings] = useState([]);


    /*useEffect(() => {
        setParsedHtml(stateToHTML(editorState.getCurrentContent()));
    }, [editorState]);*/

    useEffect(() => {
        fetchTeams();
        fetchRankings();
        fetchWeek();
    }, []);

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
        <AppContext.Provider value={{league, newestWeek, teams, allRankings, rankingsRef}}>
            <div className="app">
                <Outlet/>
                <br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>
            </div>
        </AppContext.Provider>
    );
}

export default App;
