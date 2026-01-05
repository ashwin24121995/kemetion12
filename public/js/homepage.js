/**
 * KEMETION Homepage - Real-time Match Display with API Integration
 */

let allMatches = [];
let currentFilter = 'all';

/**
 * Initialize homepage on page load
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Homepage loading...');
    
    // Load matches
    await loadMatches();
    
    // Setup FAQ accordions
    setupFAQ();
    
    // Setup filter buttons
    setupFilters();
    
    // Auto-refresh matches every 5 seconds
    setInterval(loadMatches, 5000);
});

/**
 * Load matches from Cricket API
 */
async function loadMatches() {
    try {
        const response = await CRICKET_API.getCurrentMatches();
        
        if (response.status === 'success' && response.data) {
            allMatches = response.data.map(m => CRICKET_API.formatMatch(m));
            
            // Update stats
            updateStats();
            
            // Display matches based on current filter
            displayMatches();
            
            // Update featured carousel
            updateFeaturedCarousel();
        }
    } catch (error) {
        console.error('Error loading matches:', error);
    }
}

/**
 * Update statistics dashboard
 */
function updateStats() {
    const liveMatches = CRICKET_API.getLiveMatches(allMatches);
    const upcomingMatches = CRICKET_API.getUpcomingMatches(allMatches);
    
    document.getElementById('live-count').textContent = liveMatches.length;
    document.getElementById('upcoming-count').textContent = upcomingMatches.length;
}

/**
 * Display matches based on current filter
 */
function displayMatches() {
    const container = document.getElementById('matches-container');
    let filteredMatches = allMatches;
    
    if (currentFilter === 'live') {
        filteredMatches = CRICKET_API.getLiveMatches(allMatches);
    } else if (currentFilter === 'upcoming') {
        filteredMatches = CRICKET_API.getUpcomingMatches(allMatches);
    } else if (currentFilter === 'completed') {
        filteredMatches = CRICKET_API.getCompletedMatches(allMatches);
    }
    
    if (filteredMatches.length === 0) {
        container.innerHTML = '<div class="loading"><p>No matches found in this category.</p></div>';
        return;
    }
    
    container.innerHTML = filteredMatches.map(match => createMatchCard(match)).join('');
}

/**
 * Create match card HTML
 */
function createMatchCard(match) {
    const matchDate = new Date(match.date);
    const timeString = matchDate.toLocaleString('en-IN', {
        day: 'short',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    let actionButton = '';
    if (match.status === 'upcoming') {
        actionButton = `<a href="/pages/match.html?matchId=${match.id}" class="btn btn-primary btn-small">Create Team</a>`;
    } else if (match.status === 'live') {
        actionButton = `<a href="/pages/match.html?matchId=${match.id}" class="btn btn-primary btn-small">View Live</a>`;
    } else {
        actionButton = `<a href="/pages/match.html?matchId=${match.id}" class="btn btn-secondary btn-small">View Results</a>`;
    }
    
    return `
        <div class="match-card">
            <div class="match-header">
                <div>
                    <div class="match-title">${match.title}</div>
                    <div style="font-size: 12px; color: #999; margin-top: 5px;">${match.format} • ${match.series}</div>
                </div>
                <span class="match-status status-${match.status}">${match.status.toUpperCase()}</span>
            </div>
            <div class="match-teams">
                <div class="team-info">
                    <div class="team-name">${match.team1}</div>
                    <div class="team-score">${match.score1 || '-'}</div>
                </div>
                <div class="team-info">
                    <div class="team-name">${match.team2}</div>
                    <div class="team-score">${match.score2 || '-'}</div>
                </div>
            </div>
            <div style="text-align: center; padding: 10px; background: #f9f9f9; border-radius: 5px; margin: 10px 0; font-size: 12px; color: #666;">
                ${match.venue || 'Venue TBA'}
            </div>
            <div class="match-footer">
                <span class="match-time">${timeString}</span>
                ${actionButton}
            </div>
        </div>
    `;
}

/**
 * Update featured carousel
 */
function updateFeaturedCarousel() {
    const carousel = document.getElementById('featured-carousel');
    const featured = allMatches.slice(0, 5);
    
    carousel.innerHTML = featured.map(match => createFeaturedCard(match)).join('');
}

/**
 * Create featured card HTML
 */
function createFeaturedCard(match) {
    const matchDate = new Date(match.date);
    const timeString = matchDate.toLocaleString('en-IN', {
        day: 'short',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    return `
        <div class="featured-card">
            <div class="featured-card-header">
                <div style="font-size: 14px; margin-bottom: 10px;">${match.series}</div>
                <div style="font-size: 12px; opacity: 0.9;">${match.format}</div>
            </div>
            <div class="featured-card-body">
                <div class="featured-teams">
                    <div class="featured-team">
                        <div class="featured-team-name">${match.team1}</div>
                        <div class="featured-team-score">${match.score1 || '-'}</div>
                    </div>
                    <div class="vs-text">VS</div>
                    <div class="featured-team">
                        <div class="featured-team-name">${match.team2}</div>
                        <div class="featured-team-score">${match.score2 || '-'}</div>
                    </div>
                </div>
                <div style="text-align: center; font-size: 12px; color: #999; margin: 15px 0;">
                    ${timeString}
                </div>
                <div style="text-align: center;">
                    <span class="match-status status-${match.status}">${match.status.toUpperCase()}</span>
                </div>
                <div style="text-align: center; margin-top: 15px;">
                    <a href="/pages/match.html?matchId=${match.id}" class="btn btn-primary" style="width: 100%;">View Match</a>
                </div>
            </div>
        </div>
    `;
}

/**
 * Filter matches
 */
function filterMatches(filter) {
    currentFilter = filter;
    
    // Update button styles
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Display filtered matches
    displayMatches();
}

/**
 * Scroll carousel
 */
function scrollCarousel(direction) {
    const carousel = document.getElementById('featured-carousel');
    const scrollAmount = 320;
    carousel.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
}

/**
 * Setup FAQ accordions
 */
function setupFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            // Close other items
            faqItems.forEach(other => {
                if (other !== item) {
                    other.classList.remove('active');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
        });
    });
}

/**
 * Setup filter buttons
 */
function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            displayMatches();
        });
    });
}

/**
 * Format time for display
 */
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
        day: 'short',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}
