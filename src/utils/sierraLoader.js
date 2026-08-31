// Every route depends on a `league` query param rather than a backend session. When it's
// missing, the app redirects to the same URL with the default (Sierra) league id appended.
// Returns the URL to redirect to, or null if the current URL already has a league param.
export function computeSierraRedirect(requestUrl, sierraLeagueId){
    const url = new URL(requestUrl);
    if(url.searchParams.get('league')){
        return null;
    }

    url.searchParams.set('league', sierraLeagueId);
    return url.toString();
}
