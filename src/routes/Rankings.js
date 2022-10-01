import React, {useContext, useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import AppContext from '../contexts/AppContext';
import {convertFromRaw} from 'draft-js';
import {stateToHTML} from 'draft-js-export-html';

function Rankings(){
    const {newestWeek, teams, allRankings} = useContext(AppContext);
    let {week: currentWeek} = useParams();

    if(!currentWeek){
        currentWeek = newestWeek;
    }

    const [rankings, setRankings] = useState({});
    const [weeks, setWeeks] = useState([]);
    // const [currentWeek, setCurrentWeek] = useState(0);

    useEffect(() => {
        if(!newestWeek){
            return;
        }

        let i = 1;
        const newWeeks = [];
        while (i <= newestWeek) {
            newWeeks.push(i);
            i++;
        }

        setWeeks(newWeeks);
    }, [newestWeek]);

    useEffect(() => {
        if(!allRankings?.length){
            return;
        }

        const stringifiedRankings = {...allRankings[currentWeek]};
        const parsedEditorStates = Object.entries(stringifiedRankings).reduce((parsed, [teamId, state]) => {
            const parsedState = JSON.parse(state);
            parsed[teamId] = {
                ...parsedState,
                blurb: stateToHTML(convertFromRaw(parsedState.blurb))
            };
            return parsed;
        }, {});
        setRankings(parsedEditorStates);
    }, [allRankings, currentWeek]);

    return (
        <div style={{flexDirection: 'column'}} className="flex align-center">
            <div style={{maxWidth: '620px'}}>
                <h1>Sierra Week {currentWeek} Rankings</h1>
                <div className="flex" style={{gap: '2em', marginBottom: '1em'}}>
                    <div>Select Week:</div>
                    {
                        weeks.map(week => (
                            <Link key={week} className={`week-option ${week === parseInt(currentWeek) ? 'current' : ''}`}
                                  to={`/rankings/${week}`}>
                                {week}
                            </Link>
                        ))
                    }
                </div>
                {
                    Object.entries(rankings).sort((aTeam, bTeam) => aTeam[1].ranking - bTeam[1].ranking)
                          .map(([teamId, editorState]) => (
                              <div className="blurb-container" key={teamId}>
                                  <h2>{editorState.ranking}. {teams[teamId].teamName} ({teams[teamId].displayName})</h2>
                                  <div dangerouslySetInnerHTML={{__html: rankings[teamId].blurb}}></div>
                              </div>
                          ))
                }
            </div>
        </div>
    );
}

export default Rankings;