-- =========================================
-- Talknet Forum Database Schema and Initialization
-- =========================================

-- Enable Foreign Key Constraints
PRAGMA foreign_keys = ON;

-- =========================================
-- 1. Create Tables
-- =========================================

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Posts table
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Comments table
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Post_Categories table
CREATE TABLE IF NOT EXISTS post_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Create Likes_Dislikes table
CREATE TABLE IF NOT EXISTS likes_dislikes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER,
    comment_id INTEGER,
    like_dislike BOOLEAN NOT NULL, -- TRUE for Like, FALSE for Dislike
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Create Sessions table
CREATE TABLE IF NOT EXISTS Sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================
-- 2. Insert Initial Data
-- =========================================

-- Insert Categories
INSERT OR IGNORE INTO categories (name) VALUES 
('Technology'),
('Sport'),
('Science'),
('Education'),
('Gaming'),
('TV'),
('Comedy'),
('History'),
('Social'),
('Finance'),
('News'),
('Others');

-- =========================================
-- 3. Insert a Default User
-- =========================================

-- IMPORTANT:
-- The password below is hashed using bcrypt.
-- Replace '$2a$10$XyZabcdefghijklmnopqrstuv' with the actual bcrypt hash of your desired password.

INSERT INTO users (email, username, password, first_name, last_name, age, gender) 
VALUES (
    'user1@example.com', 
    'user1', 
    '$2a$10$XyZabcdefghijklmnopqrstuv', -- Replace with a valid bcrypt hash
    'John', 
    'Doe', 
    30, 
    'Male'
);

-- =========================================
-- 4. Insert a Default Post
-- =========================================

INSERT INTO posts (user_id, title, content, updated_at) 
VALUES (
    1, 
    'Welcome to Talknet!', 
    'This is the first post on Talknet. Feel free to start discussions!', 
    CURRENT_TIMESTAMP
);

-- =========================================
-- 5. Additional Inserts (Optional)
-- =========================================

-- You can add more initial data here if needed, such as additional users, posts, comments, etc.

