-- Football Network MySQL Schema Dump

-- Table: admin_logs
CREATE TABLE `admin_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `action_type` varchar(50) NOT NULL,
  `target_type` varchar(50) DEFAULT NULL,
  `target_id` int(11) DEFAULT NULL,
  `action_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`action_details`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_admin_action` (`admin_id`,`action_type`),
  KEY `idx_target` (`target_type`,`target_id`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `admin_logs_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: bans
CREATE TABLE `bans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `team_id` int(11) DEFAULT NULL,
  `ban_type` enum('warning','temporary','permanent') NOT NULL,
  `reason` text NOT NULL,
  `banned_by` int(11) NOT NULL,
  `starts_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ends_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `banned_by` (`banned_by`),
  KEY `idx_user_active` (`user_id`,`is_active`),
  KEY `idx_team_active` (`team_id`,`is_active`),
  KEY `idx_type` (`ban_type`),
  CONSTRAINT `bans_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bans_ibfk_2` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bans_ibfk_3` FOREIGN KEY (`banned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: feed_comments
CREATE TABLE `feed_comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `parent_comment_id` int(11) DEFAULT NULL,
  `content` text NOT NULL,
  `likes_count` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `parent_comment_id` (`parent_comment_id`),
  KEY `idx_post_comments` (`post_id`,`created_at`),
  KEY `idx_user_comments` (`user_id`),
  CONSTRAINT `feed_comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `feed_posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `feed_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `feed_comments_ibfk_3` FOREIGN KEY (`parent_comment_id`) REFERENCES `feed_comments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: feed_hashtags
CREATE TABLE `feed_hashtags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tag` varchar(100) NOT NULL,
  `usage_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `tag` (`tag`),
  KEY `idx_tag` (`tag`),
  KEY `idx_usage` (`usage_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: feed_likes
CREATE TABLE `feed_likes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_like` (`post_id`,`user_id`),
  KEY `idx_user_likes` (`user_id`),
  CONSTRAINT `feed_likes_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `feed_posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `feed_likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: feed_post_hashtags
CREATE TABLE `feed_post_hashtags` (
  `post_id` int(11) NOT NULL,
  `hashtag_id` int(11) NOT NULL,
  PRIMARY KEY (`post_id`,`hashtag_id`),
  KEY `hashtag_id` (`hashtag_id`),
  CONSTRAINT `feed_post_hashtags_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `feed_posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `feed_post_hashtags_ibfk_2` FOREIGN KEY (`hashtag_id`) REFERENCES `feed_hashtags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: feed_post_views
CREATE TABLE `feed_post_views` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `viewed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_post_views` (`post_id`,`viewed_at`),
  CONSTRAINT `feed_post_views_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `feed_posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `feed_post_views_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: feed_posts
CREATE TABLE `feed_posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `post_type` enum('match_announcement','match_result','recruitment','team_search','player_search','media','general') NOT NULL DEFAULT 'general',
  `content` text NOT NULL,
  `match_id` int(11) DEFAULT NULL,
  `team_id` int(11) DEFAULT NULL,
  `media_url` varchar(500) DEFAULT NULL,
  `media_type` enum('image','video') DEFAULT NULL,
  `visibility` enum('public','friends','private') DEFAULT 'public',
  `location_city` varchar(100) DEFAULT NULL,
  `location_lat` decimal(10,8) DEFAULT NULL,
  `location_lng` decimal(11,8) DEFAULT NULL,
  `likes_count` int(11) DEFAULT 0,
  `comments_count` int(11) DEFAULT 0,
  `shares_count` int(11) DEFAULT 0,
  `views_count` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `is_pinned` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `recruitment_position` varchar(50) DEFAULT NULL,
  `recruitment_skill_level` varchar(50) DEFAULT NULL,
  `recruitment_description` text DEFAULT NULL,
  `match_opponent` varchar(255) DEFAULT NULL,
  `match_score_home` int(11) DEFAULT NULL,
  `match_score_away` int(11) DEFAULT NULL,
  `match_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `match_id` (`match_id`),
  KEY `team_id` (`team_id`),
  KEY `idx_post_type` (`post_type`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_location` (`location_city`),
  KEY `idx_visibility` (`visibility`),
  KEY `idx_active` (`is_active`),
  KEY `idx_feed_timeline` (`is_active`,`visibility`,`created_at`),
  KEY `idx_feed_location` (`location_city`,`is_active`,`created_at`),
  KEY `idx_feed_personalized` (`post_type`,`is_active`,`created_at`),
  CONSTRAINT `feed_posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `feed_posts_ibfk_2` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `feed_posts_ibfk_3` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: feed_reports
CREATE TABLE `feed_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) DEFAULT NULL,
  `comment_id` int(11) DEFAULT NULL,
  `reported_by` int(11) NOT NULL,
  `reason` enum('spam','harassment','inappropriate','false_info','other') NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','reviewed','resolved','dismissed') DEFAULT 'pending',
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `post_id` (`post_id`),
  KEY `comment_id` (`comment_id`),
  KEY `reviewed_by` (`reviewed_by`),
  KEY `idx_status` (`status`),
  KEY `idx_reporter` (`reported_by`),
  CONSTRAINT `feed_reports_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `feed_posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `feed_reports_ibfk_2` FOREIGN KEY (`comment_id`) REFERENCES `feed_comments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `feed_reports_ibfk_3` FOREIGN KEY (`reported_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `feed_reports_ibfk_4` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: feed_shares
CREATE TABLE `feed_shares` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `shared_to` enum('feed','team','direct') DEFAULT 'feed',
  `message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_shares` (`user_id`),
  KEY `idx_post_shares` (`post_id`),
  CONSTRAINT `feed_shares_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `feed_posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `feed_shares_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: location_availability
CREATE TABLE `location_availability` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `location_id` int(11) NOT NULL,
  `day_of_week` tinyint(4) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_location_day` (`location_id`,`day_of_week`),
  CONSTRAINT `location_availability_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: location_photos
CREATE TABLE `location_photos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `location_id` int(11) NOT NULL,
  `upload_id` int(11) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_location` (`location_id`),
  KEY `upload_id` (`upload_id`),
  CONSTRAINT `location_photos_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `location_photos_ibfk_2` FOREIGN KEY (`upload_id`) REFERENCES `uploads` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: locations
CREATE TABLE `locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `address` text NOT NULL,
  `owner_id` int(11) DEFAULT NULL,
  `city` varchar(100) NOT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `field_type` enum('grass','synthetic','indoor','sand') DEFAULT 'grass',
  `field_surface` enum('natural_grass','synthetic','hybrid','indoor') DEFAULT 'synthetic',
  `field_size` varchar(50) DEFAULT NULL,
  `capacity` int(11) DEFAULT NULL,
  `is_partner` tinyint(1) DEFAULT 0,
  `partner_discount` decimal(5,2) DEFAULT 0.00,
  `partner_since` date DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT 0.00,
  `total_ratings` int(11) DEFAULT 0,
  `photo_id` int(11) DEFAULT NULL,
  `banner_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `price_per_hour` decimal(8,2) DEFAULT NULL,
  `amenities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`amenities`)),
  `owner_type` enum('public','private','club','partner') DEFAULT 'public',
  `manager_name` varchar(100) DEFAULT NULL,
  `manager_phone` varchar(20) DEFAULT NULL,
  `manager_email` varchar(100) DEFAULT NULL,
  `opening_hours` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`opening_hours`)),
  `facilities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`facilities`)),
  `owner_contact` varchar(255) DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `main_photo_id` int(11) DEFAULT NULL,
  `is_managed` tinyint(1) DEFAULT 0 COMMENT 'Si le terrain est géré via la plateforme',
  PRIMARY KEY (`id`),
  KEY `idx_location` (`latitude`,`longitude`),
  KEY `idx_city` (`city`),
  KEY `main_photo_id` (`main_photo_id`),
  KEY `idx_owner_type` (`owner_type`),
  KEY `idx_is_partner` (`is_partner`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_field_surface` (`field_surface`),
  KEY `photo_id` (`photo_id`),
  KEY `banner_id` (`banner_id`),
  KEY `idx_owner` (`owner_id`),
  CONSTRAINT `locations_ibfk_1` FOREIGN KEY (`main_photo_id`) REFERENCES `uploads` (`id`) ON DELETE SET NULL,
  CONSTRAINT `locations_ibfk_2` FOREIGN KEY (`photo_id`) REFERENCES `uploads` (`id`) ON DELETE SET NULL,
  CONSTRAINT `locations_ibfk_3` FOREIGN KEY (`banner_id`) REFERENCES `uploads` (`id`) ON DELETE SET NULL,
  CONSTRAINT `locations_ibfk_4` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: match_disputes
CREATE TABLE `match_disputes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `match_id` int(11) NOT NULL,
  `opened_by` int(11) NOT NULL,
  `opened_by_role` enum('home_captain','away_captain') NOT NULL,
  `reason` text NOT NULL,
  `proposed_home_score` int(11) DEFAULT NULL,
  `proposed_away_score` int(11) DEFAULT NULL,
  `status` enum('open','resolved','closed') DEFAULT 'open',
  `resolution_notes` text DEFAULT NULL,
  `resolved_by` int(11) DEFAULT NULL COMMENT 'Admin ou arbitre',
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `opened_by` (`opened_by`),
  KEY `resolved_by` (`resolved_by`),
  KEY `idx_match_disputes` (`match_id`),
  KEY `idx_dispute_status` (`status`),
  CONSTRAINT `match_disputes_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `match_disputes_ibfk_2` FOREIGN KEY (`opened_by`) REFERENCES `users` (`id`),
  CONSTRAINT `match_disputes_ibfk_3` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: match_goals
CREATE TABLE `match_goals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `match_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `scorer_id` int(11) DEFAULT NULL COMMENT 'Joueur qui a marqué',
  `assister_id` int(11) DEFAULT NULL COMMENT 'Joueur qui a fait la passe décisive',
  `minute_scored` int(11) NOT NULL,
  `goal_type` enum('regular','penalty','own_goal','free_kick','header') DEFAULT 'regular',
  `notes` text DEFAULT NULL,
  `recorded_by` int(11) DEFAULT NULL COMMENT 'Arbitre ou manager qui a enregistré',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_match_goals` (`match_id`),
  KEY `idx_scorer` (`scorer_id`),
  KEY `team_id` (`team_id`),
  KEY `assister_id` (`assister_id`),
  KEY `recorded_by` (`recorded_by`),
  CONSTRAINT `match_goals_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `match_goals_ibfk_2` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `match_goals_ibfk_3` FOREIGN KEY (`scorer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `match_goals_ibfk_4` FOREIGN KEY (`assister_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `match_goals_ibfk_5` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: match_incidents
CREATE TABLE `match_incidents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `match_id` int(11) NOT NULL,
  `referee_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `player_id` int(11) DEFAULT NULL,
  `incident_type` enum('yellow_card','red_card','injury','misconduct','other') NOT NULL,
  `description` text NOT NULL,
  `minute_occurred` int(11) DEFAULT NULL COMMENT 'Minute du match où l''incident s''est produit',
  `reported_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `team_id` (`team_id`),
  KEY `player_id` (`player_id`),
  KEY `idx_match_incidents` (`match_id`),
  KEY `idx_referee_incidents` (`referee_id`),
  KEY `idx_incident_type` (`incident_type`),
  KEY `idx_reported_at` (`reported_at`),
  CONSTRAINT `match_incidents_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `match_incidents_ibfk_2` FOREIGN KEY (`referee_id`) REFERENCES `referees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `match_incidents_ibfk_3` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `match_incidents_ibfk_4` FOREIGN KEY (`player_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: match_invitations
CREATE TABLE `match_invitations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_team_id` int(11) NOT NULL,
  `receiver_team_id` int(11) NOT NULL,
  `match_id` int(11) DEFAULT NULL,
  `proposed_date` datetime NOT NULL,
  `proposed_location_id` int(11) DEFAULT NULL,
  `venue_id` int(11) DEFAULT NULL,
  `requires_referee` tinyint(1) DEFAULT 0,
  `preferred_referee_id` int(11) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `status` enum('pending','accepted','declined','expired') DEFAULT 'pending',
  `response_message` text DEFAULT NULL,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `responded_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `verify_player_availability` tinyint(1) DEFAULT 0 COMMENT 'Si true, validation des 6 joueurs minimum requise avant création invitation',
  PRIMARY KEY (`id`),
  KEY `sender_team_id` (`sender_team_id`),
  KEY `match_id` (`match_id`),
  KEY `proposed_location_id` (`proposed_location_id`),
  KEY `idx_receiver_status` (`receiver_team_id`,`status`),
  KEY `idx_expires` (`expires_at`),
  KEY `idx_venue_id` (`venue_id`),
  KEY `idx_referee_id` (`preferred_referee_id`),
  KEY `idx_match_invitations_verify_availability` (`verify_player_availability`),
  CONSTRAINT `match_invitations_ibfk_1` FOREIGN KEY (`sender_team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `match_invitations_ibfk_2` FOREIGN KEY (`receiver_team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `match_invitations_ibfk_3` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `match_invitations_ibfk_4` FOREIGN KEY (`proposed_location_id`) REFERENCES `locations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `match_invitations_ibfk_5` FOREIGN KEY (`venue_id`) REFERENCES `locations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `match_invitations_ibfk_6` FOREIGN KEY (`preferred_referee_id`) REFERENCES `referees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Invitations de match avec option de vérification disponibilité joueurs';

-- Table: match_participations
CREATE TABLE `match_participations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `match_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `status` enum('pending','confirmed','declined','maybe') DEFAULT 'pending',
  `response_note` text DEFAULT NULL,
  `responded_at` timestamp NULL DEFAULT NULL,
  `notified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_participation` (`match_id`,`user_id`),
  KEY `idx_match` (`match_id`),
  KEY `idx_team` (`team_id`),
  KEY `idx_status` (`status`),
  KEY `idx_user_pending` (`user_id`,`status`),
  CONSTRAINT `match_participations_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `match_participations_ibfk_2` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `match_participations_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=111 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: match_photos
CREATE TABLE `match_photos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `match_id` int(11) NOT NULL,
  `upload_id` int(11) NOT NULL,
  `caption` text DEFAULT NULL,
  `uploaded_by` int(11) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_match` (`match_id`),
  KEY `idx_upload` (`upload_id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `match_photos_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `match_photos_ibfk_2` FOREIGN KEY (`upload_id`) REFERENCES `uploads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `match_photos_ibfk_3` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: match_referee_assignments
CREATE TABLE `match_referee_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `match_id` int(11) NOT NULL,
  `referee_id` int(11) NOT NULL,
  `role` enum('main','assistant_1','assistant_2','fourth_official') DEFAULT 'main',
  `status` enum('pending','confirmed','declined','completed','cancelled') DEFAULT 'pending',
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `assigned_by` int(11) DEFAULT NULL,
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `declined_at` timestamp NULL DEFAULT NULL,
  `decline_reason` text DEFAULT NULL,
  `fee` decimal(10,2) DEFAULT NULL,
  `payment_status` enum('pending','paid','cancelled') DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_match_referee_role` (`match_id`,`referee_id`,`role`),
  KEY `assigned_by` (`assigned_by`),
  KEY `idx_match_referee` (`match_id`,`referee_id`),
  KEY `idx_referee_status` (`referee_id`,`status`),
  KEY `idx_match_status` (`match_id`,`status`),
  CONSTRAINT `match_referee_assignments_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `match_referee_assignments_ibfk_2` FOREIGN KEY (`referee_id`) REFERENCES `referees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `match_referee_assignments_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: match_reports
CREATE TABLE `match_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `match_id` int(11) NOT NULL,
  `referee_id` int(11) NOT NULL,
  `home_score` int(11) NOT NULL DEFAULT 0,
  `away_score` int(11) NOT NULL DEFAULT 0,
  `match_summary` text DEFAULT NULL,
  `weather_conditions` varchar(50) DEFAULT NULL,
  `pitch_conditions` varchar(50) DEFAULT NULL,
  `status` enum('draft','submitted','validated') DEFAULT 'draft',
  `submitted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_match_report` (`match_id`),
  KEY `referee_id` (`referee_id`),
  CONSTRAINT `match_reports_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `match_reports_ibfk_2` FOREIGN KEY (`referee_id`) REFERENCES `referees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: match_statistics
CREATE TABLE `match_statistics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `match_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `goals_scored` int(11) DEFAULT 0,
  `goals_conceded` int(11) DEFAULT 0,
  `result` enum('win','draw','loss') NOT NULL,
  `clean_sheet` tinyint(1) DEFAULT 0,
  `calculated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_match_team` (`match_id`,`team_id`),
  KEY `idx_team_stats` (`team_id`),
  KEY `idx_result` (`result`),
  CONSTRAINT `match_statistics_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `match_statistics_ibfk_2` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: match_validation_history
CREATE TABLE `match_validation_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `match_id` int(11) NOT NULL,
  `validation_type` enum('auto_check','manual_override','pre_match_validation') NOT NULL,
  `home_team_confirmed` int(11) NOT NULL COMMENT 'Nombre de joueurs confirmés équipe domicile',
  `away_team_confirmed` int(11) NOT NULL COMMENT 'Nombre de joueurs confirmés équipe extérieure',
  `is_valid` tinyint(1) NOT NULL,
  `validation_status` enum('validated','warning','critical') NOT NULL,
  `notes` text DEFAULT NULL,
  `checked_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_match` (`match_id`),
  KEY `idx_status` (`validation_status`),
  CONSTRAINT `match_validation_history_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: match_validations
CREATE TABLE `match_validations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `match_id` int(11) NOT NULL,
  `validator_id` int(11) NOT NULL,
  `validator_role` enum('home_captain','away_captain','referee') NOT NULL,
  `validation_type` enum('score','stats','dispute_resolution') NOT NULL,
  `home_score` int(11) DEFAULT NULL,
  `away_score` int(11) DEFAULT NULL,
  `validated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('approved','contested') DEFAULT 'approved',
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_match_validations` (`match_id`),
  KEY `idx_validator` (`validator_id`),
  CONSTRAINT `match_validations_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `match_validations_ibfk_2` FOREIGN KEY (`validator_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: matches
CREATE TABLE `matches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `home_team_id` int(11) NOT NULL,
  `away_team_id` int(11) DEFAULT NULL,
  `location_id` int(11) DEFAULT NULL,
  `venue_booking_id` int(11) DEFAULT NULL,
  `venue_confirmed` tinyint(1) DEFAULT 0,
  `participation_validated` tinyint(1) DEFAULT 0,
  `last_validation_check` timestamp NULL DEFAULT NULL,
  `validation_warnings` int(11) DEFAULT 0,
  `match_date` datetime NOT NULL,
  `duration_minutes` int(11) DEFAULT 90,
  `match_type` enum('friendly','tournament','league') DEFAULT 'friendly',
  `status` enum('pending','confirmed','cancelled','completed') DEFAULT 'pending',
  `home_score` int(11) DEFAULT 0,
  `away_score` int(11) DEFAULT 0,
  `referee_contact` varchar(255) DEFAULT NULL,
  `has_referee` tinyint(1) DEFAULT 0,
  `referee_verified` tinyint(1) DEFAULT 0,
  `referee_verified_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `referee_notes` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `home_captain_validated` tinyint(1) DEFAULT 0 COMMENT 'Le capitaine domicile a validé le score',
  `away_captain_validated` tinyint(1) DEFAULT 0 COMMENT 'Le capitaine extérieur a validé le score',
  `home_captain_validated_at` timestamp NULL DEFAULT NULL,
  `away_captain_validated_at` timestamp NULL DEFAULT NULL,
  `is_disputed` tinyint(1) DEFAULT 0 COMMENT 'Match contesté par un capitaine',
  `dispute_reason` text DEFAULT NULL,
  `dispute_opened_at` timestamp NULL DEFAULT NULL,
  `dispute_opened_by` int(11) DEFAULT NULL,
  `referee_id` int(11) DEFAULT NULL COMMENT 'ID de l arbitre (futur)',
  `is_referee_verified` tinyint(1) DEFAULT 0,
  `started_at` timestamp NULL DEFAULT NULL COMMENT 'Horodatage du démarrage automatique/manuel du match',
  `completed_at` timestamp NULL DEFAULT NULL COMMENT 'Horodatage de la fin automatique/manuelle du match',
  `started_by_referee` tinyint(1) DEFAULT 0 COMMENT 'Match démarré par l''arbitre',
  `referee_validation_notes` text DEFAULT NULL COMMENT 'Notes de validation de l''arbitre',
  `referee_validated_at` timestamp NULL DEFAULT NULL COMMENT 'Date de validation par l''arbitre',
  `referee_validated_by` int(11) DEFAULT NULL COMMENT 'ID de l''arbitre qui a validé',
  PRIMARY KEY (`id`),
  KEY `home_team_id` (`home_team_id`),
  KEY `away_team_id` (`away_team_id`),
  KEY `location_id` (`location_id`),
  KEY `idx_match_date` (`match_date`),
  KEY `idx_status` (`status`),
  KEY `fk_match_dispute_user` (`dispute_opened_by`),
  KEY `fk_match_referee` (`referee_id`),
  KEY `idx_match_validation_status` (`home_captain_validated`,`away_captain_validated`),
  KEY `idx_has_referee` (`has_referee`),
  KEY `idx_referee_verified` (`referee_verified`),
  KEY `idx_venue_booking` (`venue_booking_id`),
  KEY `idx_status_match_date` (`status`,`match_date`),
  KEY `idx_started_at` (`started_at`),
  KEY `idx_completed_at` (`completed_at`),
  KEY `idx_referee_validated_at` (`referee_validated_at`),
  CONSTRAINT `fk_match_dispute_user` FOREIGN KEY (`dispute_opened_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_match_referee` FOREIGN KEY (`referee_id`) REFERENCES `users` (`id`),
  CONSTRAINT `matches_ibfk_1` FOREIGN KEY (`home_team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `matches_ibfk_2` FOREIGN KEY (`away_team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `matches_ibfk_3` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `matches_ibfk_4` FOREIGN KEY (`venue_booking_id`) REFERENCES `venue_bookings` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: matches_pending_validation
undefined;

-- Table: message_attachments
CREATE TABLE `message_attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message_id` int(11) NOT NULL,
  `upload_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_message` (`message_id`),
  KEY `idx_upload` (`upload_id`),
  CONSTRAINT `message_attachments_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `message_attachments_ibfk_2` FOREIGN KEY (`upload_id`) REFERENCES `uploads` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: messages
CREATE TABLE `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `match_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `message_type` enum('text','system','image') DEFAULT 'text',
  `is_read` tinyint(1) DEFAULT 0,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `sender_id` (`sender_id`),
  KEY `idx_match_date` (`match_id`,`sent_at`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: notifications
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `type` enum('match_invitation','match_confirmation','match_reminder','team_invitation','rating','general') NOT NULL,
  `related_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_read` (`user_id`,`is_read`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: password_reset_tokens
CREATE TABLE `password_reset_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_token` (`token`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: player_card_statistics
CREATE TABLE `player_card_statistics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `player_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `season` varchar(20) DEFAULT '2024-2025',
  `yellow_cards` int(11) DEFAULT 0,
  `red_cards` int(11) DEFAULT 0,
  `total_matches_played` int(11) DEFAULT 0,
  `last_card_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_player_team_season` (`player_id`,`team_id`,`season`),
  KEY `idx_player_cards` (`player_id`),
  KEY `idx_team_cards` (`team_id`),
  KEY `idx_season` (`season`),
  CONSTRAINT `player_card_statistics_ibfk_1` FOREIGN KEY (`player_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `player_card_statistics_ibfk_2` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: player_invitations
CREATE TABLE `player_invitations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `team_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `invited_email` varchar(100) DEFAULT NULL,
  `invited_name` varchar(100) DEFAULT NULL,
  `invited_by` int(11) NOT NULL,
  `status` enum('pending','accepted','declined','expired') DEFAULT 'pending',
  `message` text DEFAULT NULL,
  `invitation_token` varchar(64) DEFAULT NULL,
  `token_expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `responded_at` timestamp NULL DEFAULT NULL,
  `response_message` text DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_team_user_status` (`team_id`,`user_id`,`status`),
  KEY `idx_user_status` (`user_id`,`status`),
  KEY `idx_team_status` (`team_id`,`status`),
  KEY `idx_invited_by` (`invited_by`),
  KEY `idx_expires_at` (`expires_at`),
  KEY `idx_team_user_status` (`team_id`,`user_id`,`status`),
  KEY `idx_email` (`invited_email`),
  KEY `idx_token` (`invitation_token`),
  CONSTRAINT `player_invitations_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `player_invitations_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `player_invitations_ibfk_3` FOREIGN KEY (`invited_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: player_match_ratings
CREATE TABLE `player_match_ratings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `match_id` int(11) NOT NULL,
  `player_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `rated_by` int(11) NOT NULL COMMENT 'Manager qui a noté',
  `rating` int(11) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_player_match_rating` (`match_id`,`player_id`),
  KEY `idx_match_ratings` (`match_id`),
  KEY `idx_player_ratings` (`player_id`),
  KEY `team_id` (`team_id`),
  KEY `rated_by` (`rated_by`),
  CONSTRAINT `player_match_ratings_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `player_match_ratings_ibfk_2` FOREIGN KEY (`player_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `player_match_ratings_ibfk_3` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `player_match_ratings_ibfk_4` FOREIGN KEY (`rated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_rating_range` CHECK (`rating` between 1 and 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: player_match_statistics
CREATE TABLE `player_match_statistics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `match_id` int(11) NOT NULL,
  `player_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `goals` int(11) DEFAULT 0,
  `assists` int(11) DEFAULT 0,
  `minutes_played` int(11) DEFAULT 0,
  `yellow_cards` int(11) DEFAULT 0,
  `red_cards` int(11) DEFAULT 0,
  `participated` tinyint(1) DEFAULT 1,
  `was_starter` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_player_match` (`match_id`,`player_id`),
  KEY `idx_player_stats` (`player_id`),
  KEY `idx_team_match` (`team_id`,`match_id`),
  CONSTRAINT `player_match_statistics_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `player_match_statistics_ibfk_2` FOREIGN KEY (`player_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `player_match_statistics_ibfk_3` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: player_season_statistics
CREATE TABLE `player_season_statistics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `player_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `season` varchar(20) DEFAULT '2024-2025',
  `matches_played` int(11) DEFAULT 0,
  `goals` int(11) DEFAULT 0,
  `assists` int(11) DEFAULT 0,
  `minutes_played` int(11) DEFAULT 0,
  `yellow_cards` int(11) DEFAULT 0,
  `red_cards` int(11) DEFAULT 0,
  `average_goals` decimal(4,2) GENERATED ALWAYS AS (case when `matches_played` > 0 then `goals` / `matches_played` else 0 end) STORED,
  `average_minutes` decimal(5,1) GENERATED ALWAYS AS (case when `matches_played` > 0 then `minutes_played` / `matches_played` else 0 end) STORED,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_player_team_season` (`player_id`,`team_id`,`season`),
  KEY `team_id` (`team_id`),
  KEY `idx_player_season` (`player_id`,`season`),
  KEY `idx_goals` (`goals`),
  KEY `idx_assists` (`assists`),
  CONSTRAINT `player_season_statistics_ibfk_1` FOREIGN KEY (`player_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `player_season_statistics_ibfk_2` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: post_media
CREATE TABLE `post_media` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `upload_id` int(11) NOT NULL,
  `media_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_post` (`post_id`),
  KEY `idx_upload` (`upload_id`),
  CONSTRAINT `post_media_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `feed_posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `post_media_ibfk_2` FOREIGN KEY (`upload_id`) REFERENCES `uploads` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ratings
CREATE TABLE `ratings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `match_id` int(11) NOT NULL,
  `rater_team_id` int(11) NOT NULL,
  `rated_team_id` int(11) NOT NULL,
  `fair_play_score` tinyint(4) NOT NULL CHECK (`fair_play_score` between 1 and 5),
  `organization_score` tinyint(4) NOT NULL CHECK (`organization_score` between 1 and 5),
  `punctuality_score` tinyint(4) NOT NULL CHECK (`punctuality_score` between 1 and 5),
  `overall_score` decimal(2,1) GENERATED ALWAYS AS ((`fair_play_score` + `organization_score` + `punctuality_score`) / 3) STORED,
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_match_rating` (`match_id`,`rater_team_id`,`rated_team_id`),
  KEY `rater_team_id` (`rater_team_id`),
  KEY `rated_team_id` (`rated_team_id`),
  CONSTRAINT `ratings_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ratings_ibfk_2` FOREIGN KEY (`rater_team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ratings_ibfk_3` FOREIGN KEY (`rated_team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: recent_feed
undefined;

-- Table: referee_availability
CREATE TABLE `referee_availability` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `referee_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_referee_date` (`referee_id`,`date`),
  KEY `idx_referee_date` (`referee_id`,`date`),
  KEY `idx_date_availability` (`date`,`is_available`),
  KEY `idx_referee_availability_date` (`referee_id`,`date`,`is_available`),
  CONSTRAINT `referee_availability_ibfk_1` FOREIGN KEY (`referee_id`) REFERENCES `referees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: referee_certifications
CREATE TABLE `referee_certifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `referee_id` int(11) NOT NULL,
  `certification_name` varchar(100) NOT NULL,
  `certification_type` enum('license','training','specialization','award') NOT NULL,
  `issuing_organization` varchar(100) DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `certificate_number` varchar(50) DEFAULT NULL,
  `document_id` int(11) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `document_id` (`document_id`),
  KEY `idx_referee_certifications` (`referee_id`,`is_active`),
  KEY `idx_expiry_date` (`expiry_date`),
  CONSTRAINT `referee_certifications_ibfk_1` FOREIGN KEY (`referee_id`) REFERENCES `referees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `referee_certifications_ibfk_2` FOREIGN KEY (`document_id`) REFERENCES `uploads` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: referee_ratings
CREATE TABLE `referee_ratings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `referee_id` int(11) NOT NULL,
  `match_id` int(11) NOT NULL,
  `assignment_id` int(11) NOT NULL,
  `rated_by` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` between 1 and 5),
  `fairness_rating` int(11) DEFAULT NULL CHECK (`fairness_rating` between 1 and 5),
  `communication_rating` int(11) DEFAULT NULL CHECK (`communication_rating` between 1 and 5),
  `professionalism_rating` int(11) DEFAULT NULL CHECK (`professionalism_rating` between 1 and 5),
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_rating_per_team` (`assignment_id`,`team_id`),
  KEY `rated_by` (`rated_by`),
  KEY `team_id` (`team_id`),
  KEY `idx_referee_ratings` (`referee_id`,`rating`),
  KEY `idx_match_ratings` (`match_id`),
  CONSTRAINT `referee_ratings_ibfk_1` FOREIGN KEY (`referee_id`) REFERENCES `referees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `referee_ratings_ibfk_2` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `referee_ratings_ibfk_3` FOREIGN KEY (`assignment_id`) REFERENCES `match_referee_assignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `referee_ratings_ibfk_4` FOREIGN KEY (`rated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `referee_ratings_ibfk_5` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: referees
CREATE TABLE `referees` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `license_number` varchar(50) DEFAULT NULL,
  `license_level` enum('regional','national','international','trainee') DEFAULT 'regional',
  `experience_years` int(11) DEFAULT 0,
  `bio` text DEFAULT NULL,
  `specializations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`specializations`)),
  `languages` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`languages`)),
  `location_city` varchar(100) DEFAULT NULL,
  `location_lat` decimal(10,8) DEFAULT NULL,
  `location_lng` decimal(11,8) DEFAULT NULL,
  `max_travel_distance` int(11) DEFAULT 50,
  `profile_picture_id` int(11) DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT 0.00,
  `total_ratings` int(11) DEFAULT 0,
  `total_matches` int(11) DEFAULT 0,
  `hourly_rate` decimal(10,2) DEFAULT NULL,
  `currency` varchar(3) DEFAULT 'EUR',
  `is_available` tinyint(1) DEFAULT 1,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `license_number` (`license_number`),
  KEY `user_id` (`user_id`),
  KEY `profile_picture_id` (`profile_picture_id`),
  KEY `idx_license_level` (`license_level`),
  KEY `idx_location` (`location_city`,`location_lat`,`location_lng`),
  KEY `idx_availability` (`is_available`,`is_active`),
  KEY `idx_rating` (`rating`),
  CONSTRAINT `referees_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `referees_ibfk_2` FOREIGN KEY (`profile_picture_id`) REFERENCES `uploads` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: reports
CREATE TABLE `reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reporter_id` int(11) NOT NULL,
  `reported_type` enum('user','team','match','venue','referee') NOT NULL,
  `reported_id` int(11) NOT NULL,
  `reason` enum('inappropriate_behavior','spam','fraud','violence','other') NOT NULL,
  `description` text NOT NULL,
  `status` enum('pending','investigating','resolved','dismissed') DEFAULT 'pending',
  `priority` enum('low','medium','high','critical') DEFAULT 'medium',
  `assigned_to` int(11) DEFAULT NULL,
  `resolution_notes` text DEFAULT NULL,
  `resolved_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `reporter_id` (`reporter_id`),
  KEY `assigned_to` (`assigned_to`),
  KEY `idx_status` (`status`),
  KEY `idx_reported` (`reported_type`,`reported_id`),
  KEY `idx_priority` (`priority`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: system_settings
CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_type` enum('string','number','boolean','json') DEFAULT 'string',
  `description` text DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT 0 COMMENT 'Accessible sans auth',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  KEY `updated_by` (`updated_by`),
  KEY `idx_key` (`setting_key`),
  KEY `idx_public` (`is_public`),
  CONSTRAINT `system_settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: team_availability
CREATE TABLE `team_availability` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `team_id` int(11) NOT NULL,
  `day_of_week` tinyint(4) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_recurring` tinyint(1) DEFAULT 1,
  `specific_date` date DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_team_day` (`team_id`,`day_of_week`),
  CONSTRAINT `team_availability_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: team_followers
CREATE TABLE `team_followers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `followed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_follower` (`user_id`,`team_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_team_id` (`team_id`),
  CONSTRAINT `team_followers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `team_followers_ibfk_2` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: team_gallery
CREATE TABLE `team_gallery` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `team_id` int(11) NOT NULL COMMENT 'ID de l''équipe',
  `upload_id` int(11) NOT NULL COMMENT 'ID du fichier uploadé',
  `album` varchar(50) DEFAULT 'general',
  `caption` text DEFAULT NULL COMMENT 'Légende de la photo',
  `photo_type` enum('team','training','celebration','facility','other') DEFAULT 'team' COMMENT 'Type de photo',
  `is_cover` tinyint(1) DEFAULT 0 COMMENT 'Photo de couverture de la galerie',
  `display_order` int(11) DEFAULT 0 COMMENT 'Ordre d''affichage',
  `is_featured` tinyint(1) DEFAULT 0,
  `uploaded_by` int(11) NOT NULL COMMENT 'ID de l''utilisateur qui a uploadé',
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Date d''upload',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Photo active ou supprimée',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_team_gallery_upload` (`upload_id`),
  KEY `idx_team_active` (`team_id`,`is_active`),
  KEY `idx_photo_type` (`photo_type`),
  KEY `idx_display_order` (`team_id`,`display_order`),
  KEY `idx_uploaded_by` (`uploaded_by`),
  KEY `idx_gallery_team_album` (`team_id`,`album`),
  KEY `idx_gallery_featured` (`team_id`,`is_featured`),
  KEY `idx_gallery_created_at` (`created_at`),
  CONSTRAINT `fk_team_gallery_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_team_gallery_upload` FOREIGN KEY (`upload_id`) REFERENCES `uploads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_team_gallery_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Galerie de photos pour les équipes';

-- Table: team_match_validations
CREATE TABLE `team_match_validations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `team_id` int(11) NOT NULL,
  `match_id` int(11) DEFAULT NULL,
  `invitation_id` int(11) DEFAULT NULL,
  `validation_type` enum('send_invitation','accept_invitation','match_start') NOT NULL,
  `players_count` int(11) NOT NULL,
  `minimum_required` int(11) DEFAULT 6,
  `is_valid` tinyint(1) NOT NULL,
  `validated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `validated_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `invitation_id` (`invitation_id`),
  KEY `validated_by` (`validated_by`),
  KEY `idx_team_validation` (`team_id`,`validation_type`),
  KEY `idx_match_validation` (`match_id`),
  CONSTRAINT `team_match_validations_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `team_match_validations_ibfk_2` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `team_match_validations_ibfk_3` FOREIGN KEY (`invitation_id`) REFERENCES `match_invitations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `team_match_validations_ibfk_4` FOREIGN KEY (`validated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: team_members
CREATE TABLE `team_members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `team_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('captain','vice-captain','player','substitute','manager') DEFAULT 'player',
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1,
  `jersey_number` int(11) DEFAULT NULL,
  `is_captain` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_team_user` (`team_id`,`user_id`),
  UNIQUE KEY `unique_team_jersey` (`team_id`,`jersey_number`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `team_members_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `team_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_jersey_number` CHECK (`jersey_number` between 1 and 99)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: team_season_statistics
CREATE TABLE `team_season_statistics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `team_id` int(11) NOT NULL,
  `season` varchar(20) DEFAULT '2024-2025',
  `matches_played` int(11) DEFAULT 0,
  `matches_won` int(11) DEFAULT 0,
  `matches_drawn` int(11) DEFAULT 0,
  `matches_lost` int(11) DEFAULT 0,
  `goals_for` int(11) DEFAULT 0,
  `goals_against` int(11) DEFAULT 0,
  `goal_difference` int(11) GENERATED ALWAYS AS (`goals_for` - `goals_against`) STORED,
  `clean_sheets` int(11) DEFAULT 0,
  `points` int(11) GENERATED ALWAYS AS (`matches_won` * 3 + `matches_drawn`) STORED,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_team_season` (`team_id`,`season`),
  KEY `idx_season` (`season`),
  KEY `idx_points` (`points`),
  CONSTRAINT `team_season_statistics_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: team_stats
CREATE TABLE `team_stats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `team_id` int(11) NOT NULL,
  `matches_played` int(11) DEFAULT 0,
  `matches_won` int(11) DEFAULT 0,
  `matches_drawn` int(11) DEFAULT 0,
  `matches_lost` int(11) DEFAULT 0,
  `goals_scored` int(11) DEFAULT 0,
  `goals_conceded` int(11) DEFAULT 0,
  `average_rating` decimal(3,2) DEFAULT 0.00,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_team` (`team_id`),
  CONSTRAINT `team_stats_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: teams
CREATE TABLE `teams` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `captain_id` int(11) NOT NULL,
  `skill_level` enum('beginner','amateur','intermediate','advanced','semi_pro') DEFAULT 'amateur',
  `max_players` int(11) DEFAULT 15,
  `location_city` varchar(100) DEFAULT NULL,
  `location_lat` decimal(10,8) DEFAULT NULL,
  `location_lng` decimal(11,8) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `logo_id` int(11) DEFAULT NULL,
  `banner_id` int(11) DEFAULT NULL,
  `banner_position` varchar(20) DEFAULT 'center' COMMENT 'Position de la bannière (top, center, bottom)',
  `mercato_actif` tinyint(1) DEFAULT 1 COMMENT 'Si true, les joueurs peuvent demander à rejoindre l''équipe',
  PRIMARY KEY (`id`),
  KEY `captain_id` (`captain_id`),
  KEY `idx_location` (`location_lat`,`location_lng`),
  KEY `idx_skill_level` (`skill_level`),
  KEY `logo_id` (`logo_id`),
  KEY `idx_teams_banner` (`banner_id`),
  KEY `idx_teams_mercato_actif` (`mercato_actif`),
  CONSTRAINT `fk_teams_banner` FOREIGN KEY (`banner_id`) REFERENCES `uploads` (`id`) ON DELETE SET NULL,
  CONSTRAINT `teams_ibfk_1` FOREIGN KEY (`captain_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `teams_ibfk_2` FOREIGN KEY (`logo_id`) REFERENCES `uploads` (`id`) ON DELETE SET NULL,
  CONSTRAINT `teams_ibfk_3` FOREIGN KEY (`banner_id`) REFERENCES `uploads` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Équipes avec gestion du mercato (fenêtre de transfert)';

-- Table: trending_posts
undefined;

-- Table: uploads
CREATE TABLE `uploads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `original_filename` varchar(255) NOT NULL,
  `stored_filename` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `file_size` int(11) NOT NULL COMMENT 'Taille en octets',
  `file_extension` varchar(10) NOT NULL,
  `file_type` enum('image','video','document','other') NOT NULL,
  `upload_context` enum('user_profile','team_logo','team_banner','match_photo','post_media','message_attachment','location_photo','other') NOT NULL DEFAULT 'other',
  `uploaded_by` int(11) NOT NULL,
  `related_entity_type` enum('user','team','match','post','message','location') DEFAULT NULL,
  `related_entity_id` int(11) DEFAULT NULL COMMENT 'ID de l''entité associée',
  `image_width` int(11) DEFAULT NULL,
  `image_height` int(11) DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `variants` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Stocke les URLs des différentes variantes de l''image' CHECK (json_valid(`variants`)),
  `processed_at` timestamp NULL DEFAULT NULL COMMENT 'Date de traitement de l''image',
  `optimization_score` decimal(3,2) DEFAULT NULL COMMENT 'Score d''optimisation (0-1)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `stored_filename` (`stored_filename`),
  KEY `idx_uploaded_by` (`uploaded_by`),
  KEY `idx_context` (`upload_context`),
  KEY `idx_entity` (`related_entity_type`,`related_entity_id`),
  KEY `idx_file_type` (`file_type`),
  KEY `idx_uploaded_at` (`uploaded_at`),
  KEY `idx_uploads_context` (`upload_context`,`related_entity_type`,`related_entity_id`),
  CONSTRAINT `uploads_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: users
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `position` varchar(50) DEFAULT NULL,
  `skill_level` varchar(50) DEFAULT NULL,
  `location_city` varchar(100) DEFAULT NULL,
  `location_lat` decimal(10,8) DEFAULT NULL,
  `location_lng` decimal(11,8) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `email_verified` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `profile_picture_id` int(11) DEFAULT NULL,
  `cover_photo_id` int(11) DEFAULT NULL,
  `user_type` enum('player','manager','superadmin','venue_owner','referee') DEFAULT 'player',
  `is_verified` tinyint(1) DEFAULT 0,
  `verification_token` varchar(255) DEFAULT NULL,
  `verification_token_expires_at` datetime DEFAULT NULL,
  `average_rating` decimal(3,2) DEFAULT NULL COMMENT 'Note moyenne générale (1-10)',
  `total_ratings` int(11) DEFAULT 0 COMMENT 'Nombre total de notations reçues',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `profile_picture_id` (`profile_picture_id`),
  KEY `cover_photo_id` (`cover_photo_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`profile_picture_id`) REFERENCES `uploads` (`id`) ON DELETE SET NULL,
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`cover_photo_id`) REFERENCES `uploads` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: v_player_average_ratings
undefined;

-- Table: v_uploads_detailed
undefined;

-- Table: venue_availability
CREATE TABLE `venue_availability` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `venue_id` int(11) NOT NULL,
  `day_of_week` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL,
  `opening_time` time NOT NULL,
  `closing_time` time NOT NULL,
  `is_closed` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_venue_day` (`venue_id`,`day_of_week`),
  CONSTRAINT `venue_availability_ibfk_1` FOREIGN KEY (`venue_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: venue_bookings
CREATE TABLE `venue_bookings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `location_id` int(11) NOT NULL,
  `match_id` int(11) DEFAULT NULL,
  `team_id` int(11) NOT NULL,
  `booked_by` int(11) NOT NULL,
  `booking_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `duration_minutes` int(11) NOT NULL,
  `game_type` enum('5v5','7v7','11v11','futsal','training','tournament') NOT NULL,
  `status` enum('pending','manager_confirmed','confirmed','cancelled','completed','no_show') DEFAULT 'pending',
  `base_price` decimal(10,2) NOT NULL,
  `discount_applied` decimal(10,2) DEFAULT 0.00,
  `final_price` decimal(10,2) NOT NULL,
  `payment_status` enum('pending','paid','refunded','cancelled') DEFAULT 'pending',
  `payment_method` varchar(50) DEFAULT NULL,
  `paid_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `notes` text DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `owner_response_message` text DEFAULT NULL COMMENT 'Message de réponse du propriétaire',
  `owner_responded_at` timestamp NULL DEFAULT NULL COMMENT 'Date de réponse du propriétaire',
  `manager_confirmed_at` timestamp NULL DEFAULT NULL,
  `manager_confirmed_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `booked_by` (`booked_by`),
  KEY `idx_location_date` (`location_id`,`booking_date`),
  KEY `idx_location_status` (`location_id`,`status`),
  KEY `idx_team_bookings` (`team_id`,`status`),
  KEY `idx_match_booking` (`match_id`),
  KEY `idx_booking_datetime` (`location_id`,`booking_date`,`start_time`,`end_time`),
  KEY `idx_venue_bookings_owner_responded` (`owner_responded_at`),
  KEY `fk_manager_confirmed_by` (`manager_confirmed_by`),
  KEY `idx_venue_bookings_availability` (`location_id`,`booking_date`,`status`),
  CONSTRAINT `fk_manager_confirmed_by` FOREIGN KEY (`manager_confirmed_by`) REFERENCES `users` (`id`),
  CONSTRAINT `venue_bookings_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `venue_bookings_ibfk_2` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `venue_bookings_ibfk_3` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `venue_bookings_ibfk_4` FOREIGN KEY (`booked_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Réservations de terrains avec gestion des réponses propriétaires';

-- Table: venue_closures
CREATE TABLE `venue_closures` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `venue_id` int(11) NOT NULL,
  `closure_date` date NOT NULL,
  `closure_reason` varchar(255) DEFAULT NULL,
  `is_full_day` tinyint(1) DEFAULT 1,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_venue_date` (`venue_id`,`closure_date`),
  CONSTRAINT `venue_closures_ibfk_1` FOREIGN KEY (`venue_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: venue_owner_notifications
CREATE TABLE `venue_owner_notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `owner_id` int(11) NOT NULL,
  `venue_id` int(11) NOT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `notification_type` enum('new_booking','booking_cancelled','payment_received','review_posted') NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `venue_id` (`venue_id`),
  KEY `booking_id` (`booking_id`),
  KEY `idx_owner_unread` (`owner_id`,`is_read`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `venue_owner_notifications_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `venue_owner_notifications_ibfk_2` FOREIGN KEY (`venue_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `venue_owner_notifications_ibfk_3` FOREIGN KEY (`booking_id`) REFERENCES `venue_bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: venue_partnerships
CREATE TABLE `venue_partnerships` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `location_id` int(11) NOT NULL,
  `partnership_type` enum('bronze','silver','gold','platinum') NOT NULL,
  `discount_percentage` decimal(5,2) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `terms` text DEFAULT NULL,
  `benefits` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`benefits`)),
  `contact_person` varchar(100) DEFAULT NULL,
  `contact_email` varchar(100) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_location_partnership` (`location_id`,`is_active`),
  KEY `idx_partnership_type` (`partnership_type`),
  KEY `idx_active_partnerships` (`is_active`,`end_date`),
  CONSTRAINT `venue_partnerships_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: venue_pricing
CREATE TABLE `venue_pricing` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `location_id` int(11) NOT NULL,
  `game_type` enum('5v5','7v7','11v11','futsal','training','tournament') NOT NULL,
  `duration_minutes` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'EUR',
  `day_type` enum('weekday','weekend','holiday') DEFAULT 'weekday',
  `time_slot` enum('morning','afternoon','evening','night') DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_pricing` (`location_id`,`game_type`,`duration_minutes`,`day_type`,`time_slot`),
  KEY `idx_location_game_type` (`location_id`,`game_type`),
  KEY `idx_location_active` (`location_id`,`is_active`),
  CONSTRAINT `venue_pricing_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: venue_ratings
CREATE TABLE `venue_ratings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `location_id` int(11) NOT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` between 1 and 5),
  `field_condition_rating` int(11) DEFAULT NULL CHECK (`field_condition_rating` between 1 and 5),
  `facilities_rating` int(11) DEFAULT NULL CHECK (`facilities_rating` between 1 and 5),
  `service_rating` int(11) DEFAULT NULL CHECK (`service_rating` between 1 and 5),
  `comment` text DEFAULT NULL,
  `photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photos`)),
  `is_verified` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_booking_rating` (`user_id`,`booking_id`),
  KEY `booking_id` (`booking_id`),
  KEY `idx_location_ratings` (`location_id`,`rating`),
  KEY `idx_verified_ratings` (`location_id`,`is_verified`),
  CONSTRAINT `venue_ratings_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `venue_ratings_ibfk_2` FOREIGN KEY (`booking_id`) REFERENCES `venue_bookings` (`id`) ON DELETE SET NULL,
  CONSTRAINT `venue_ratings_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: venue_revenue_tracking
CREATE TABLE `venue_revenue_tracking` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `venue_id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `platform_fee` decimal(10,2) DEFAULT 0.00,
  `net_amount` decimal(10,2) NOT NULL,
  `revenue_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  KEY `idx_venue_date` (`venue_id`,`revenue_date`),
  KEY `idx_revenue_date` (`revenue_date`),
  CONSTRAINT `venue_revenue_tracking_ibfk_1` FOREIGN KEY (`venue_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `venue_revenue_tracking_ibfk_2` FOREIGN KEY (`booking_id`) REFERENCES `venue_bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

