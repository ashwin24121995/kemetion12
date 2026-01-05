const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// MySQL Connection Pool - Railway Configuration
const pool = mysql.createPool({
  host: 'shortline.proxy.rlwy.net',
  user: 'root',
  password: 'gHqTOZRBzmuKReUNbOXKAvkRZFpjVkwh',
  database: 'railway',
  port: 52808,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true
});

// JWT Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  
  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  const bearerToken = token.startsWith('Bearer ') ? token.slice(7) : token;

  jwt.verify(bearerToken, process.env.JWT_SECRET || 'kemetion_secret_key_2024', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.userId = decoded.id;
    next();
  });
};

// ==================== USER ROUTES ====================

// Register User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const connection = await pool.getConnection();

    // Check if user exists
    const [existingUser] = await connection.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser.length > 0) {
      connection.release();
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await connection.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    connection.release();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const connection = await pool.getConnection();

    const [users] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      connection.release();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'kemetion_secret_key_2024',
      { expiresIn: '7d' }
    );

    connection.release();

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Get User Profile
app.get('/api/users/profile', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [users] = await connection.query(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [req.userId]
    );

    connection.release();

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
});

// ==================== TEAM ROUTES ====================

// Create Team
app.post('/api/teams/create', verifyToken, async (req, res) => {
  try {
    const { matchId, teamName, players, captain, viceCaptain } = req.body;

    if (!matchId || !teamName || !players || !captain || !viceCaptain) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (players.length !== 11) {
      return res.status(400).json({ message: 'Team must have exactly 11 players' });
    }

    const connection = await pool.getConnection();

    // Create team
    const [result] = await connection.query(
      'INSERT INTO teams (user_id, match_id, team_name, captain_id, vice_captain_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [req.userId, matchId, teamName, captain, viceCaptain]
    );

    const teamId = result.insertId;

    // Add players to team
    for (const playerId of players) {
      await connection.query(
        'INSERT INTO team_players (team_id, player_id) VALUES (?, ?)',
        [teamId, playerId]
      );
    }

    connection.release();

    res.status(201).json({
      message: 'Team created successfully',
      teamId,
      team: {
        id: teamId,
        name: teamName,
        players: players.length,
        captain,
        viceCaptain
      }
    });
  } catch (error) {
    console.error('Team creation error:', error);
    res.status(500).json({ message: 'Failed to create team', error: error.message });
  }
});

// Get User Teams
app.get('/api/teams/user', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [teams] = await connection.query(
      'SELECT * FROM teams WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );

    connection.release();

    res.json(teams);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ message: 'Failed to fetch teams', error: error.message });
  }
});

// ==================== MATCH ROUTES ====================

// Get All Matches
app.get('/api/matches', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [matches] = await connection.query(
      'SELECT * FROM matches ORDER BY match_date DESC'
    );

    connection.release();

    res.json(matches);
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ message: 'Failed to fetch matches', error: error.message });
  }
});

// Get Match Details
app.get('/api/matches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [matches] = await connection.query(
      'SELECT * FROM matches WHERE id = ?',
      [id]
    );

    connection.release();

    if (matches.length === 0) {
      return res.status(404).json({ message: 'Match not found' });
    }

    res.json(matches[0]);
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({ message: 'Failed to fetch match', error: error.message });
  }
});

// ==================== LEADERBOARD ROUTES ====================

// Get Leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [leaderboard] = await connection.query(`
      SELECT 
        u.id,
        u.username,
        COUNT(DISTINCT t.id) as total_teams,
        COALESCE(SUM(t.points), 0) as total_points,
        ROUND(COALESCE(AVG(t.points), 0), 2) as avg_points
      FROM users u
      LEFT JOIN teams t ON u.id = t.user_id
      GROUP BY u.id, u.username
      ORDER BY total_points DESC
      LIMIT 100
    `);

    connection.release();

    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard', error: error.message });
  }
});

// ==================== CONTEST ROUTES ====================

// Get All Contests
app.get('/api/contests', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [contests] = await connection.query(
      'SELECT * FROM contests ORDER BY created_at DESC'
    );

    connection.release();

    res.json(contests);
  } catch (error) {
    console.error('Get contests error:', error);
    res.status(500).json({ message: 'Failed to fetch contests', error: error.message });
  }
});

// Join Contest
app.post('/api/contests/join', verifyToken, async (req, res) => {
  try {
    const { contestId, teamId } = req.body;

    if (!contestId || !teamId) {
      return res.status(400).json({ message: 'Contest ID and Team ID are required' });
    }

    const connection = await pool.getConnection();

    // Check if already joined
    const [existing] = await connection.query(
      'SELECT * FROM contest_entries WHERE contest_id = ? AND team_id = ?',
      [contestId, teamId]
    );

    if (existing.length > 0) {
      connection.release();
      return res.status(400).json({ message: 'Already joined this contest' });
    }

    // Join contest
    await connection.query(
      'INSERT INTO contest_entries (contest_id, team_id, user_id) VALUES (?, ?, ?)',
      [contestId, teamId, req.userId]
    );

    connection.release();

    res.status(201).json({ message: 'Successfully joined contest' });
  } catch (error) {
    console.error('Join contest error:', error);
    res.status(500).json({ message: 'Failed to join contest', error: error.message });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'KEMETION API is running',
    timestamp: new Date().toISOString()
  });
});

// ==================== SERVE STATIC PAGES ====================

// Serve index page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Serve page routes
app.get('/pages/:page', (req, res) => {
  const page = req.params.page;
  res.sendFile(path.join(__dirname, `../public/pages/${page}.html`));
});

// ==================== ERROR HANDLING ====================

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 KEMETION API Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: Railway MySQL connected`);
  console.log(`✅ Server ready to accept requests\n`);
});

module.exports = app;
