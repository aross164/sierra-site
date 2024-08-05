import React, {useState} from 'react';
import 'drag-drop-touch';

const colors = [
    '#ff807f',
    '#ffbe81',
    '#ffdf82',
    '#ffff7f',
    '#bfff80',
    '#7fff7f',
    '#80FFFF',
    '#7fbfff',
    '#7f7fff',
    '#ff7fff',
    '#bf7fbf',
    '#3b3b3b',
];


// TODO: figure out why we're hiding ghost entities instead of removing
export default function TierList({editable, entities, type}) {
    const [tiers, setTiers] = useState([
        {name: 'S', entities: []},
        {name: 'A', entities: []},
        {name: 'B', entities: []},
        {name: 'C', entities: []},
        {name: 'D', entities: []},
        {name: 'F', entities: []}
    ]);
    const [draggingEntity, setDraggingEntity] = useState({});
    const unranked = tiers.reduce((curEntities, tier) => {
        const newCurEntities = [...curEntities];
        tier.entities.forEach(tierEntity => {
            if (tierEntity.ghost) {
                return;
            }
            newCurEntities.splice(newCurEntities.findIndex(entity => entity.id === tierEntity.id), 1);
        });
        return newCurEntities;
    }, entities);

    function getTiersCopy(passedTiers) {
        let newTiers = passedTiers;
        if (!newTiers) {
            newTiers = structuredClone(tiers);
        }
        return newTiers;
    }

    function addGhostEntity(e, tierName) {
        e?.stopPropagation();
        let newTiers = structuredClone(tiers);
        newTiers = hideGhostEntity(e, newTiers);
        const tier = newTiers.find(curTier => curTier.name === tierName);
        tier.entities.push({...draggingEntity, ghost: true});
        setTiers(newTiers);
    }

    function hideGhostEntity(e, passedTiers) {
        e.stopPropagation();
        const newTiers = getTiersCopy(passedTiers);
        let ghostEntity;
        newTiers.some(tier => {
            tier.entities = tier.entities.filter(entity => {
                if (entity.ghost) {
                    ghostEntity = true;
                }
                return !entity.ghost;
            });
            return ghostEntity;
        });
        if (!ghostEntity) {
            return newTiers;
        }
        if (passedTiers) {
            return newTiers;
        }
        setTiers(newTiers);
    }

    function startDraggingEntity(e) {
        const id = e?.target.dataset.id;
        e.dataTransfer.setData('text/plain', 'Im dragging');
        if (!id) {
            return;
        }
        setDraggingEntity(entities.find(entity => entity.id === id));
    }

    function startDraggingRankedEntity(e, tierName, id) {
        const newTiers = structuredClone(tiers);
        const tier = newTiers.find(curTier => curTier.name === tierName);
        const entity = tier.entities.find(entity => entity.id === id);
        entity.ghost = true;
        setTiers(newTiers);
        startDraggingEntity(e);
    }

    function stopDraggingEntity() {
        const newTiers = structuredClone(tiers);
        newTiers.forEach(tier => {
            tier.entities = tier.entities.filter(entity => {
                return !entity.ghost;
            });
        });
        setTiers(newTiers);
        setDraggingEntity({});
    }

    function moveEntityToIndex(e, tierName, index) {
        e?.stopPropagation();
        const newTiers = structuredClone(tiers);
        const tier = newTiers.find(curTier => curTier.name === tierName);
        const ghostIndex = tier.entities.findIndex(entity => entity.ghost);
        if (ghostIndex === index) {
            return;
        }
        if (ghostIndex === -1) {
            if (!Object.keys(draggingEntity).length) {
                return;
            }
            addGhostEntity(e, tierName);
            return;
        }
        const [ghostEntity] = tier.entities.splice(ghostIndex, 1);
        tier.entities.splice(index, 0, ghostEntity);
        setTiers(newTiers);
    }

    function convertGhostToReal(tierName) {
        let newTiers = structuredClone(tiers);
        const tier = newTiers.find(tier => tier.name === tierName);
        const ghostEntity = tier.entities.find(entity => entity.ghost);
        if (!ghostEntity) {
            return;
        }
        ghostEntity.ghost = false;
        stopDraggingEntity();
        setTiers(newTiers);
    }

    function updateTierName(e, index) {
        const newTiers = structuredClone(tiers);
        newTiers[index].name = e.target.value;
        setTiers(newTiers);
    }

    function moveTier(curIndex, newIndex) {
        const newTiers = structuredClone(tiers);
        const temp = newTiers[newIndex];
        newTiers[newIndex] = newTiers[curIndex];
        newTiers[curIndex] = temp;
        setTiers(newTiers);
    }

    function addTier(index) {
        const newTiers = structuredClone(tiers);
        newTiers.splice(index, 0, {name: '', entities: []});
        setTiers(newTiers);
    }

    function deleteTier(index) {
        const newTiers = structuredClone(tiers);
        const confirm = window.confirm(`Are you sure you want to delete tier: ${newTiers[index].name}?`);
        if (!confirm) {
            return;
        }

        newTiers.splice(index, 1);
        setTiers(newTiers);
    }

    if (!entities.length) {
        return <div>No data</div>;
    }

    return (
        <div className="tier-list-container">
            <div className="tier-list">
                {tiers.map((tier, index) =>
                    <div
                        className="row" key={tier.entities.join() + colors[index]}
                        style={{backgroundColor: colors[index]}}
                    >
                        <div className="tier-name" style={{userSelect: 'none'}}
                        >
                            {
                                editable ?
                                    <input value={tier.name} className="tier-name-input"
                                           onInput={e => updateTierName(e, index)}
                                    />
                                    : tier.name
                            }
                            {
                                tiers.length !== 12 ?
                                    <button onClick={() => addTier(index + 1)}>+</button>
                                    : null
                            }
                        </div>
                        <div
                            className="rankings" onDragEnter={e => addGhostEntity(e, tier.name)}
                            onDragOver={e => e.preventDefault()}
                            onDrop={() => convertGhostToReal(tier.name)}
                        >
                            {tier.entities.map((entity, index) => (
                                    type === 'team' ? <Team
                                            label={entity.teamName} key={entity.id} draggable={editable} ghost={entity.ghost}
                                            tierName={tier.name} index={index} src={entity.avatar}
                                            startDraggingEntity={e => startDraggingRankedEntity(e, tier.name, entity.id)}
                                            stopDraggingEntity={stopDraggingEntity} entityId={entity.id}
                                            moveEntityToIndex={(e, index) => moveEntityToIndex(e, tier.name, index)}
                                            sortable
                                        /> :
                                        <Player
                                            firstName={entity.first_name} lastName={entity.last_name} key={entity.id}
                                            draggable={editable} ghost={entity.ghost} tierName={tier.name} index={index}
                                            startDraggingEntity={e => startDraggingRankedEntity(e, tier.name, entity.id)}
                                            stopDraggingEntity={stopDraggingEntity} entityId={entity.id}
                                            moveEntityToIndex={(e, index) => moveEntityToIndex(e, tier.name, index)}
                                            sortable
                                        />
                                )
                            )}
                            {
                                editable ?
                                    <div className="last-index"
                                         onDragEnter={e => moveEntityToIndex(e, tier.name, tier.entities.length)}
                                    >
                                    </div>
                                    : null
                            }
                        </div>
                        {
                            editable ?
                                <div className="controls">
                                    <button onClick={() => deleteTier(index)}>Delete</button>
                                    <div className="move">
                                        {
                                            index !== 0 ?
                                                <button onClick={() => moveTier(index, index - 1)}>Up</button>
                                                : null
                                        }
                                        {
                                            index !== tiers.length - 1 ?
                                                <button onClick={() => moveTier(index, index + 1)}>Down</button>
                                                : null
                                        }
                                    </div>
                                </div>
                                : null
                        }
                    </div>
                )}
            </div>
            {
                editable ?
                    <div className="options-list">
                        {unranked.map(entity => (
                            type === 'team' ?
                                <Team
                                    key={entity.id} entityId={entity.id} label={entity.teamName}
                                    startDraggingEntity={startDraggingEntity} src={entity.avatar}
                                    stopDraggingEntity={stopDraggingEntity} draggable
                                /> :
                                <Player
                                    key={entity.id} entityId={entity.id} firstName={entity.first_name}
                                    lastName={entity.last_name} startDraggingEntity={startDraggingEntity}
                                    stopDraggingEntity={stopDraggingEntity} draggable
                                />
                        ))}
                    </div>
                    : null
            }
        </div>
    );
}

function Entity({
                    label,
                    alt,
                    src,
                    entityId,
                    startDraggingEntity,
                    stopDraggingEntity,
                    draggable,
                    ghost,
                    index,
                    moveEntityToIndex,
                    sortable,
                    type
                }) {
    return (
        <div style={{position: 'relative'}} key={entityId}
             onDragStart={startDraggingEntity} onDragEnd={stopDraggingEntity} data-id={entityId}
             draggable={draggable}
        >
            {sortable ?
                <div className="reorder left" onDragEnter={e => moveEntityToIndex(e, index)}></div>
                : null}
            <div className={`option ${ghost ? 'ghost' : ''}`}>
                <img src={src} alt={alt} draggable="false"/>
                <div className={`entity-name ${type === 'team' ? 'team-name' : 'player-name'}`}>
                    <span className="entity-name-text">{label}</span>
                </div>
            </div>
            {sortable ?
                <div className="reorder right" onDragEnter={e => moveEntityToIndex(e, index + 1)}></div>
                : null}
        </div>
    );
}

function Player({
                    firstName,
                    lastName,
                    ...props
                }) {
    const label = `${firstName?.[0]}. ${lastName}`;
    const alt = `${firstName} ${lastName}`;
    const src = `https://sleepercdn.com/content/nfl/players/${props.entityId}.jpg`;
    return <Entity {...props} label={label} alt={alt} src={src}/>;
}

function Team(props) {
    return <Entity {...props} alt={props.label} type="team"/>;
}