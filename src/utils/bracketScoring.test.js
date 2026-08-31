import {scoreBrackets} from './bracketScoring';

// Teams keyed by userId, each with a Sleeper rosterId.
const teams = {
    u1: {rosterId: 1, displayName: 'Alice'},
    u2: {rosterId: 2, displayName: 'Bob'},
    u3: {rosterId: 3, displayName: 'Carol'},
    u4: {rosterId: 4, displayName: 'Dave'},
};

describe('scoreBrackets', () => {
    test('awards round-scaled points when a semifinal winner is predicted correctly', () => {
        const winnersBracket = [
            {r: 1, t1: 1, t2: 4, w: 1, l: 4},
            {r: 1, t1: 2, t2: 3, w: 2, l: 3},
            {r: 2, p: 1, t1_from: {w: 1}, t2_from: {w: 2}, w: 1, l: 2},
        ];
        const losersBracket = [];

        const brackets = {
            u1: {
                winning: [
                    {r: 1, w: 1, l: 4},
                    {r: 1, w: 2, l: 3},
                    {r: 2, p: 1, t1_from: {w: 1}, t2_from: {w: 2}, w: 1, l: 2},
                ],
                losing: [],
            },
        };

        const {bracketPoints, teamResults} = scoreBrackets(brackets, teams, winnersBracket, losersBracket);

        // Round 1 (r=1) correct picks: 2 ** (1-1) * 10 = 10 each; round 2 (r=2) final correct: 2 ** (2-1) * 10 = 20.
        expect(bracketPoints.u1.total).toBe(40);
        expect(bracketPoints.u1.eliminated).toEqual(expect.arrayContaining([4, 3]));

        // Champion (rosterId 1) gets a trophy and the round-1 placement points from the final.
        expect(teamResults[1].trophies).toBe(1);
    });

    test('does not award points for an incorrect round-1 pick', () => {
        const winnersBracket = [
            {r: 1, t1: 1, t2: 4, w: 1, l: 4},
        ];
        const losersBracket = [];
        const brackets = {
            u1: {
                winning: [{r: 1, w: 4, l: 1}], // predicted the loser to win
                losing: [],
            },
        };

        const {bracketPoints} = scoreBrackets(brackets, teams, winnersBracket, losersBracket);

        expect(bracketPoints.u1.total).toBe(0);
    });

    test('accrues winnersPotential for a not-yet-eliminated correct pick with no real winner yet', () => {
        const winnersBracket = [
            {r: 1, t1: 1, t2: 4, w: null, l: null}, // game not yet played
        ];
        const losersBracket = [];
        const brackets = {
            u1: {
                winning: [{r: 1, w: 1, l: 4}],
                losing: [],
            },
        };

        const {bracketPoints} = scoreBrackets(brackets, teams, winnersBracket, losersBracket);

        expect(bracketPoints.u1.total).toBe(0);
        expect(bracketPoints.u1.winnersPotential).toBe(10);
        expect(bracketPoints.u1.eliminated).toEqual([]);
    });

    test('stops crediting potential once a team is eliminated', () => {
        const winnersBracket = [
            {r: 1, t1: 1, t2: 4, w: 4, l: 1}, // team 1 was eliminated in round 1
            {r: 2, t1: 4, t2: 2, w: null, l: null},
        ];
        const losersBracket = [];
        const brackets = {
            u1: {
                winning: [
                    {r: 1, w: 1, l: 4},
                    {r: 2, w: 1, l: 4}, // still predicting the already-eliminated team 1 to advance
                ],
                losing: [],
            },
        };

        const {bracketPoints} = scoreBrackets(brackets, teams, winnersBracket, losersBracket);

        expect(bracketPoints.u1.eliminated).toEqual([1]);
        // Round 2 pick of team 1 shouldn't add potential since team 1 is already eliminated.
        expect(bracketPoints.u1.winnersPotential).toBe(0);
    });

    test('awards flat 10 points for a correctly predicted 3rd place game', () => {
        const winnersBracket = [
            {r: 1, t1: 1, t2: 4, w: 1, l: 4},
            {r: 1, t1: 2, t2: 3, w: 2, l: 3},
            {r: 2, p: 1, t1_from: {w: 1}, t2_from: {w: 2}, w: 1, l: 2},
            {r: 2, p: 3, t1_from: {l: 1}, t2_from: {l: 2}, w: 4, l: 3},
        ];
        const losersBracket = [];
        const brackets = {
            u1: {
                winning: [
                    {r: 1, w: 1, l: 4},
                    {r: 1, w: 2, l: 3},
                    {r: 2, p: 1, w: 1, l: 2},
                    {r: 2, p: 3, w: 4, l: 3},
                ],
                losing: [],
            },
        };

        const {bracketPoints, teamResults} = scoreBrackets(brackets, teams, winnersBracket, losersBracket);

        // 10 (r1) + 10 (r1) + 20 (final r2) + 10 (flat 3rd place) = 50
        expect(bracketPoints.u1.total).toBe(50);
        expect(teamResults[4].trophies).toBe(0);
        expect(teamResults[3].trophies).toBe(0);
    });

    test('losers bracket points use 12-minus-place instead of the raw place', () => {
        const winnersBracket = [];
        const losersBracket = [
            {r: 1, t1: 1, t2: 2, w: 1, l: 2, p: 9},
        ];
        const brackets = {
            u1: {
                winning: [],
                losing: [{r: 1, w: 1, l: 2, p: 9}],
            },
        };

        const {teamResults} = scoreBrackets(brackets, teams, winnersBracket, losersBracket);

        // Winner of losers-bracket game gets 12 - 9 = 3 points; the loser gets 12 - 9 + 1 = 4.
        expect(teamResults[1].total).toBe(3);
        expect(teamResults[2].total).toBe(4);
    });

    test('splits placement points between both predecessors when a round has no winner yet', () => {
        const winnersBracket = [
            {r: 1, t1: 1, t2: 4, w: 1, l: 4},
            {r: 1, t1: 2, t2: 3, w: 2, l: 3},
            {r: 2, p: 3, t1_from: {l: 1}, t2_from: {l: 2}, w: null, l: null},
        ];
        const losersBracket = [];
        const brackets = {
            u1: {
                winning: [
                    {r: 1, w: 1, l: 4},
                    {r: 1, w: 2, l: 3},
                    {r: 2, p: 3, t1_from: {l: 1}, t2_from: {l: 2}, w: null, l: null},
                ],
                losing: [],
            },
        };

        const {teamResults} = scoreBrackets(brackets, teams, winnersBracket, losersBracket);

        // Both round-1 losers (4 and 3) feed the undecided 3rd-place game and split its points (3 + 0.5) each.
        // Round-1 games have no `p` (place) field, so they contribute no placement points of their own.
        expect(teamResults[4].total).toBe(3.5);
        expect(teamResults[3].total).toBe(3.5);
    });

    test('awards winnersPotential for an undecided 5th place pick that is not an actual finalist', () => {
        const winnersBracket = [
            {r: 1, t1: 1, t2: 4, w: 1, l: 4},
            {r: 1, t1: 2, t2: 3, w: 2, l: 3},
            {r: 2, p: 5, t1_from: {l: 1}, t2_from: {l: 2}, w: null, l: null},
        ];
        const losersBracket = [];
        const brackets = {
            u1: {
                winning: [
                    {r: 1, w: 1, l: 4},
                    {r: 1, w: 2, l: 3},
                    {r: 2, p: 5, w: 4, l: 3, t1_from: {l: 1}, t2_from: {l: 2}},
                ],
                losing: [],
            },
        };

        const {bracketPoints, teamResults} = scoreBrackets(brackets, teams, winnersBracket, losersBracket);

        expect(bracketPoints.u1.total).toBe(20); // two correct round-1 picks: 10 each
        expect(bracketPoints.u1.winnersPotential).toBe(10); // predicted 5th-place winner (4) isn't a finalist
        expect(teamResults[4].total).toBe(5); // predicted 5th-place winner gets the raw place value
        expect(teamResults[3].total).toBe(6); // predicted 5th-place loser gets place + 1
    });

    test('awards winnersPotential for an undecided 3rd place pick not excluded as an already-known team', () => {
        const winnersBracket = [
            {r: 1, t1: 1, t2: 4, w: null, l: null},
            {r: 1, t1: 2, t2: 3, w: null, l: null},
            {r: 2, p: 1, w: null, l: null},
            {r: 2, p: 3, w: null, l: null},
        ];
        const losersBracket = [];
        const brackets = {
            u1: {
                winning: [
                    {r: 1, w: 1, l: 4},
                    {r: 1, w: 2, l: 3},
                    {r: 2, p: 1, w: 1, l: 2},
                    {r: 2, p: 3, w: 4, l: 3},
                ],
                losing: [],
            },
        };

        const {bracketPoints} = scoreBrackets(brackets, teams, winnersBracket, losersBracket);

        // All four rounds are still undecided in the real bracket, so every correct-looking pick
        // only accrues potential (10 for each round-1 pick, 20 for the final, 10 for 3rd place).
        expect(bracketPoints.u1.winnersPotential).toBe(50);
        expect(bracketPoints.u1.total).toBe(0);
    });

    test('does not throw and awards no potential once a losers-bracket team is eliminated', () => {
        const winnersBracket = [];
        const losersBracket = [
            {r: 1, t1: 1, t2: 2, w: 1, l: 2},
        ];
        const brackets = {
            u1: {
                winning: [],
                losing: [{r: 1, w: 1, l: 1}],
            },
        };

        const {bracketPoints} = scoreBrackets(brackets, teams, winnersBracket, losersBracket);

        // round.l (1) matches the real losers-bracket winner, so it scores; team 2 (the real loser) is eliminated.
        expect(bracketPoints.u1.total).toBe(10);
        expect(bracketPoints.u1.eliminated).toEqual([2]);
        expect(bracketPoints.u1.losersPotential).toBe(0);
    });

    test('accrues losersPotential for an undecided round-1 losers-bracket pick', () => {
        const winnersBracket = [];
        const losersBracket = [
            {r: 1, t1: 1, t2: 2, w: null, l: null},
        ];
        const brackets = {
            u1: {
                winning: [],
                losing: [{r: 1, l: 1}],
            },
        };

        const {bracketPoints} = scoreBrackets(brackets, teams, winnersBracket, losersBracket);

        expect(bracketPoints.u1.total).toBe(0);
        expect(bracketPoints.u1.losersPotential).toBe(10);
        expect(bracketPoints.u1.eliminated).toEqual([]);
    });

    test('awards losersPotential for an undecided losers-bracket 5th place pick', () => {
        const winnersBracket = [];
        const losersBracket = [
            {r: 1, t1: 1, t2: 2, w: 1, l: 2},
            {r: 1, t1: 3, t2: 4, w: 3, l: 4},
            {r: 2, p: 5, w: null, l: null},
        ];
        const brackets = {
            u1: {
                winning: [],
                losing: [
                    {r: 1, l: 1},
                    {r: 1, l: 3},
                    {r: 2, p: 5, w: 2, l: 4},
                ],
            },
        };

        const {bracketPoints, teamResults} = scoreBrackets(brackets, teams, winnersBracket, losersBracket);

        expect(bracketPoints.u1.losersPotential).toBe(10); // predicted 5th-place winner (2) isn't an actual game winner
        expect(teamResults[2].total).toBe(7); // 12 - 5
        expect(teamResults[4].total).toBe(8); // 12 - 5 + 1
    });

    test('awards losersPotential for an undecided losers-bracket 3rd place pick', () => {
        const winnersBracket = [];
        const losersBracket = [
            {r: 1, t1: 1, t2: 2, w: null, l: null},
            {r: 1, t1: 3, t2: 4, w: null, l: null},
            {r: 2, p: 1, w: null, l: null},
            {r: 2, p: 5, w: null, l: null},
        ];
        const brackets = {
            u1: {
                winning: [],
                losing: [
                    {r: 1, l: 1},
                    {r: 1, l: 3},
                    {r: 2, p: 3, w: 4, l: 3},
                ],
            },
        };

        const {bracketPoints, teamResults} = scoreBrackets(brackets, teams, winnersBracket, losersBracket);

        expect(bracketPoints.u1.losersPotential).toBe(30); // 10 + 10 (undecided round-1 picks) + 10 (3rd place pick)
        expect(teamResults[4].total).toBe(9); // 12 - 3
        expect(teamResults[3].total).toBe(10); // 12 - 3 + 1
    });

    test('awards a losers-bracket trophy and splits placement points when the final has no winner yet', () => {
        const winnersBracket = [];
        const losersBracket = [
            {r: 1, t1: 1, t2: 2, w: null, l: null},
            {r: 1, t1: 3, t2: 4, w: null, l: null},
            {r: 2, p: 1, w: null, l: null},
        ];
        const brackets = {
            u1: {
                winning: [],
                losing: [
                    {r: 1, w: 2, l: 1},
                    {r: 1, w: 4, l: 3},
                    {r: 2, p: 1, l: 2, t1_from: {l: 1}, t2_from: {l: 2}},
                ],
            },
        };

        const {teamResults} = scoreBrackets(brackets, teams, winnersBracket, losersBracket);

        // The predicted losers-bracket "winner" (round.l = 2) gets a trophy for the placement game.
        expect(teamResults[2].trophies).toBe(1);
        // No winner is predicted for the final (round.w is undefined), so its points split between
        // the winners of the two feeder round-1 games predicted in `losing` (2 and 4): 12 - 1 + 0.5 = 11.5 each.
        expect(teamResults[2].total).toBe(11.5);
        expect(teamResults[4].total).toBe(11.5);
    });
});
