-- ============================================
-- PHASE 1: SCHEMA EXTENSIONS
-- Football Network - Stades & Arbitres
-- ============================================

-- ============================================
-- 1. EXTENSION DE LA TABLE LOCATIONS (STADES/TERRAINS)
-- ============================================

ALTER TABLE locations
ADD COLUMN owner_type ENUM('public', 'private', 'club', 'partner') DEFAULT 'public' AFTER amenities,
ADD COLUMN manager_name VARCHAR(100) AFTER owner_type,
ADD COLUMN manager_phone VARCHAR(20) AFTER manager_name,
ADD COLUMN manager_email VARCHAR(100) AFTER manager_phone,
ADD COLUMN opening_hours JSON AFTER manager_email,
ADD COLUMN facilities JSON AFTER opening_hours,
ADD COLUMN field_surface ENUM('natural_grass', 'synthetic', 'hybrid', 'indoor') DEFAULT 'synthetic' AFTER field_type,
ADD COLUMN field_size VARCHAR(50) AFTER field_surface,
ADD COLUMN capacity INT AFTER field_size,
ADD COLUMN is_partner BOOLEAN DEFAULT FALSE AFTER capacity,
ADD COLUMN partner_discount DECIMAL(5,2) DEFAULT 0.00 AFTER is_partner,
ADD COLUMN partner_since DATE AFTER partner_discount,
ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.00 AFTER partner_since,
ADD COLUMN total_ratings INT DEFAULT 0 AFTER rating,
ADD COLUMN photo_id INT AFTER total_ratings,
ADD COLUMN banner_id INT AFTER photo_id,
ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER banner_id,
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER is_active,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
ADD INDEX idx_owner_type (owner_type),
ADD INDEX idx_is_partner (is_partner),
ADD INDEX idx_is_active (is_active),
ADD INDEX idx_field_surface (field_surface),
ADD FOREIGN KEY (photo_id) REFERENCES uploads(id) ON DELETE SET NULL,
ADD FOREIGN KEY (banner_id) REFERENCES uploads(id) ON DELETE SET NULL;

-- ============================================
-- 2. TABLE DES TARIFS TERRAINS (PRICING FLEXIBLE)
-- ============================================

CREATE TABLE IF NOT EXISTS venue_pricing (
  id INT PRIMARY KEY AUTO_INCREMENT,
  location_id INT NOT NULL,
  game_type ENUM('5v5', '7v7', '11v11', 'futsal', 'training', 'tournament') NOT NULL,
  duration_minutes INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  day_type ENUM('weekday', 'weekend', 'holiday') DEFAULT 'weekday',
  time_slot ENUM('morning', 'afternoon', 'evening', 'night'),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  INDEX idx_location_game_type (location_id, game_type),
  INDEX idx_location_active (location_id, is_active),
  UNIQUE KEY unique_pricing (location_id, game_type, duration_minutes, day_type, time_slot)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. TABLE DES PARTENARIATS TERRAINS
-- ============================================

CREATE TABLE IF NOT EXISTS venue_partnerships (
  id INT PRIMARY KEY AUTO_INCREMENT,
  location_id INT NOT NULL,
  partnership_type ENUM('bronze', 'silver', 'gold', 'platinum') NOT NULL,
  discount_percentage DECIMAL(5,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  terms TEXT,
  benefits JSON,
  contact_person VARCHAR(100),
  contact_email VARCHAR(100),
  contact_phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  INDEX idx_location_partnership (location_id, is_active),
  INDEX idx_partnership_type (partnership_type),
  INDEX idx_active_partnerships (is_active, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. TABLE DES RÉSERVATIONS TERRAINS
-- ============================================

CREATE TABLE IF NOT EXISTS venue_bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  location_id INT NOT NULL,
  match_id INT,
  team_id INT NOT NULL,
  booked_by INT NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INT NOT NULL,
  game_type ENUM('5v5', '7v7', '11v11', 'futsal', 'training', 'tournament') NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show') DEFAULT 'pending',
  base_price DECIMAL(10,2) NOT NULL,
  discount_applied DECIMAL(10,2) DEFAULT 0.00,
  final_price DECIMAL(10,2) NOT NULL,
  payment_status ENUM('pending', 'paid', 'refunded', 'cancelled') DEFAULT 'pending',
  payment_method VARCHAR(50),
  paid_at TIMESTAMP,
  notes TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE SET NULL,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (booked_by) REFERENCES users(id),
  INDEX idx_location_date (location_id, booking_date),
  INDEX idx_location_status (location_id, status),
  INDEX idx_team_bookings (team_id, status),
  INDEX idx_match_booking (match_id),
  INDEX idx_booking_datetime (location_id, booking_date, start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. TABLE DES AVIS SUR LES TERRAINS
-- ============================================

CREATE TABLE IF NOT EXISTS venue_ratings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  location_id INT NOT NULL,
  booking_id INT,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  field_condition_rating INT CHECK (field_condition_rating BETWEEN 1 AND 5),
  facilities_rating INT CHECK (facilities_rating BETWEEN 1 AND 5),
  service_rating INT CHECK (service_rating BETWEEN 1 AND 5),
  comment TEXT,
  photos JSON,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES venue_bookings(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_location_ratings (location_id, rating),
  INDEX idx_verified_ratings (location_id, is_verified),
  UNIQUE KEY unique_user_booking_rating (user_id, booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. TABLE DES ARBITRES
-- ============================================

CREATE TABLE IF NOT EXISTS referees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  license_number VARCHAR(50) UNIQUE,
  license_level ENUM('regional', 'national', 'international', 'trainee') DEFAULT 'regional',
  experience_years INT DEFAULT 0,
  bio TEXT,
  specializations JSON,
  languages JSON,
  location_city VARCHAR(100),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  max_travel_distance INT DEFAULT 50,
  profile_picture_id INT,
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_ratings INT DEFAULT 0,
  total_matches INT DEFAULT 0,
  hourly_rate DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'EUR',
  is_available BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (profile_picture_id) REFERENCES uploads(id) ON DELETE SET NULL,
  INDEX idx_license_level (license_level),
  INDEX idx_location (location_city, location_lat, location_lng),
  INDEX idx_availability (is_available, is_active),
  INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. TABLE DES DISPONIBILITÉS ARBITRES
-- ============================================

CREATE TABLE IF NOT EXISTS referee_availability (
  id INT PRIMARY KEY AUTO_INCREMENT,
  referee_id INT NOT NULL,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT TRUE,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referee_id) REFERENCES referees(id) ON DELETE CASCADE,
  INDEX idx_referee_date (referee_id, date),
  INDEX idx_date_availability (date, is_available),
  UNIQUE KEY unique_referee_date (referee_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. TABLE DES ASSIGNATIONS ARBITRES AUX MATCHS
-- ============================================

CREATE TABLE IF NOT EXISTS match_referee_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  referee_id INT NOT NULL,
  role ENUM('main', 'assistant_1', 'assistant_2', 'fourth_official') DEFAULT 'main',
  status ENUM('pending', 'confirmed', 'declined', 'completed', 'cancelled') DEFAULT 'pending',
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT,
  confirmed_at TIMESTAMP,
  declined_at TIMESTAMP,
  decline_reason TEXT,
  fee DECIMAL(10,2),
  payment_status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (referee_id) REFERENCES referees(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_match_referee (match_id, referee_id),
  INDEX idx_referee_status (referee_id, status),
  INDEX idx_match_status (match_id, status),
  UNIQUE KEY unique_match_referee_role (match_id, referee_id, role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. TABLE DES ÉVALUATIONS ARBITRES
-- ============================================

CREATE TABLE IF NOT EXISTS referee_ratings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  referee_id INT NOT NULL,
  match_id INT NOT NULL,
  assignment_id INT NOT NULL,
  rated_by INT NOT NULL,
  team_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  fairness_rating INT CHECK (fairness_rating BETWEEN 1 AND 5),
  communication_rating INT CHECK (communication_rating BETWEEN 1 AND 5),
  professionalism_rating INT CHECK (professionalism_rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referee_id) REFERENCES referees(id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (assignment_id) REFERENCES match_referee_assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (rated_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  INDEX idx_referee_ratings (referee_id, rating),
  INDEX idx_match_ratings (match_id),
  UNIQUE KEY unique_rating_per_team (assignment_id, team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. MODIFICATION TABLE MATCHES POUR ARBITRES
-- ============================================

ALTER TABLE matches
ADD COLUMN has_referee BOOLEAN DEFAULT FALSE AFTER referee_contact,
ADD COLUMN referee_verified BOOLEAN DEFAULT FALSE AFTER has_referee,
ADD COLUMN referee_verified_at TIMESTAMP AFTER referee_verified,
ADD COLUMN referee_notes TEXT AFTER referee_verified_at,
ADD INDEX idx_has_referee (has_referee),
ADD INDEX idx_referee_verified (referee_verified);

-- ============================================
-- 11. TABLE DES CERTIFICATS/LICENCES ARBITRES
-- ============================================

CREATE TABLE IF NOT EXISTS referee_certifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  referee_id INT NOT NULL,
  certification_name VARCHAR(100) NOT NULL,
  certification_type ENUM('license', 'training', 'specialization', 'award') NOT NULL,
  issuing_organization VARCHAR(100),
  issue_date DATE,
  expiry_date DATE,
  certificate_number VARCHAR(50),
  document_id INT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referee_id) REFERENCES referees(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES uploads(id) ON DELETE SET NULL,
  INDEX idx_referee_certifications (referee_id, is_active),
  INDEX idx_expiry_date (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 12. DONNÉES DE TEST POUR LES TARIFS
-- ============================================

-- Exemples de tarifs pour différents types de terrains
-- Ces données peuvent être supprimées en production

INSERT INTO venue_pricing (location_id, game_type, duration_minutes, price, day_type, time_slot)
SELECT
  id,
  '11v11',
  90,
  80.00,
  'weekday',
  'evening'
FROM locations
WHERE field_type = 'outdoor'
LIMIT 1;

INSERT INTO venue_pricing (location_id, game_type, duration_minutes, price, day_type, time_slot)
SELECT
  id,
  '11v11',
  90,
  100.00,
  'weekend',
  'afternoon'
FROM locations
WHERE field_type = 'outdoor'
LIMIT 1;

INSERT INTO venue_pricing (location_id, game_type, duration_minutes, price, day_type, time_slot)
SELECT
  id,
  '7v7',
  60,
  50.00,
  'weekday',
  'evening'
FROM locations
WHERE field_type = 'outdoor'
LIMIT 1;

-- ============================================
-- FIN DE LA MIGRATION PHASE 1
-- ============================================
