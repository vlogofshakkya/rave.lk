-- Rave.LK — schema
-- Safe to re-run: every statement is CREATE TABLE IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS admins (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('owner','admin') NOT NULL DEFAULT 'admin',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS events (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  slug           VARCHAR(190) NOT NULL UNIQUE,
  title          VARCHAR(200) NOT NULL,
  tagline        VARCHAR(255) NULL,
  description    TEXT NULL,
  venue          VARCHAR(200) NULL,
  city           VARCHAR(120) NULL,
  starts_at      DATETIME NOT NULL,
  ends_at        DATETIME NULL,
  poster_url     VARCHAR(500) NULL,
  hero_url       VARCHAR(500) NULL,
  lineup         TEXT NULL,             -- JSON array of artist names
  status         ENUM('draft','upcoming','past','cancelled') NOT NULL DEFAULT 'upcoming',
  featured       TINYINT(1) NOT NULL DEFAULT 0,
  tickets_open   TINYINT(1) NOT NULL DEFAULT 1,
  external_url   VARCHAR(500) NULL,
  recap_video    VARCHAR(500) NULL,
  attendance     INT NULL,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_events_status_start (status, starts_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_tiers (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  event_id    INT NOT NULL,
  name        VARCHAR(120) NOT NULL,
  price       DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency    VARCHAR(8) NOT NULL DEFAULT 'LKR',
  perks       TEXT NULL,
  quantity    INT NULL,                 -- NULL = unlimited
  sold        INT NOT NULL DEFAULT 0,
  sort_order  INT NOT NULL DEFAULT 0,
  active      TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_tier_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  INDEX idx_tier_event (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bookings (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  reference      VARCHAR(24) NOT NULL UNIQUE,
  event_id       INT NOT NULL,
  tier_id        INT NULL,
  customer_name  VARCHAR(160) NOT NULL,
  email          VARCHAR(190) NOT NULL,
  phone          VARCHAR(40) NOT NULL,
  quantity       INT NOT NULL DEFAULT 1,
  unit_price     DECIMAL(10,2) NOT NULL DEFAULT 0,
  total          DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency       VARCHAR(8) NOT NULL DEFAULT 'LKR',
  status         ENUM('pending','confirmed','cancelled','refunded') NOT NULL DEFAULT 'pending',
  payment_status ENUM('unpaid','paid','failed','refunded') NOT NULL DEFAULT 'unpaid',
  payment_method VARCHAR(40) NULL,
  payment_ref    VARCHAR(190) NULL,
  notes          TEXT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_booking_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_booking_tier FOREIGN KEY (tier_id) REFERENCES ticket_tiers(id) ON DELETE SET NULL,
  INDEX idx_booking_event (event_id),
  INDEX idx_booking_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gallery (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  event_id    INT NULL,
  title       VARCHAR(200) NULL,
  image_url   VARCHAR(500) NOT NULL,
  public_id   VARCHAR(255) NULL,        -- Cloudinary public_id, for deletes
  width       INT NULL,
  height      INT NULL,
  category    VARCHAR(80) NULL,
  featured    TINYINT(1) NOT NULL DEFAULT 0,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_gallery_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
  INDEX idx_gallery_event (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  `key`      VARCHAR(120) PRIMARY KEY,
  value      TEXT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(160) NOT NULL,
  email      VARCHAR(190) NOT NULL,
  topic      VARCHAR(80) NULL,
  message    TEXT NOT NULL,
  handled    TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_messages_handled (handled, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscribers (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(190) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
