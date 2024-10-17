CREATE TABLE IF NOT EXISTS Users (
    id TEXT PRIMARY KEY,  -- UUID
    nickname TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Password hashed with bcrypt
    first_name TEXT,
    last_name TEXT,
    gender TEXT,
    age INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Posts (
    post_id TEXT PRIMARY KEY,  -- UUID
    user_id TEXT NOT NULL,  -- Foreign Key (reference to Users table)
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Comments (
    comment_id TEXT PRIMARY KEY,  -- UUID
    post_id TEXT NOT NULL,  -- Foreign Key (reference to Posts table)
    user_id TEXT NOT NULL,  -- Foreign Key (reference to Users table)
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES Posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Messages (
    message_id TEXT PRIMARY KEY,  -- UUID
    sender_id TEXT NOT NULL,  -- Foreign Key (reference to Users table)
    receiver_id TEXT NOT NULL,  -- Foreign Key (reference to Users table)
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS UserStatus (
    user_id TEXT PRIMARY KEY,  -- Foreign Key (reference to Users table)
    is_online BOOLEAN NOT NULL,
    last_active TIMESTAMP
);
