/**
 * KEMETION Cricket Data API Integration
 * Handles all API calls to Cricket Data API
 * API Key: afb22ee0-add7-48b4-af1d-bdf319c03c9d
 */

const CRICKET_API = {
    BASE_URL: 'https://api.cricapi.com/v1',
    API_KEY: '1a822521-d7e0-46ff-98d3-3e51020863f3', // Paid API Key
    CACHE_DURATION: 5000, // 5 seconds for live data
    cache: {},
    
    /**
     * Make API request with caching
     */
    async request(endpoint, params = {}) {
        try {
            const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
            const now = Date.now();
            
            // Check cache
            if (this.cache[cacheKey] && (now - this.cache[cacheKey].timestamp) < this.CACHE_DURATION) {
                return this.cache[cacheKey].data;
            }
            
            // Build URL
            const url = new URL(`${this.BASE_URL}/${endpoint}`);
            url.searchParams.append('apikey', this.API_KEY);
            Object.keys(params).forEach(key => {
                url.searchParams.append(key, params[key]);
            });
            
            // Make request
            const response = await fetch(url.toString());
            const data = await response.json();
            
            // Cache result
            this.cache[cacheKey] = {
                data: data,
                timestamp: now
            };
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            return { status: 'error', error: error.message };
        }
    },
    
    /**
     * Get current live matches
     */
    async getCurrentMatches() {
        return this.request('currentMatches');
    },
    
    /**
     * Get match info by ID
     */
    async getMatchInfo(matchId) {
        return this.request('matchInfo', { id: matchId });
    },
    
    /**
     * Get live score for a match
     */
    async getLiveScore(matchId) {
        return this.request('cricScore', { id: matchId });
    },
    
    /**
     * Get all series
     */
    async getSeries() {
        return this.request('seriesList');
    },
    
    /**
     * Search series
     */
    async searchSeries(seriesName) {
        return this.request('seriesSearch', { name: seriesName });
    },
    
    /**
     * Get all matches
     */
    async getMatches(seriesId = null) {
        const params = seriesId ? { seriesId: seriesId } : {};
        return this.request('matchesList', params);
    },
    
    /**
     * Get all players
     */
    async getPlayers() {
        return this.request('playersList');
    },
    
    /**
     * Search player
     */
    async searchPlayer(playerName) {
        return this.request('playersSearch', { name: playerName });
    },
    
    /**
     * Get player info
     */
    async getPlayerInfo(playerId) {
        return this.request('playerInfo', { id: playerId });
    },
    
    /**
     * Get fantasy squad for match
     */
    async getFantasySquad(matchId) {
        return this.request('fantasySquad', { id: matchId });
    },
    
    /**
     * Get fantasy scorecard
     */
    async getFantasyScorecard(matchId) {
        return this.request('fantasyScorecard', { id: matchId });
    },
    
    /**
     * Get fantasy match points
     */
    async getFantasyMatchPoints(matchId) {
        return this.request('fantasyMatchPoints', { id: matchId });
    },
    
    /**
     * Get series squads
     */
    async getSeriesSquads(seriesId) {
        return this.request('seriesSquads', { id: seriesId });
    },
    
    /**
     * Get series point table
     */
    async getSeriesPointTable(seriesId) {
        return this.request('seriesPointTable', { id: seriesId });
    },
    
    /**
     * Get country list
     */
    async getCountries() {
        return this.request('countryList');
    },
    
    /**
     * Clear cache
     */
    clearCache() {
        this.cache = {};
    },
    
    /**
     * Format match data for display
     */
    formatMatch(match) {
        return {
            id: match.id,
            title: match.name || `${match.t1} vs ${match.t2}`,
            team1: match.t1,
            team2: match.t2,
            team1Short: match.t1s,
            team2Short: match.t2s,
            status: match.status,
            format: match.format,
            date: match.dateTimeGMT,
            venue: match.venue,
            series: match.series,
            seriesId: match.series_id,
            score1: match.score1,
            score2: match.score2,
            overs1: match.overs1,
            overs2: match.overs2,
            wickets1: match.wickets1,
            wickets2: match.wickets2,
            image: match.image
        };
    },
    
    /**
     * Filter matches by status
     */
    filterMatches(matches, status) {
        if (status === 'all') return matches;
        return matches.filter(m => m.status === status);
    },
    
    /**
     * Get upcoming matches (today and future)
     */
    getUpcomingMatches(matches) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return matches.filter(m => {
            const matchDate = new Date(m.dateTimeGMT);
            return matchDate >= today && m.status !== 'completed';
        });
    },
    
    /**
     * Get live matches
     */
    getLiveMatches(matches) {
        return matches.filter(m => m.status === 'live');
    },
    
    /**
     * Get completed matches
     */
    getCompletedMatches(matches) {
        return matches.filter(m => m.status === 'completed');
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CRICKET_API;
}
