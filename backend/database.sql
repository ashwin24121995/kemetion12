-- KEMETION Fantasy Cricket Database Schema
-- Created: January 5, 2026

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  phone VARCHAR(20),
  country VARCHAR(50),
  state VARCHAR(50),
  city VARCHAR(50),
  profile_image VARCHAR(255),
  bio TEXT,
  total_points INT DEFAULT 0,
  total_teams INT DEFAULT 0,
  total_contests INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Matches Table
CREATE TABLE IF NOT EXISTS matches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_name VARCHAR(255) NOT NULL,
  team1_name VARCHAR(100) NOT NULL,
  team2_name VARCHAR(100) NOT NULL,
  match_type VARCHAR(50) NOT NULL, -- T20, ODI, Test
  match_date DATETIME NOT NULL,
  venue VARCHAR(255),
  status VARCHAR(50) DEFAULT 'upcoming', -- upcoming, live, completed
  team1_score INT,
  team2_score INT,
  team1_wickets INT,
  team2_wickets INT,
  winner VARCHAR(100),
  toss_winner VARCHAR(100),
  toss_decision VARCHAR(50),
  man_of_match VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_match_date (match_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Players Table
CREATE TABLE IF NOT EXISTS players (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_name VARCHAR(100) NOT NULL,
  country VARCHAR(50) NOT NULL,
  role VARCHAR(50) NOT NULL, -- Batsman, Bowler, All-rounder, Wicket-keeper
  batting_style VARCHAR(50),
  bowling_style VARCHAR(50),
  jersey_number INT,
  player_image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_country (country),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  match_id INT NOT NULL,
  team_name VARCHAR(100) NOT NULL,
  captain_id INT,
  vice_captain_id INT,
  points INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active', -- active, locked, completed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_match_id (match_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Team Players Table
CREATE TABLE IF NOT EXISTS team_players (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  player_id INT NOT NULL,
  points INT DEFAULT 0,
  is_captain BOOLEAN DEFAULT FALSE,
  is_vice_captain BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  UNIQUE KEY unique_team_player (team_id, player_id),
  INDEX idx_team_id (team_id),
  INDEX idx_player_id (player_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Contests Table
CREATE TABLE IF NOT EXISTS contests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  contest_name VARCHAR(255) NOT NULL,
  description TEXT,
  entry_fee INT DEFAULT 0,
  prize_pool INT DEFAULT 0,
  total_spots INT DEFAULT 500,
  filled_spots INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'open', -- open, live, completed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  INDEX idx_match_id (match_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Contest Entries Table
CREATE TABLE IF NOT EXISTS contest_entries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  contest_id INT NOT NULL,
  team_id INT NOT NULL,
  user_id INT NOT NULL,
  rank INT,
  points INT DEFAULT 0,
  prize_amount INT DEFAULT 0,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_contest_team (contest_id, team_id),
  INDEX idx_contest_id (contest_id),
  INDEX idx_user_id (user_id),
  INDEX idx_rank (rank)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Player Performance Table
CREATE TABLE IF NOT EXISTS player_performances (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  player_id INT NOT NULL,
  runs_scored INT DEFAULT 0,
  balls_faced INT DEFAULT 0,
  fours INT DEFAULT 0,
  sixes INT DEFAULT 0,
  wickets_taken INT DEFAULT 0,
  runs_conceded INT DEFAULT 0,
  overs_bowled DECIMAL(3,1) DEFAULT 0,
  catches INT DEFAULT 0,
  stumpings INT DEFAULT 0,
  total_points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  UNIQUE KEY unique_match_player (match_id, player_id),
  INDEX idx_match_id (match_id),
  INDEX idx_player_id (player_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Leaderboard View
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  u.id,
  u.username,
  u.profile_image,
  COUNT(DISTINCT t.id) as total_teams,
  COALESCE(SUM(t.points), 0) as total_points,
  ROUND(COALESCE(AVG(t.points), 0), 2) as avg_points_per_team,
  COUNT(DISTINCT ce.contest_id) as contests_joined,
  COALESCE(SUM(ce.prize_amount), 0) as total_winnings,
  u.created_at,
  RANK() OVER (ORDER BY COALESCE(SUM(t.points), 0) DESC) as rank
FROM users u
LEFT JOIN teams t ON u.id = t.user_id
LEFT JOIN contest_entries ce ON t.id = ce.team_id
WHERE u.is_active = TRUE
GROUP BY u.id, u.username, u.profile_image, u.created_at
ORDER BY total_points DESC;

-- Create Scoring System Table
CREATE TABLE IF NOT EXISTS scoring_rules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  action_name VARCHAR(100) NOT NULL UNIQUE,
  points INT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Default Scoring Rules
INSERT INTO scoring_rules (action_name, points, description) VALUES
('runs_per_run', 1, 'Points for each run scored'),
('boundary', 1, 'Points for hitting a boundary (4 runs)'),
('six', 2, 'Points for hitting a six (6 runs)'),
('wicket_bowler', 25, 'Points for bowler taking a wicket'),
('wicket_fielder', 8, 'Points for fielder taking a wicket'),
('catch', 8, 'Points for taking a catch'),
('stumping', 12, 'Points for stumping'),
('fifty_runs', 10, 'Bonus points for scoring 50 runs'),
('century', 16, 'Bonus points for scoring 100 runs'),
('maiden_over', 12, 'Points for bowling a maiden over');

-- Create Admin Logs Table
CREATE TABLE IF NOT EXISTS admin_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT,
  action VARCHAR(255) NOT NULL,
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_id (admin_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- deposit, withdrawal, prize
  amount INT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
  reference_id VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50), -- info, warning, success, error
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Indexes for Performance
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_teams_created_at ON teams(created_at);
CREATE INDEX idx_matches_created_at ON matches(created_at);
CREATE INDEX idx_contests_created_at ON contests(created_at);

-- Display confirmation message
SELECT 'KEMETION Database Schema Created Successfully!' as status;
