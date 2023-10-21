import React, {useContext, useEffect, useState} from 'react';
import RichEditor from '../components/RichEditor';
import {convertFromRaw, convertToRaw, EditorState} from 'draft-js';
import {update} from 'firebase/database';
import AppContext from '../contexts/AppContext';

function EditRankings({week}){
    const {teams, allRankings, rankingsRef} = useContext(AppContext);
    const [editorStates, setEditorStates] = useState({});
    const [saveButtonText, setSaveButtonText] = useState('Save');
    const [saved, setSaved] = useState(true);

    useEffect(() => {
        if(!allRankings?.length){
            return;
        }

        const stringifiedNewRankings = allRankings?.[week];
        if(stringifiedNewRankings){
            const parsedEditorStates = Object.entries(stringifiedNewRankings).reduce((parsed, [teamId, state]) => {
                const parsedState = JSON.parse(state);
                parsed[teamId] = {
                    ...parsedState,
                    blurb: EditorState.createWithContent(convertFromRaw(parsedState.blurb))
                };
                return parsed;
            }, {});
            setEditorStates(parsedEditorStates);
        } else{
            const blankEditors = Object.keys(teams).reduce((filledOut, teamId, index) => {
                filledOut[teamId] = {blurb: EditorState.createEmpty(), ranking: index + 1};
                return filledOut;
            }, {});
            setEditorStates(blankEditors);
        }
    }, [week, allRankings, teams]);

    useEffect(() => {
        const interval = setInterval(() => {
            if(!saved){
                saveRankings();
            }
        }, 5000);
        return () => clearInterval(interval);
        // eslint-disable-next-line
    }, [editorStates, saved]);

    function updateEditorState(teamId, updatedBlurb){
        setSaved(false);
        setEditorStates({...editorStates, [teamId]: {...editorStates[teamId], blurb: updatedBlurb}});
    }

    function moveUp(teamId, ranking){
        moveTeam(teamId, ranking, ranking - 1);
    }

    function moveDown(teamId, ranking){
        moveTeam(teamId, ranking, ranking + 1);
    }

    function moveTeam(teamId, fromRanking, toRanking){
        const newEditorState = {...editorStates};
        const displacedTeam = Object.entries(newEditorState)
                                    .find(([displacedTeamId, team]) => team.ranking === toRanking);
        const displacedTeamId = displacedTeam[0];
        newEditorState[displacedTeamId].ranking = fromRanking;
        newEditorState[teamId].ranking = toRanking;
        setEditorStates(newEditorState);
        setSaved(false);
    }

    async function saveRankings(){
        const stringifiedEditorStates = Object.entries(editorStates).reduce((stringified, [teamId, state]) => {
            stringified[teamId] = JSON.stringify({
                ...state, blurb: convertToRaw(state.blurb.getCurrentContent())
            });
            return stringified;
        }, {});

        const newRankings = {
            [week]: stringifiedEditorStates
        };

        setSaveButtonText('Saving...');
        try {
            await update(rankingsRef, newRankings);
            setSaveButtonText('Updated!');
            setSaved(true);
        } catch (e) {
            alert('Error saving. Try again or open in new tab.');
        }

        setTimeout(() => {
            setSaveButtonText('Save');
        }, 1500);
    }

    if(!Object.keys(editorStates).length){
        return <div>Loading</div>;
    }

    return (
        <>
            <div style={{flexDirection: 'column', paddingRight: '2em'}} className="flex align-center edit-rankings">
                <h1>Week {week} Rankings</h1>
                {
                    Object.entries(editorStates).sort((aTeam, bTeam) => aTeam[1].ranking - bTeam[1].ranking)
                          .map(([teamId, editorState]) => (
                              <div className="team-container" key={teamId}>
                                  <h2 className="flex align-center" style={{flexWrap: 'wrap'}}>
                                      {editorState.ranking}.
                                      <span className="flex align-center" style={{marginLeft: '0.25em'}}>
                                          {teams[teamId]?.avatar ?
                                              <img src={teams[teamId]?.avatar} className="avatar"
                                                   alt="avatar"/> : null}
                                          <div>
                                              <span>{teams[teamId]?.teamName}</span>
                                              <div className="team-name">{teams[teamId]?.displayName}</div>
                                            </div>
                                      </span>
                                      <div className="break"/>
                                      <div className="flex button-container" style={{gap: '0.5em'}}>
                                          {editorState.ranking !== 1 ?
                                              <div className="flex align-center">
                                                  <button onClick={() => moveUp(teamId, editorState.ranking)}>&uarr;
                                                  </button>
                                              </div> : null}
                                          {editorState.ranking !== 12 ? <div className="flex align-center">
                                              <button
                                                  onClick={() => moveDown(teamId, editorState.ranking)}>&darr;
                                              </button>
                                          </div> : null}
                                      </div>
                                  </h2>
                                  <div className="editor-container">
                                      <RichEditor editorState={editorState.blurb}
                                                  setEditorState={(e) => updateEditorState(teamId, e)}/>
                                  </div>
                                  {/*<div dangerouslySetInnerHTML={{__html: parsedHtml}}></div>*/}
                              </div>
                          ))
                }
            </div>
            <button className="save-button" onClick={saveRankings} disabled={saved}>{saveButtonText}</button>
        </>
    );
}

export default EditRankings;