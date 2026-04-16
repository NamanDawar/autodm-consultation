-- Creators (your users)
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  page_slug VARCHAR(100) UNIQUE NOT NULL,
  bio TEXT,
  photo_url TEXT,
  category VARCHAR(100),
  razorpay_account_id VARCHAR(255),
  google_refresh_token TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Services (consultation offerings)
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  video_platform VARCHAR(50) DEFAULT 'google_meet',
  max_per_day INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Availability (working hours)
CREATE TABLE IF NOT EXISTS availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sun, 1=Mon ... 6=Sat
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id),
  creator_id UUID REFERENCES creators(id),
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(20),
  slot_start TIMESTAMP NOT NULL,
  slot_end TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  meet_link TEXT,
  payment_id VARCHAR(255),
  razorpay_order_id VARCHAR(255),
  amount INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  amount INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- INSTAGRAM DM AUTOMATION TABLES
-- ─────────────────────────────────────────────────────────────

-- Connected Instagram Business Accounts
CREATE TABLE IF NOT EXISTS instagram_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  ig_user_id VARCHAR(255) NOT NULL,          -- Instagram User ID
  ig_username VARCHAR(255),
  ig_name VARCHAR(255),
  ig_profile_pic TEXT,
  ig_followers INTEGER DEFAULT 0,
  access_token TEXT NOT NULL,                -- Long-lived page access token
  token_expires_at TIMESTAMP,
  page_id VARCHAR(255),                      -- Facebook Page ID linked to IG
  page_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  connected_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(creator_id, ig_user_id)
);

-- DM Automation Rules (keyword triggers)
CREATE TABLE IF NOT EXISTS dm_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  ig_account_id UUID REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(50) NOT NULL DEFAULT 'dm_keyword',
  -- 'dm_keyword'      → triggers when a DM matches keywords
  -- 'comment_keyword' → triggers when a comment matches keywords (sends DM)
  -- 'first_dm'        → triggers on the very first DM from a new user
  -- 'story_reply'     → triggers when someone replies to a story
  keywords TEXT[] DEFAULT '{}',             -- e.g. ['book','booking','consult']
  match_type VARCHAR(20) DEFAULT 'contains',-- 'exact' | 'contains' | 'starts_with'
  response_message TEXT NOT NULL,
  include_booking_link BOOLEAN DEFAULT false,
  delay_seconds INTEGER DEFAULT 0,           -- optional send delay
  is_active BOOLEAN DEFAULT true,
  total_triggered INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- DM Subscribers (everyone who ever interacted via DM)
CREATE TABLE IF NOT EXISTS dm_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  ig_account_id UUID REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  ig_user_id VARCHAR(255) NOT NULL,
  username VARCHAR(255),
  name VARCHAR(255),
  profile_pic TEXT,
  tags TEXT[] DEFAULT '{}',
  subscribed_at TIMESTAMP DEFAULT NOW(),
  last_interaction TIMESTAMP DEFAULT NOW(),
  UNIQUE(ig_account_id, ig_user_id)
);

-- DM Message Log
CREATE TABLE IF NOT EXISTS dm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  ig_account_id UUID REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES dm_subscribers(id) ON DELETE SET NULL,
  ig_message_id VARCHAR(255),
  direction VARCHAR(10) NOT NULL,            -- 'inbound' | 'outbound'
  message_text TEXT,
  automation_id UUID REFERENCES dm_automations(id) ON DELETE SET NULL,
  sent_at TIMESTAMP DEFAULT NOW()
);
