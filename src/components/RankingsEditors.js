import React from 'react';
import RichEditor from './RichEditor';

export default function RankingsEditors({editorStates, teams, moveUp, moveDown, updateEditorState, sortable = false}) {
    return (
        <>
            {
                Object.entries(editorStates).sort((aTeam, bTeam) => aTeam[1].ranking - bTeam[1].ranking)
                    .map(([teamId, editorState]) => (
                        <div className="team-container" key={teamId}>
                            <h2 className="flex align-center" style={{flexWrap: 'wrap'}}>
                                {editorState.ranking}.
                                <span className="flex align-center" style={{marginLeft: '0.25em'}}>
                                          {teams[teamId]?.avatar ?
                                              <img src={teams[teamId]?.avatar} className="avatar"
                                                   alt="avatar"
                                              /> : null}
                                    <div>
                                              <span>{teams[teamId]?.teamName}</span>
                                              <div className="team-name">{teams[teamId]?.displayName}</div>
                                            </div>
                                      </span>
                                {
                                    sortable ?
                                        <>
                                            <div className="break"/>
                                            <div className="flex button-container" style={{gap: '0.5em'}}>
                                                {editorState.ranking !== 1 ?
                                                    <div className="flex align-center">
                                                        <button onClick={() => moveUp(teamId, editorState.ranking)}
                                                        >&uarr;
                                                        </button>
                                                    </div> : null}
                                                {editorState.ranking !== 12 ? <div className="flex align-center">
                                                    <button
                                                        onClick={() => moveDown(teamId, editorState.ranking)}
                                                    >&darr;
                                                    </button>
                                                </div> : null}
                                            </div>
                                        </>
                                        : null
                                }
                            </h2>
                            <div className="editor-container">
                                <RichEditor editorState={editorState.blurb}
                                            setEditorState={(e) => updateEditorState(teamId, e)}
                                />
                            </div>
                            {/*<div dangerouslySetInnerHTML={{__html: parsedHtml}}></div>*/}
                        </div>
                    ))
            }
        </>
    );
}