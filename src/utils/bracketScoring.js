// Scores predicted winners/losers brackets (stored per-user in Firebase) against the
// real winners/losers brackets pulled live from Sleeper. Extracted from BracketResults.js
// so the scoring rules can be unit tested independently of the component/data fetching.

// Winners-bracket and losers-bracket rounds are scored identically except for which field of a
// round names the team advancing out of it ("w" for winners, but "l" for losers - Sleeper's
// losers-bracket rounds record the winner of that consolation game under "l") and how raw
// placement (round.p) maps to points (unchanged for winners, `12 - p` for losers since the
// losers bracket runs its own 1st/3rd/5th-place games).
function scoreBracketSide(rounds, realBracket, newUserScore, results, {advancingField, potentialKey, pointsForPlace}) {
    const otherField = advancingField === 'w' ? 'l' : 'w';

    rounds.forEach((round, index) => {
        const realRound = realBracket[index];
        const predictedAdvancer = round[advancingField];

        if (!round.p || round.p === 1) {
            if (predictedAdvancer === realRound.w) {
                newUserScore.total += 2 ** (round.r - 1) * 10;
            }
            if (realRound.l) {
                newUserScore.eliminated.push(realRound.l);
            } else if (!newUserScore.eliminated.includes(predictedAdvancer)) {
                newUserScore[potentialKey] += 2 ** (round.r - 1) * 10;
            }
        } else {
            if (round.w === realRound.w) {
                newUserScore.total += 10;
            } else if (!realRound.w) {
                if (round.p === 5 && round.w && ![realBracket[0].w, realBracket[1].w].includes(round.w)) {
                    newUserScore[potentialKey] += 10;
                } else if (round.p === 3 && round.w && ![realBracket[0].l, realBracket[1].l, realBracket[2].w, realBracket[3].w].includes(round.w)) {
                    newUserScore[potentialKey] += 10;
                }
            }
        }

        if (!round.p) {
            return;
        }

        if (round.p === 1) {
            results[round[advancingField]].trophies += 1;
        }

        const points = pointsForPlace(round.p);
        if (round.w) {
            results[round.w].total += points;
            if (round.l) {
                results[round.l].total += points + 1;
            }
        } else {
            results[rounds[round.t1_from.l - 1][otherField]].total += points + 0.5;
            results[rounds[round.t2_from.l - 1][otherField]].total += points + 0.5;
        }
    });
}

export function scoreBrackets(brackets, teams, winnersBracket, losersBracket) {
    const newScores = {};
    const init = Object.entries(teams).reduce((result, [userId, team]) => {
        result[team.rosterId] = {
            userId,
            total: 0,
            trophies: 0
        };
        newScores[userId] = {
            userId,
            total: 0,
            winnersPotential: 0,
            losersPotential: 0,
            eliminated: [],
        };
        return result;
    }, {});

    const newResults = Object.entries(brackets).reduce((results, [userId, userBrackets]) => {
        const {winning, losing} = userBrackets;

        scoreBracketSide(winning, winnersBracket, newScores[userId], results, {
            advancingField: 'w',
            potentialKey: 'winnersPotential',
            pointsForPlace: place => place,
        });

        // Losers bracket still uses 1st/3rd/5th place games, so subtract from 12 to get place.
        scoreBracketSide(losing, losersBracket, newScores[userId], results, {
            advancingField: 'l',
            potentialKey: 'losersPotential',
            pointsForPlace: place => 12 - place,
        });

        return results;
    }, init);

    return {bracketPoints: newScores, teamResults: newResults};
}
