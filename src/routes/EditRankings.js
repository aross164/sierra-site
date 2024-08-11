import React, {useContext, useEffect, useState} from 'react';
import RichEditor from '../components/RichEditor';
import {convertFromRaw, convertToRaw, EditorState} from 'draft-js';
import {update} from 'firebase/database';
import AppContext from '../contexts/AppContext';
import TierList from '../components/TierList';
import RankingsEditors from '../components/RankingsEditors';

function EditRankings({week}) {
    const {teams, allRankings, rankingsRef} = useContext(AppContext);
    const [editorStates, setEditorStates] = useState({});
    const [saveButtonText, setSaveButtonText] = useState('Save');
    const [saved, setSaved] = useState(true);

    useEffect(() => {
        if (!allRankings?.length) {
            return;
        }

        const stringifiedNewRankings = allRankings?.[week]?.rankings;
        if (stringifiedNewRankings) {
            const parsedEditorStates = Object.entries(stringifiedNewRankings).reduce((parsed, [teamId, state]) => {
                const parsedState = JSON.parse(state);
                parsed[teamId] = {
                    ...parsedState,
                    blurb: EditorState.createWithContent(convertFromRaw(parsedState.blurb))
                };
                return parsed;
            }, {});
            setEditorStates(parsedEditorStates);
        } else {
            const blankEditors = Object.keys(teams).reduce((filledOut, teamId, index) => {
                filledOut[teamId] = {blurb: EditorState.createEmpty(), ranking: index + 1};
                return filledOut;
            }, {});
            setEditorStates(blankEditors);
        }
    }, [week, allRankings, teams]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (!saved) {
                saveRankings();
            }
        }, 5000);
        return () => clearInterval(interval);
        // eslint-disable-next-line
    }, [editorStates, saved]);

    function updateEditorState(teamId, updatedBlurb) {
        setSaved(false);
        setEditorStates({...editorStates, [teamId]: {...editorStates[teamId], blurb: updatedBlurb}});
    }

    function moveUp(teamId, ranking) {
        moveTeam(teamId, ranking, ranking - 1);
    }

    function moveDown(teamId, ranking) {
        moveTeam(teamId, ranking, ranking + 1);
    }

    function moveTeam(teamId, fromRanking, toRanking) {
        const newEditorState = {...editorStates};
        const displacedTeamId = Object.keys(newEditorState)
            .find(teamId => newEditorState[teamId].ranking === toRanking);
        newEditorState[displacedTeamId].ranking = fromRanking;
        newEditorState[teamId].ranking = toRanking;
        setEditorStates(newEditorState);
        setSaved(false);
    }

    function getStringifiedEditorStates(states) {
        let curStates = states;
        if (!states) {
            curStates = editorStates;
        }
        return Object.entries(curStates).reduce((stringified, [teamId, state]) => {
            stringified[teamId] = JSON.stringify({
                ...state, blurb: convertToRaw(state.blurb.getCurrentContent())
            });
            return stringified;
        }, {});
    }

    async function saveRankings() {
        const stringifiedEditorStates = getStringifiedEditorStates();

        const newRankings = {};
        newRankings[`/${week}/rankings`] = stringifiedEditorStates;

        setSaveButtonText('Saving...');
        try {
            await update(rankingsRef, newRankings);
            setSaveButtonText('Updated!');
            setSaved(true);
        } catch (e) {
            console.log(e);
            alert('Error saving rankings. Try again or open in new tab.');
        }

        setTimeout(() => {
            setSaveButtonText('Save');
        }, 1500);
    }

    async function saveTiers(tiers) {
        const updates = {};
        updates[`/${week}/tiers`] = tiers;

        const newEditorStates = {...editorStates};
        let curRanking = 1;
        const teamIds = Object.keys(newEditorStates).reduce((o, key) => ({...o, [key]: 1}), {});

        tiers.forEach(tier => tier.entities.forEach(entity => {
            newEditorStates[entity.id].ranking = curRanking++;
            delete teamIds[entity.id];
        }));
        Object.keys(teamIds).forEach(teamId => newEditorStates[teamId].ranking = curRanking++);
        updates[`/${week}/rankings`] = getStringifiedEditorStates(newEditorStates);

        setSaveButtonText('Saving...');
        try {
            await update(rankingsRef, updates);
            setSaveButtonText('Updated!');
            setSaved(true);
        } catch (e) {
            console.log(e);
            alert('Error saving tiers. Try again or open in new tab.');
        }

        setTimeout(() => {
            setSaveButtonText('Save');
        }, 1500);
    }

    if (!Object.keys(editorStates).length) {
        return <div>Loading</div>;
    }

    return (
        <>
            <div style={{flexDirection: 'column', paddingRight: '2em'}} className="flex align-center edit-rankings">
                <h1>Week {week} Rankings</h1>
                <TierList entities={Object.entries(teams).map(([teamId, team]) => ({...team, id: teamId}))} editable
                          type="team" saveState={saveTiers}
                          initTiers={[...allRankings?.[week]?.tiers?.map(tier => tier.entities ? tier : {
                              ...tier,
                              entities: []
                          })]}
                />
                <RankingsEditors editorStates={editorStates} teams={teams} moveUp={moveUp} moveDown={moveDown}
                                 updateEditorState={updateEditorState}
                />
            </div>
            <button className="save-button" onClick={saveRankings} disabled={saved}>{saveButtonText}</button>
        </>
    );
}

export default EditRankings;