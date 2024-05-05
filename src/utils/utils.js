export async function fetchPlayerInfo(playerId) {
    let playerInfo = localStorage.getItem(playerId);
    if (playerInfo) {
        return JSON.parse(playerInfo);
    }
    const res = await fetch(`https://api.sleeper.com/players/nfl/${playerId}`);
    playerInfo = await res.json();
    localStorage.setItem(playerId, JSON.stringify(playerInfo));
    return playerInfo;
}