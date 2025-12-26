-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'flagged', 'blocked')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- OTP tokens table
CREATE TABLE IF NOT EXISTS otp_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User entries table
CREATE TABLE IF NOT EXISTS user_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT,
  job_title TEXT,
  company_size TEXT,
  budget TEXT,
  enrichment_status TEXT NOT NULL DEFAULT 'pending' CHECK(enrichment_status IN ('pending', 'queued', 'enriched')),
  enriched_at DATETIME,
  enrichment_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User enrichments table (for Clay.com data)
CREATE TABLE IF NOT EXISTS user_enrichments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  clay_data TEXT NOT NULL,
  enriched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_otp_tokens_user_id ON otp_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_tokens_code ON otp_tokens(code);
CREATE INDEX IF NOT EXISTS idx_user_entries_user_id ON user_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_enrichments_user_id ON user_enrichments(user_id);

