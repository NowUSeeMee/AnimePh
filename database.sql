-- Create database
CREATE DATABASE IF NOT EXISTS animeph;
USE animeph;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cache table for Anime metadata
CREATE TABLE IF NOT EXISTS anime (
    mal_id INT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    title_english VARCHAR(255),
    image_url TEXT,
    synopsis TEXT,
    type VARCHAR(20),
    score DECIMAL(3,2),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cache table for Episodes
CREATE TABLE IF NOT EXISTS episodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    anime_id INT NOT NULL,
    episode_number INT NOT NULL,
    title VARCHAR(255),
    link TEXT,
    data_id VARCHAR(100), -- Internal Aniwatch ID for server fetching
    FOREIGN KEY (anime_id) REFERENCES anime(mal_id) ON DELETE CASCADE,
    UNIQUE KEY anime_ep_unique (anime_id, episode_number)
);

-- Favorites table (renamed from previous for clarity)
CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    anime_id INT NOT NULL,
    status ENUM('watching', 'completed', 'plan_to_watch', 'dropped') DEFAULT 'plan_to_watch',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (anime_id) REFERENCES anime(mal_id) ON DELETE CASCADE,
    UNIQUE KEY user_anime_unique (user_id, anime_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    anime_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (anime_id) REFERENCES anime(mal_id) ON DELETE CASCADE
);

-- Watch History table
CREATE TABLE IF NOT EXISTS watch_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    anime_id INT NOT NULL,
    episode_number INT,
    watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (anime_id) REFERENCES anime(mal_id) ON DELETE CASCADE
);

-- Optimization Indexes
CREATE INDEX idx_anime_title ON anime(title);
CREATE INDEX idx_episodes_anime_id ON episodes(anime_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_history_user_id ON watch_history(user_id);

-- Insert demo user
INSERT IGNORE INTO users (id, username) VALUES (1, 'demo_user');
