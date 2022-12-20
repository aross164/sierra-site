import React, {useContext, useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import AppContext from '../contexts/AppContext';
import {convertFromRaw} from 'draft-js';
import {stateToHTML} from 'draft-js-export-html';

function Rankings(){
    const {newestWeek, teams, allRankings, league} = useContext(AppContext);
    if(league && league !== '855884259620188160'){
        window.location.replace(`${window.location.origin}/schedules?league=${league}`);
    }
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
                <div className="flex align-center" style={{gap: '1em', marginBottom: '1em'}}>
                    <div>Select Week:</div>
                    <div className="flex" style={{flexWrap: 'wrap', gap: '1em 2em'}}>
                        {
                            weeks.map(week => (
                                <Link key={week}
                                      className={`week-option ${week === parseInt(currentWeek) ? 'current' : ''}`}
                                      to={`/rankings/${week}?league=${league}`}>
                                    {week}
                                </Link>
                            ))
                        }
                    </div>
                </div>
                {
                    Object.entries(rankings).sort((aTeam, bTeam) => aTeam[1].ranking - bTeam[1].ranking)
                          .map(([teamId, editorState]) => (
                              <div className="blurb-container" key={teamId}>
                                  <h2 className="flex align-center">
                                      {editorState.ranking}.
                                      <div className="flex align-center" style={{marginLeft: '0.25em'}}>
                                          {teams[teamId]?.avatar ?
                                              <img src={teams[teamId]?.avatar} className="avatar"
                                                   alt="avatar"/> : null}
                                          <div>
                                              <span style={{fontSize: '0.92em'}}>{teams[teamId]?.teamName}</span>
                                              <div className="team-name">{teams[teamId]?.displayName}</div>
                                          </div>
                                      </div>
                                  </h2>
                                  <div dangerouslySetInnerHTML={{__html: rankings[teamId].blurb}}></div>
                              </div>
                          ))
                }
            </div>
        </div>
    );
}

export default Rankings;