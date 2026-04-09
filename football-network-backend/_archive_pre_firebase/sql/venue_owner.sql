-- ============================================
-- VENUE OWNER - Gestion des propriétaires de terrains
-- ============================================

-- Ajouter le type venue_owner aux utilisateurs
ALTER TABLE users
MODIFY COLUMN user_type ENUM('player', 'manager', 'superadmin', 'venue_owner') DEFAULT 'player';

-- Ajouter une relation propriétaire → terrain (un propriétaire peut gérer plusieurs terrains)
ALTER TABLE locations
ADD COLUMN owner_id INT AFTER address,
ADD COLUMN is_managed BOOLEAN DEFAULT FALSE COMMENT 'Si le terrain est géré via la plateforme',
ADD FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
ADD INDEX idx_owner (owner_id);

-- Table de disponibilité des terrains (horaires d'ouverture)
CREATE TABLE IF NOT EXISTS venue_availability (
  id INT PRIMARY KEY AUTO_INCREMENT,
  venue_id INT NOT NULL,
  day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
  opening_time TIME NOT NULL,
  closing_time TIME NOT NULL,
  is_closed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (venue_id) REFERENCES locations(id) ON DELETE CASCADE,
  INDEX idx_venue_day (venue_id, day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table de fermetures exceptionnelles
CREATE TABLE IF NOT EXISTS venue_closures (
  id INT PRIMARY KEY AUTO_INCREMENT,
  venue_id INT NOT NULL,
  closure_date DATE NOT NULL,
  closure_reason VARCHAR(255),
  is_full_day BOOLEAN DEFAULT TRUE,
  start_time TIME NULL DEFAULT NULL,
  end_time TIME NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (venue_id) REFERENCES locations(id) ON DELETE CASCADE,
  INDEX idx_venue_date (venue_id, closure_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Amélioration de la table venue_bookings
ALTER TABLE venue_bookings
ADD COLUMN owner_response_message TEXT AFTER status,
ADD COLUMN owner_responded_at TIMESTAMP NULL DEFAULT NULL AFTER owner_response_message,
ADD COLUMN counter_proposal_date TIMESTAMP NULL DEFAULT NULL AFTER owner_responded_at,
ADD COLUMN counter_proposal_duration INT NULL DEFAULT NULL AFTER counter_proposal_date,
ADD COLUMN payment_status ENUM('pending', 'paid', 'refunded', 'failed') DEFAULT 'pending' AFTER counter_proposal_duration,
ADD COLUMN payment_amount DECIMAL(10, 2) DEFAULT 0.00 AFTER payment_status,
ADD INDEX idx_owner_status (status),
ADD INDEX idx_payment_status (payment_status);

-- Table de notifications pour les propriétaires
CREATE TABLE IF NOT EXISTS venue_owner_notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  owner_id INT NOT NULL,
  venue_id INT NOT NULL,
  booking_id INT,
  notification_type ENUM('new_booking', 'booking_cancelled', 'payment_received', 'review_posted') NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (venue_id) REFERENCES locations(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES venue_bookings(id) ON DELETE CASCADE,
  INDEX idx_owner_unread (owner_id, is_read),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table de revenus des propriétaires (pour statistiques)
CREATE TABLE IF NOT EXISTS venue_revenue_tracking (
  id INT PRIMARY KEY AUTO_INCREMENT,
  venue_id INT NOT NULL,
  booking_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) DEFAULT 0.00,
  net_amount DECIMAL(10, 2) NOT NULL,
  revenue_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (venue_id) REFERENCES locations(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES venue_bookings(id) ON DELETE CASCADE,
  INDEX idx_venue_date (venue_id, revenue_date),
  INDEX idx_revenue_date (revenue_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
