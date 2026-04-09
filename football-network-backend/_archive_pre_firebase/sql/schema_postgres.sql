-- Supabase Postgres Schema V2

CREATE TABLE "admin_logs" (
  "id" SERIAL PRIMARY KEY,
  "admin_id" INTEGER NOT NULL,
  "action_type" varchar(50) NOT NULL,
  "target_type" varchar(50) DEFAULT NULL,
  "target_id" INTEGER DEFAULT NULL,
  "action_details" JSONB DEFAULT NULL,
  "ip_address" varchar(45) DEFAULT NULL,
  "user_agent" text DEFAULT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "admin_logs_idx_admin_action" ON "admin_logs" ("admin_id","action_type");
CREATE INDEX "admin_logs_idx_target" ON "admin_logs" ("target_type","target_id");
CREATE INDEX "admin_logs_idx_created" ON "admin_logs" ("created_at");

CREATE TABLE "bans" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER DEFAULT NULL,
  "team_id" INTEGER DEFAULT NULL,
  "ban_type" TEXT NOT NULL,
  "reason" text NOT NULL,
  "banned_by" INTEGER NOT NULL,
  "starts_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ends_at" timestamp NULL DEFAULT NULL,
  "is_active" BOOLEAN DEFAULT true,
  "notes" text DEFAULT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "bans_banned_by" ON "bans" ("banned_by");
CREATE INDEX "bans_idx_user_active" ON "bans" ("user_id","is_active");
CREATE INDEX "bans_idx_team_active" ON "bans" ("team_id","is_active");
CREATE INDEX "bans_idx_type" ON "bans" ("ban_type");

CREATE TABLE "feed_comments" (
  "id" SERIAL PRIMARY KEY,
  "post_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "parent_comment_id" INTEGER DEFAULT NULL,
  "content" text NOT NULL,
  "likes_count" INTEGER DEFAULT 0,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP 
);

CREATE INDEX "feed_comments_parent_comment_id" ON "feed_comments" ("parent_comment_id");
CREATE INDEX "feed_comments_idx_post_comments" ON "feed_comments" ("post_id","created_at");
CREATE INDEX "feed_comments_idx_user_comments" ON "feed_comments" ("user_id");

CREATE TABLE "feed_hashtags" (
  "id" SERIAL PRIMARY KEY,
  "tag" varchar(100) NOT NULL,
  "usage_count" INTEGER DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "feed_hashtags_tag" UNIQUE ("tag")
);

CREATE INDEX "feed_hashtags_idx_tag" ON "feed_hashtags" ("tag");
CREATE INDEX "feed_hashtags_idx_usage" ON "feed_hashtags" ("usage_count");

CREATE TABLE "feed_likes" (
  "id" SERIAL PRIMARY KEY,
  "post_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "feed_likes_unique_like" UNIQUE ("post_id","user_id")
);

CREATE INDEX "feed_likes_idx_user_likes" ON "feed_likes" ("user_id");

CREATE TABLE "feed_post_hashtags" (
  "post_id" INTEGER NOT NULL,
  "hashtag_id" INTEGER NOT NULL,
  PRIMARY KEY ("post_id","hashtag_id")
);

CREATE INDEX "feed_post_hashtags_hashtag_id" ON "feed_post_hashtags" ("hashtag_id");

CREATE TABLE "feed_post_views" (
  "id" SERIAL PRIMARY KEY,
  "post_id" INTEGER NOT NULL,
  "user_id" INTEGER DEFAULT NULL,
  "viewed_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "feed_post_views_user_id" ON "feed_post_views" ("user_id");
CREATE INDEX "feed_post_views_idx_post_views" ON "feed_post_views" ("post_id","viewed_at");

CREATE TABLE "feed_posts" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "post_type" TEXT NOT NULL DEFAULT 'general',
  "content" text NOT NULL,
  "match_id" INTEGER DEFAULT NULL,
  "team_id" INTEGER DEFAULT NULL,
  "media_url" varchar(500) DEFAULT NULL,
  "media_type" TEXT DEFAULT NULL,
  "visibility" TEXT DEFAULT 'public',
  "location_city" varchar(100) DEFAULT NULL,
  "location_lat" decimal(10,8) DEFAULT NULL,
  "location_lng" decimal(11,8) DEFAULT NULL,
  "likes_count" INTEGER DEFAULT 0,
  "comments_count" INTEGER DEFAULT 0,
  "shares_count" INTEGER DEFAULT 0,
  "views_count" INTEGER DEFAULT 0,
  "is_active" BOOLEAN DEFAULT true,
  "is_pinned" BOOLEAN DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  "recruitment_position" varchar(50) DEFAULT NULL,
  "recruitment_skill_level" varchar(50) DEFAULT NULL,
  "recruitment_description" text DEFAULT NULL,
  "match_opponent" varchar(255) DEFAULT NULL,
  "match_score_home" INTEGER DEFAULT NULL,
  "match_score_away" INTEGER DEFAULT NULL,
  "match_date" TIMESTAMP DEFAULT NULL
);

CREATE INDEX "feed_posts_user_id" ON "feed_posts" ("user_id");
CREATE INDEX "feed_posts_match_id" ON "feed_posts" ("match_id");
CREATE INDEX "feed_posts_team_id" ON "feed_posts" ("team_id");
CREATE INDEX "feed_posts_idx_post_type" ON "feed_posts" ("post_type");
CREATE INDEX "feed_posts_idx_created_at" ON "feed_posts" ("created_at");
CREATE INDEX "feed_posts_idx_location" ON "feed_posts" ("location_city");
CREATE INDEX "feed_posts_idx_visibility" ON "feed_posts" ("visibility");
CREATE INDEX "feed_posts_idx_active" ON "feed_posts" ("is_active");
CREATE INDEX "feed_posts_idx_feed_timeline" ON "feed_posts" ("is_active","visibility","created_at");
CREATE INDEX "feed_posts_idx_feed_location" ON "feed_posts" ("location_city","is_active","created_at");
CREATE INDEX "feed_posts_idx_feed_personalized" ON "feed_posts" ("post_type","is_active","created_at");

CREATE TABLE "feed_reports" (
  "id" SERIAL PRIMARY KEY,
  "post_id" INTEGER DEFAULT NULL,
  "comment_id" INTEGER DEFAULT NULL,
  "reported_by" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "description" text DEFAULT NULL,
  "status" TEXT DEFAULT 'pending',
  "reviewed_by" INTEGER DEFAULT NULL,
  "reviewed_at" timestamp NULL DEFAULT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "feed_reports_post_id" ON "feed_reports" ("post_id");
CREATE INDEX "feed_reports_comment_id" ON "feed_reports" ("comment_id");
CREATE INDEX "feed_reports_reviewed_by" ON "feed_reports" ("reviewed_by");
CREATE INDEX "feed_reports_idx_status" ON "feed_reports" ("status");
CREATE INDEX "feed_reports_idx_reporter" ON "feed_reports" ("reported_by");

CREATE TABLE "feed_shares" (
  "id" SERIAL PRIMARY KEY,
  "post_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "shared_to" TEXT DEFAULT 'feed',
  "message" text DEFAULT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "feed_shares_idx_user_shares" ON "feed_shares" ("user_id");
CREATE INDEX "feed_shares_idx_post_shares" ON "feed_shares" ("post_id");

CREATE TABLE "location_availability" (
  "id" SERIAL PRIMARY KEY,
  "location_id" INTEGER NOT NULL,
  "day_of_week" SMALLINT NOT NULL,
  "start_time" time NOT NULL,
  "end_time" time NOT NULL,
  "is_available" BOOLEAN DEFAULT true
);

CREATE INDEX "location_availability_idx_location_day" ON "location_availability" ("location_id","day_of_week");

CREATE TABLE "location_photos" (
  "id" SERIAL PRIMARY KEY,
  "location_id" INTEGER NOT NULL,
  "upload_id" INTEGER NOT NULL,
  "display_order" INTEGER DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "location_photos_idx_location" ON "location_photos" ("location_id");
CREATE INDEX "location_photos_upload_id" ON "location_photos" ("upload_id");

CREATE TABLE "locations" (
  "id" SERIAL PRIMARY KEY,
  "name" varchar(150) NOT NULL,
  "address" text NOT NULL,
  "owner_id" INTEGER DEFAULT NULL,
  "city" varchar(100) NOT NULL,
  "postal_code" varchar(10) DEFAULT NULL,
  "latitude" decimal(10,8) NOT NULL,
  "longitude" decimal(11,8) NOT NULL,
  "field_type" TEXT DEFAULT 'grass',
  "field_surface" TEXT DEFAULT 'synthetic',
  "field_size" varchar(50) DEFAULT NULL,
  "capacity" INTEGER DEFAULT NULL,
  "is_partner" BOOLEAN DEFAULT false,
  "partner_discount" decimal(5,2) DEFAULT 0.00,
  "partner_since" date DEFAULT NULL,
  "rating" decimal(3,2) DEFAULT 0.00,
  "total_ratings" INTEGER DEFAULT 0,
  "photo_id" INTEGER DEFAULT NULL,
  "banner_id" INTEGER DEFAULT NULL,
  "is_active" BOOLEAN DEFAULT true,
  "price_per_hour" decimal(8,2) DEFAULT NULL,
  "amenities" JSONB DEFAULT NULL,
  "owner_type" TEXT DEFAULT 'public',
  "manager_name" varchar(100) DEFAULT NULL,
  "manager_phone" varchar(20) DEFAULT NULL,
  "manager_email" varchar(100) DEFAULT NULL,
  "opening_hours" JSONB DEFAULT NULL,
  "facilities" JSONB DEFAULT NULL,
  "owner_contact" varchar(255) DEFAULT NULL,
  "is_available" BOOLEAN DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "main_photo_id" INTEGER DEFAULT NULL,
  "is_managed" BOOLEAN DEFAULT false
);

CREATE INDEX "locations_idx_location" ON "locations" ("latitude","longitude");
CREATE INDEX "locations_idx_city" ON "locations" ("city");
CREATE INDEX "locations_main_photo_id" ON "locations" ("main_photo_id");
CREATE INDEX "locations_idx_owner_type" ON "locations" ("owner_type");
CREATE INDEX "locations_idx_is_partner" ON "locations" ("is_partner");
CREATE INDEX "locations_idx_is_active" ON "locations" ("is_active");
CREATE INDEX "locations_idx_field_surface" ON "locations" ("field_surface");
CREATE INDEX "locations_photo_id" ON "locations" ("photo_id");
CREATE INDEX "locations_banner_id" ON "locations" ("banner_id");
CREATE INDEX "locations_idx_owner" ON "locations" ("owner_id");

CREATE TABLE "match_disputes" (
  "id" SERIAL PRIMARY KEY,
  "match_id" INTEGER NOT NULL,
  "opened_by" INTEGER NOT NULL,
  "opened_by_role" TEXT NOT NULL,
  "reason" text NOT NULL,
  "proposed_home_score" INTEGER DEFAULT NULL,
  "proposed_away_score" INTEGER DEFAULT NULL,
  "status" TEXT DEFAULT 'open',
  "resolution_notes" text DEFAULT NULL,
  "resolved_by" INTEGER DEFAULT NULL,
  "resolved_at" timestamp NULL DEFAULT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP 
);

CREATE INDEX "match_disputes_opened_by" ON "match_disputes" ("opened_by");
CREATE INDEX "match_disputes_resolved_by" ON "match_disputes" ("resolved_by");
CREATE INDEX "match_disputes_idx_match_disputes" ON "match_disputes" ("match_id");
CREATE INDEX "match_disputes_idx_dispute_status" ON "match_disputes" ("status");

CREATE TABLE "match_goals" (
  "id" SERIAL PRIMARY KEY,
  "match_id" INTEGER NOT NULL,
  "team_id" INTEGER NOT NULL,
  "scorer_id" INTEGER DEFAULT NULL,
  "assister_id" INTEGER DEFAULT NULL,
  "minute_scored" INTEGER NOT NULL,
  "goal_type" TEXT DEFAULT 'regular',
  "notes" text DEFAULT NULL,
  "recorded_by" INTEGER DEFAULT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "match_goals_idx_match_goals" ON "match_goals" ("match_id");
CREATE INDEX "match_goals_idx_scorer" ON "match_goals" ("scorer_id");
CREATE INDEX "match_goals_team_id" ON "match_goals" ("team_id");
CREATE INDEX "match_goals_assister_id" ON "match_goals" ("assister_id");
CREATE INDEX "match_goals_recorded_by" ON "match_goals" ("recorded_by");

CREATE TABLE "match_incidents" (
  "id" SERIAL PRIMARY KEY,
  "match_id" INTEGER NOT NULL,
  "referee_id" INTEGER NOT NULL,
  "team_id" INTEGER NOT NULL,
  "player_id" INTEGER DEFAULT NULL,
  "incident_type" TEXT NOT NULL,
  "description" text NOT NULL,
  "minute_occurred" INTEGER DEFAULT NULL,
  "reported_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP 
);

CREATE INDEX "match_incidents_team_id" ON "match_incidents" ("team_id");
CREATE INDEX "match_incidents_player_id" ON "match_incidents" ("player_id");
CREATE INDEX "match_incidents_idx_match_incidents" ON "match_incidents" ("match_id");
CREATE INDEX "match_incidents_idx_referee_incidents" ON "match_incidents" ("referee_id");
CREATE INDEX "match_incidents_idx_incident_type" ON "match_incidents" ("incident_type");
CREATE INDEX "match_incidents_idx_reported_at" ON "match_incidents" ("reported_at");

CREATE TABLE "match_invitations" (
  "id" SERIAL PRIMARY KEY,
  "sender_team_id" INTEGER NOT NULL,
  "receiver_team_id" INTEGER NOT NULL,
  "match_id" INTEGER DEFAULT NULL,
  "proposed_date" TIMESTAMP NOT NULL,
  "proposed_location_id" INTEGER DEFAULT NULL,
  "venue_id" INTEGER DEFAULT NULL,
  "requires_referee" BOOLEAN DEFAULT false,
  "preferred_referee_id" INTEGER DEFAULT NULL,
  "message" text DEFAULT NULL,
  "status" TEXT DEFAULT 'pending',
  "response_message" text DEFAULT NULL,
  "sent_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "responded_at" timestamp NULL DEFAULT NULL,
  "expires_at" timestamp NULL DEFAULT NULL,
  "verify_player_availability" BOOLEAN DEFAULT false
);

CREATE INDEX "match_invitations_sender_team_id" ON "match_invitations" ("sender_team_id");
CREATE INDEX "match_invitations_match_id" ON "match_invitations" ("match_id");
CREATE INDEX "match_invitations_proposed_location_id" ON "match_invitations" ("proposed_location_id");
CREATE INDEX "match_invitations_idx_receiver_status" ON "match_invitations" ("receiver_team_id","status");
CREATE INDEX "match_invitations_idx_expires" ON "match_invitations" ("expires_at");
CREATE INDEX "match_invitations_idx_venue_id" ON "match_invitations" ("venue_id");
CREATE INDEX "match_invitations_idx_referee_id" ON "match_invitations" ("preferred_referee_id");
CREATE INDEX "match_invitations_idx_match_invitations_verify_availability" ON "match_invitations" ("verify_player_availability");

CREATE TABLE "match_participations" (
  "id" SERIAL PRIMARY KEY,
  "match_id" INTEGER NOT NULL,
  "team_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "status" TEXT DEFAULT 'pending',
  "response_note" text DEFAULT NULL,
  "responded_at" timestamp NULL DEFAULT NULL,
  "notified_at" timestamp NULL DEFAULT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  CONSTRAINT "match_participations_unique_participation" UNIQUE ("match_id","user_id")
);

CREATE INDEX "match_participations_idx_match" ON "match_participations" ("match_id");
CREATE INDEX "match_participations_idx_team" ON "match_participations" ("team_id");
CREATE INDEX "match_participations_idx_status" ON "match_participations" ("status");
CREATE INDEX "match_participations_idx_user_pending" ON "match_participations" ("user_id","status");

CREATE TABLE "match_photos" (
  "id" SERIAL PRIMARY KEY,
  "match_id" INTEGER NOT NULL,
  "upload_id" INTEGER NOT NULL,
  "caption" text DEFAULT NULL,
  "uploaded_by" INTEGER NOT NULL,
  "display_order" INTEGER DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "match_photos_idx_match" ON "match_photos" ("match_id");
CREATE INDEX "match_photos_idx_upload" ON "match_photos" ("upload_id");
CREATE INDEX "match_photos_uploaded_by" ON "match_photos" ("uploaded_by");

CREATE TABLE "match_referee_assignments" (
  "id" SERIAL PRIMARY KEY,
  "match_id" INTEGER NOT NULL,
  "referee_id" INTEGER NOT NULL,
  "role" TEXT DEFAULT 'main',
  "status" TEXT DEFAULT 'pending',
  "assigned_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "assigned_by" INTEGER DEFAULT NULL,
  "confirmed_at" timestamp NULL DEFAULT NULL,
  "declined_at" timestamp NULL DEFAULT NULL,
  "decline_reason" text DEFAULT NULL,
  "fee" decimal(10,2) DEFAULT NULL,
  "payment_status" TEXT DEFAULT 'pending',
  "notes" text DEFAULT NULL,
  CONSTRAINT "match_referee_assignments_unique_match_referee_role" UNIQUE ("match_id","referee_id","role")
);

CREATE INDEX "match_referee_assignments_assigned_by" ON "match_referee_assignments" ("assigned_by");
CREATE INDEX "match_referee_assignments_idx_match_referee" ON "match_referee_assignments" ("match_id","referee_id");
CREATE INDEX "match_referee_assignments_idx_referee_status" ON "match_referee_assignments" ("referee_id","status");
CREATE INDEX "match_referee_assignments_idx_match_status" ON "match_referee_assignments" ("match_id","status");

CREATE TABLE "match_reports" (
  "id" SERIAL PRIMARY KEY,
  "match_id" INTEGER NOT NULL,
  "referee_id" INTEGER NOT NULL,
  "home_score" INTEGER NOT NULL DEFAULT 0,
  "away_score" INTEGER NOT NULL DEFAULT 0,
  "match_summary" text DEFAULT NULL,
  "weather_conditions" varchar(50) DEFAULT NULL,
  "pitch_conditions" varchar(50) DEFAULT NULL,
  "status" TEXT DEFAULT 'draft',
  "submitted_at" timestamp NULL DEFAULT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  CONSTRAINT "match_reports_unique_match_report" UNIQUE ("match_id")
);

CREATE INDEX "match_reports_referee_id" ON "match_reports" ("referee_id");

CREATE TABLE "match_statistics" (
  "id" SERIAL PRIMARY KEY,
  "match_id" INTEGER NOT NULL,
  "team_id" INTEGER NOT NULL,
  "goals_scored" INTEGER DEFAULT 0,
  "goals_conceded" INTEGER DEFAULT 0,
  "result" TEXT NOT NULL,
  "clean_sheet" BOOLEAN DEFAULT false,
  "calculated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  CONSTRAINT "match_statistics_unique_match_team" UNIQUE ("match_id","team_id")
);

CREATE INDEX "match_statistics_idx_team_stats" ON "match_statistics" ("team_id");
CREATE INDEX "match_statistics_idx_result" ON "match_statistics" ("result");

CREATE TABLE "match_validation_history" (
  "id" SERIAL PRIMARY KEY,
  "match_id" INTEGER NOT NULL,
  "validation_type" TEXT NOT NULL,
  "home_team_confirmed" INTEGER NOT NULL,
  "away_team_confirmed" INTEGER NOT NULL,
  "is_valid" BOOLEAN NOT NULL,
  "validation_status" TEXT NOT NULL,
  "notes" text DEFAULT NULL,
  "checked_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "match_validation_history_idx_match" ON "match_validation_history" ("match_id");
CREATE INDEX "match_validation_history_idx_status" ON "match_validation_history" ("validation_status");

CREATE TABLE "match_validations" (
  "id" SERIAL PRIMARY KEY,
  "match_id" INTEGER NOT NULL,
  "validator_id" INTEGER NOT NULL,
  "validator_role" TEXT NOT NULL,
  "validation_type" TEXT NOT NULL,
  "home_score" INTEGER DEFAULT NULL,
  "away_score" INTEGER DEFAULT NULL,
  "validated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT DEFAULT 'approved',
  "notes" text DEFAULT NULL
);

CREATE INDEX "match_validations_idx_match_validations" ON "match_validations" ("match_id");
CREATE INDEX "match_validations_idx_validator" ON "match_validations" ("validator_id");

CREATE TABLE "matches" (
  "id" SERIAL PRIMARY KEY,
  "home_team_id" INTEGER NOT NULL,
  "away_team_id" INTEGER DEFAULT NULL,
  "location_id" INTEGER DEFAULT NULL,
  "venue_booking_id" INTEGER DEFAULT NULL,
  "venue_confirmed" BOOLEAN DEFAULT false,
  "participation_validated" BOOLEAN DEFAULT false,
  "last_validation_check" timestamp NULL DEFAULT NULL,
  "validation_warnings" INTEGER DEFAULT 0,
  "match_date" TIMESTAMP NOT NULL,
  "duration_minutes" INTEGER DEFAULT 90,
  "match_type" TEXT DEFAULT 'friendly',
  "status" TEXT DEFAULT 'pending',
  "home_score" INTEGER DEFAULT 0,
  "away_score" INTEGER DEFAULT 0,
  "referee_contact" varchar(255) DEFAULT NULL,
  "has_referee" BOOLEAN DEFAULT false,
  "referee_verified" BOOLEAN DEFAULT false,
  "referee_verified_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  "referee_notes" text DEFAULT NULL,
  "notes" text DEFAULT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  "home_captain_validated" BOOLEAN DEFAULT false,
  "away_captain_validated" BOOLEAN DEFAULT false,
  "home_captain_validated_at" timestamp NULL DEFAULT NULL,
  "away_captain_validated_at" timestamp NULL DEFAULT NULL,
  "is_disputed" BOOLEAN DEFAULT false,
  "dispute_reason" text DEFAULT NULL,
  "dispute_opened_at" timestamp NULL DEFAULT NULL,
  "dispute_opened_by" INTEGER DEFAULT NULL,
  "referee_id" INTEGER DEFAULT NULL,
  "is_referee_verified" BOOLEAN DEFAULT false,
  "started_at" timestamp NULL DEFAULT NULL,
  "completed_at" timestamp NULL DEFAULT NULL,
  "started_by_referee" BOOLEAN DEFAULT false,
  "referee_validation_notes" text DEFAULT NULL,
  "referee_validated_at" timestamp NULL DEFAULT NULL,
  "referee_validated_by" INTEGER DEFAULT NULL
);

CREATE INDEX "matches_home_team_id" ON "matches" ("home_team_id");
CREATE INDEX "matches_away_team_id" ON "matches" ("away_team_id");
CREATE INDEX "matches_location_id" ON "matches" ("location_id");
CREATE INDEX "matches_idx_match_date" ON "matches" ("match_date");
CREATE INDEX "matches_idx_status" ON "matches" ("status");
CREATE INDEX "matches_fk_match_dispute_user" ON "matches" ("dispute_opened_by");
CREATE INDEX "matches_fk_match_referee" ON "matches" ("referee_id");
CREATE INDEX "matches_idx_match_validation_status" ON "matches" ("home_captain_validated","away_captain_validated");
CREATE INDEX "matches_idx_has_referee" ON "matches" ("has_referee");
CREATE INDEX "matches_idx_referee_verified" ON "matches" ("referee_verified");
CREATE INDEX "matches_idx_venue_booking" ON "matches" ("venue_booking_id");
CREATE INDEX "matches_idx_status_match_date" ON "matches" ("status","match_date");
CREATE INDEX "matches_idx_started_at" ON "matches" ("started_at");
CREATE INDEX "matches_idx_completed_at" ON "matches" ("completed_at");
CREATE INDEX "matches_idx_referee_validated_at" ON "matches" ("referee_validated_at");

CREATE TABLE "message_attachments" (
  "id" SERIAL PRIMARY KEY,
  "message_id" INTEGER NOT NULL,
  "upload_id" INTEGER NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "message_attachments_idx_message" ON "message_attachments" ("message_id");
CREATE INDEX "message_attachments_idx_upload" ON "message_attachments" ("upload_id");

CREATE TABLE "messages" (
  "id" SERIAL PRIMARY KEY,
  "match_id" INTEGER NOT NULL,
  "sender_id" INTEGER NOT NULL,
  "content" text NOT NULL,
  "message_type" TEXT DEFAULT 'text',
  "is_read" BOOLEAN DEFAULT false,
  "sent_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "messages_sender_id" ON "messages" ("sender_id");
CREATE INDEX "messages_idx_match_date" ON "messages" ("match_id","sent_at");

CREATE TABLE "notifications" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "title" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "type" TEXT NOT NULL,
  "related_id" INTEGER DEFAULT NULL,
  "is_read" BOOLEAN DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "notifications_idx_user_read" ON "notifications" ("user_id","is_read");
CREATE INDEX "notifications_idx_created" ON "notifications" ("created_at");

CREATE TABLE "password_reset_tokens" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "token" varchar(255) NOT NULL,
  "expires_at" TIMESTAMP NOT NULL,
  "used" BOOLEAN DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_reset_tokens_token" UNIQUE ("token")
);

CREATE INDEX "password_reset_tokens_idx_token" ON "password_reset_tokens" ("token");
CREATE INDEX "password_reset_tokens_idx_user_id" ON "password_reset_tokens" ("user_id");
CREATE INDEX "password_reset_tokens_idx_expires_at" ON "password_reset_tokens" ("expires_at");

CREATE TABLE "player_card_statistics" (
  "id" SERIAL PRIMARY KEY,
  "player_id" INTEGER NOT NULL,
  "team_id" INTEGER NOT NULL,
  "season" varchar(20) DEFAULT '2024-2025',
  "yellow_cards" INTEGER DEFAULT 0,
  "red_cards" INTEGER DEFAULT 0,
  "total_matches_played" INTEGER DEFAULT 0,
  "last_card_date" timestamp NULL DEFAULT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  CONSTRAINT "player_card_statistics_unique_player_team_season" UNIQUE ("player_id","team_id","season")
);

CREATE INDEX "player_card_statistics_idx_player_cards" ON "player_card_statistics" ("player_id");
CREATE INDEX "player_card_statistics_idx_team_cards" ON "player_card_statistics" ("team_id");
CREATE INDEX "player_card_statistics_idx_season" ON "player_card_statistics" ("season");

CREATE TABLE "player_invitations" (
  "id" SERIAL PRIMARY KEY,
  "team_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "invited_email" varchar(100) DEFAULT NULL,
  "invited_name" varchar(100) DEFAULT NULL,
  "invited_by" INTEGER NOT NULL,
  "status" TEXT DEFAULT 'pending',
  "message" text DEFAULT NULL,
  "invitation_token" varchar(64) DEFAULT NULL,
  "token_expires_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  "sent_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "responded_at" timestamp NULL DEFAULT NULL,
  "response_message" text DEFAULT NULL,
  "expires_at" timestamp NULL DEFAULT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  CONSTRAINT "player_invitations_unique_team_user_status" UNIQUE ("team_id","user_id","status")
);

CREATE INDEX "player_invitations_idx_user_status" ON "player_invitations" ("user_id","status");
CREATE INDEX "player_invitations_idx_team_status" ON "player_invitations" ("team_id","status");
CREATE INDEX "player_invitations_idx_invited_by" ON "player_invitations" ("invited_by");
CREATE INDEX "player_invitations_idx_expires_at" ON "player_invitations" ("expires_at");
CREATE INDEX "player_invitations_idx_team_user_status" ON "player_invitations" ("team_id","user_id","status");
CREATE INDEX "player_invitations_idx_email" ON "player_invitations" ("invited_email");
CREATE INDEX "player_invitations_idx_token" ON "player_invitations" ("invitation_token");

CREATE TABLE "player_match_ratings" (
  "id" SERIAL PRIMARY KEY,
  "match_id" INTEGER NOT NULL,
  "player_id" INTEGER NOT NULL,
  "team_id" INTEGER NOT NULL,
  "rated_by" INTEGER NOT NULL,
  "rating" INTEGER NOT NULL,
  "notes" text DEFAULT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "player_match_ratings_unique_player_match_rating" UNIQUE ("match_id","player_id"),
  CONSTRAINT "chk_rating_range" CHECK ("rating" between 1 and 10)
);

CREATE INDEX "player_match_ratings_idx_match_ratings" ON "player_match_ratings" ("match_id");
CREATE INDEX "player_match_ratings_idx_player_ratings" ON "player_match_ratings" ("player_id");
CREATE INDEX "player_match_ratings_team_id" ON "player_match_ratings" ("team_id");
CREATE INDEX "player_match_ratings_rated_by" ON "player_match_ratings" ("rated_by");

CREATE TABLE "player_match_statistics" (
  "id" SERIAL PRIMARY KEY,
  "match_id" INTEGER NOT NULL,
  "player_id" INTEGER NOT NULL,
  "team_id" INTEGER NOT NULL,
  "goals" INTEGER DEFAULT 0,
  "assists" INTEGER DEFAULT 0,
  "minutes_played" INTEGER DEFAULT 0,
  "yellow_cards" INTEGER DEFAULT 0,
  "red_cards" INTEGER DEFAULT 0,
  "participated" BOOLEAN DEFAULT true,
  "was_starter" BOOLEAN DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  CONSTRAINT "player_match_statistics_unique_player_match" UNIQUE ("match_id","player_id")
);

CREATE INDEX "player_match_statistics_idx_player_stats" ON "player_match_statistics" ("player_id");
CREATE INDEX "player_match_statistics_idx_team_match" ON "player_match_statistics" ("team_id","match_id");

CREATE TABLE "player_season_statistics" (
  "id" SERIAL PRIMARY KEY,
  "player_id" INTEGER NOT NULL,
  "team_id" INTEGER NOT NULL,
  "season" varchar(20) DEFAULT '2024-2025',
  "matches_played" INTEGER DEFAULT 0,
  "goals" INTEGER DEFAULT 0,
  "assists" INTEGER DEFAULT 0,
  "minutes_played" INTEGER DEFAULT 0,
  "yellow_cards" INTEGER DEFAULT 0,
  "red_cards" INTEGER DEFAULT 0,
  "average_goals" decimal(4,2) GENERATED ALWAYS AS (case when "matches_played" > 0 then "goals" / "matches_played" else 0 end) STORED,
  "average_minutes" decimal(5,1) GENERATED ALWAYS AS (case when "matches_played" > 0 then "minutes_played" / "matches_played" else 0 end) STORED,
  "last_updated" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  CONSTRAINT "player_season_statistics_unique_player_team_season" UNIQUE ("player_id","team_id","season")
);

CREATE INDEX "player_season_statistics_team_id" ON "player_season_statistics" ("team_id");
CREATE INDEX "player_season_statistics_idx_player_season" ON "player_season_statistics" ("player_id","season");
CREATE INDEX "player_season_statistics_idx_goals" ON "player_season_statistics" ("goals");
CREATE INDEX "player_season_statistics_idx_assists" ON "player_season_statistics" ("assists");

CREATE TABLE "post_media" (
  "id" SERIAL PRIMARY KEY,
  "post_id" INTEGER NOT NULL,
  "upload_id" INTEGER NOT NULL,
  "media_order" INTEGER DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "post_media_idx_post" ON "post_media" ("post_id");
CREATE INDEX "post_media_idx_upload" ON "post_media" ("upload_id");

CREATE TABLE "ratings" (
  "id" SERIAL PRIMARY KEY,
  "match_id" INTEGER NOT NULL,
  "rater_team_id" INTEGER NOT NULL,
  "rated_team_id" INTEGER NOT NULL,
  "fair_play_score" SMALLINT NOT NULL CHECK ("fair_play_score" between 1 and 5),
  "organization_score" SMALLINT NOT NULL CHECK ("organization_score" between 1 and 5),
  "punctuality_score" SMALLINT NOT NULL CHECK ("punctuality_score" between 1 and 5),
  "overall_score" decimal(2,1) GENERATED ALWAYS AS (("fair_play_score" + "organization_score" + "punctuality_score") / 3) STORED,
  "comment" text DEFAULT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ratings_unique_match_rating" UNIQUE ("match_id","rater_team_id","rated_team_id")
);

CREATE INDEX "ratings_rater_team_id" ON "ratings" ("rater_team_id");
CREATE INDEX "ratings_rated_team_id" ON "ratings" ("rated_team_id");

CREATE TABLE "referee_availability" (
  "id" SERIAL PRIMARY KEY,
  "referee_id" INTEGER NOT NULL,
  "date" date NOT NULL,
  "start_time" time DEFAULT NULL,
  "end_time" time DEFAULT NULL,
  "is_available" BOOLEAN DEFAULT true,
  "reason" varchar(255) DEFAULT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "referee_availability_unique_referee_date" UNIQUE ("referee_id","date")
);

CREATE INDEX "referee_availability_idx_referee_date" ON "referee_availability" ("referee_id","date");
CREATE INDEX "referee_availability_idx_date_availability" ON "referee_availability" ("date","is_available");
CREATE INDEX "referee_availability_idx_referee_availability_date" ON "referee_availability" ("referee_id","date","is_available");

CREATE TABLE "referee_certifications" (
  "id" SERIAL PRIMARY KEY,
  "referee_id" INTEGER NOT NULL,
  "certification_name" varchar(100) NOT NULL,
  "certification_type" TEXT NOT NULL,
  "issuing_organization" varchar(100) DEFAULT NULL,
  "issue_date" date DEFAULT NULL,
  "expiry_date" date DEFAULT NULL,
  "certificate_number" varchar(50) DEFAULT NULL,
  "document_id" INTEGER DEFAULT NULL,
  "is_verified" BOOLEAN DEFAULT false,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "referee_certifications_document_id" ON "referee_certifications" ("document_id");
CREATE INDEX "referee_certifications_idx_referee_certifications" ON "referee_certifications" ("referee_id","is_active");
CREATE INDEX "referee_certifications_idx_expiry_date" ON "referee_certifications" ("expiry_date");

CREATE TABLE "referee_ratings" (
  "id" SERIAL PRIMARY KEY,
  "referee_id" INTEGER NOT NULL,
  "match_id" INTEGER NOT NULL,
  "assignment_id" INTEGER NOT NULL,
  "rated_by" INTEGER NOT NULL,
  "team_id" INTEGER NOT NULL,
  "rating" INTEGER NOT NULL CHECK ("rating" between 1 and 5),
  "fairness_rating" INTEGER DEFAULT NULL CHECK ("fairness_rating" between 1 and 5),
  "communication_rating" INTEGER DEFAULT NULL CHECK ("communication_rating" between 1 and 5),
  "professionalism_rating" INTEGER DEFAULT NULL CHECK ("professionalism_rating" between 1 and 5),
  "comment" text DEFAULT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "referee_ratings_unique_rating_per_team" UNIQUE ("assignment_id","team_id")
);

CREATE INDEX "referee_ratings_rated_by" ON "referee_ratings" ("rated_by");
CREATE INDEX "referee_ratings_team_id" ON "referee_ratings" ("team_id");
CREATE INDEX "referee_ratings_idx_referee_ratings" ON "referee_ratings" ("referee_id","rating");
CREATE INDEX "referee_ratings_idx_match_ratings" ON "referee_ratings" ("match_id");

CREATE TABLE "referees" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER DEFAULT NULL,
  "first_name" varchar(50) NOT NULL,
  "last_name" varchar(50) NOT NULL,
  "email" varchar(100) DEFAULT NULL,
  "phone" varchar(20) DEFAULT NULL,
  "license_number" varchar(50) DEFAULT NULL,
  "license_level" TEXT DEFAULT 'regional',
  "experience_years" INTEGER DEFAULT 0,
  "bio" text DEFAULT NULL,
  "specializations" JSONB DEFAULT NULL,
  "languages" JSONB DEFAULT NULL,
  "location_city" varchar(100) DEFAULT NULL,
  "location_lat" decimal(10,8) DEFAULT NULL,
  "location_lng" decimal(11,8) DEFAULT NULL,
  "max_travel_distance" INTEGER DEFAULT 50,
  "profile_picture_id" INTEGER DEFAULT NULL,
  "rating" decimal(3,2) DEFAULT 0.00,
  "total_ratings" INTEGER DEFAULT 0,
  "total_matches" INTEGER DEFAULT 0,
  "hourly_rate" decimal(10,2) DEFAULT NULL,
  "currency" varchar(3) DEFAULT 'EUR',
  "is_available" BOOLEAN DEFAULT true,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  CONSTRAINT "referees_email" UNIQUE ("email"),
  CONSTRAINT "referees_license_number" UNIQUE ("license_number")
);

CREATE INDEX "referees_user_id" ON "referees" ("user_id");
CREATE INDEX "referees_profile_picture_id" ON "referees" ("profile_picture_id");
CREATE INDEX "referees_idx_license_level" ON "referees" ("license_level");
CREATE INDEX "referees_idx_location" ON "referees" ("location_city","location_lat","location_lng");
CREATE INDEX "referees_idx_availability" ON "referees" ("is_available","is_active");
CREATE INDEX "referees_idx_rating" ON "referees" ("rating");

CREATE TABLE "reports" (
  "id" SERIAL PRIMARY KEY,
  "reporter_id" INTEGER NOT NULL,
  "reported_type" TEXT NOT NULL,
  "reported_id" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "description" text NOT NULL,
  "status" TEXT DEFAULT 'pending',
  "priority" TEXT DEFAULT 'medium',
  "assigned_to" INTEGER DEFAULT NULL,
  "resolution_notes" text DEFAULT NULL,
  "resolved_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "reports_reporter_id" ON "reports" ("reporter_id");
CREATE INDEX "reports_assigned_to" ON "reports" ("assigned_to");
CREATE INDEX "reports_idx_status" ON "reports" ("status");
CREATE INDEX "reports_idx_reported" ON "reports" ("reported_type","reported_id");
CREATE INDEX "reports_idx_priority" ON "reports" ("priority");

CREATE TABLE "system_settings" (
  "id" SERIAL PRIMARY KEY,
  "setting_key" varchar(100) NOT NULL,
  "setting_value" text DEFAULT NULL,
  "setting_type" TEXT DEFAULT 'string',
  "description" text DEFAULT NULL,
  "is_public" BOOLEAN DEFAULT false,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  "updated_by" INTEGER DEFAULT NULL,
  CONSTRAINT "system_settings_setting_key" UNIQUE ("setting_key")
);

CREATE INDEX "system_settings_updated_by" ON "system_settings" ("updated_by");
CREATE INDEX "system_settings_idx_key" ON "system_settings" ("setting_key");
CREATE INDEX "system_settings_idx_public" ON "system_settings" ("is_public");

CREATE TABLE "team_availability" (
  "id" SERIAL PRIMARY KEY,
  "team_id" INTEGER NOT NULL,
  "day_of_week" SMALLINT NOT NULL,
  "start_time" time NOT NULL,
  "end_time" time NOT NULL,
  "is_recurring" BOOLEAN DEFAULT true,
  "specific_date" date DEFAULT NULL,
  "notes" varchar(255) DEFAULT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "team_availability_idx_team_day" ON "team_availability" ("team_id","day_of_week");

CREATE TABLE "team_followers" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "team_id" INTEGER NOT NULL,
  "followed_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "team_followers_unique_follower" UNIQUE ("user_id","team_id")
);

CREATE INDEX "team_followers_idx_user_id" ON "team_followers" ("user_id");
CREATE INDEX "team_followers_idx_team_id" ON "team_followers" ("team_id");

CREATE TABLE "team_gallery" (
  "id" SERIAL PRIMARY KEY,
  "team_id" INTEGER NOT NULL,
  "upload_id" INTEGER NOT NULL,
  "album" varchar(50) DEFAULT 'general',
  "caption" text DEFAULT NULL,
  "photo_type" TEXT DEFAULT 'team',
  "is_cover" BOOLEAN DEFAULT false,
  "display_order" INTEGER DEFAULT 0,
  "is_featured" BOOLEAN DEFAULT false,
  "uploaded_by" INTEGER NOT NULL,
  "uploaded_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP 
);

CREATE INDEX "team_gallery_fk_team_gallery_upload" ON "team_gallery" ("upload_id");
CREATE INDEX "team_gallery_idx_team_active" ON "team_gallery" ("team_id","is_active");
CREATE INDEX "team_gallery_idx_photo_type" ON "team_gallery" ("photo_type");
CREATE INDEX "team_gallery_idx_display_order" ON "team_gallery" ("team_id","display_order");
CREATE INDEX "team_gallery_idx_uploaded_by" ON "team_gallery" ("uploaded_by");
CREATE INDEX "team_gallery_idx_gallery_team_album" ON "team_gallery" ("team_id","album");
CREATE INDEX "team_gallery_idx_gallery_featured" ON "team_gallery" ("team_id","is_featured");
CREATE INDEX "team_gallery_idx_gallery_created_at" ON "team_gallery" ("created_at");

CREATE TABLE "team_match_validations" (
  "id" SERIAL PRIMARY KEY,
  "team_id" INTEGER NOT NULL,
  "match_id" INTEGER DEFAULT NULL,
  "invitation_id" INTEGER DEFAULT NULL,
  "validation_type" TEXT NOT NULL,
  "players_count" INTEGER NOT NULL,
  "minimum_required" INTEGER DEFAULT 6,
  "is_valid" BOOLEAN NOT NULL,
  "validated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validated_by" INTEGER DEFAULT NULL
);

CREATE INDEX "team_match_validations_invitation_id" ON "team_match_validations" ("invitation_id");
CREATE INDEX "team_match_validations_validated_by" ON "team_match_validations" ("validated_by");
CREATE INDEX "team_match_validations_idx_team_validation" ON "team_match_validations" ("team_id","validation_type");
CREATE INDEX "team_match_validations_idx_match_validation" ON "team_match_validations" ("match_id");

CREATE TABLE "team_members" (
  "id" SERIAL PRIMARY KEY,
  "team_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "role" TEXT DEFAULT 'player',
  "joined_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "is_active" BOOLEAN DEFAULT true,
  "jersey_number" INTEGER DEFAULT NULL,
  "is_captain" BOOLEAN DEFAULT false,
  CONSTRAINT "team_members_unique_team_user" UNIQUE ("team_id","user_id"),
  CONSTRAINT "team_members_unique_team_jersey" UNIQUE ("team_id","jersey_number"),
  CONSTRAINT "chk_jersey_number" CHECK ("jersey_number" between 1 and 99)
);

CREATE INDEX "team_members_user_id" ON "team_members" ("user_id");

CREATE TABLE "team_season_statistics" (
  "id" SERIAL PRIMARY KEY,
  "team_id" INTEGER NOT NULL,
  "season" varchar(20) DEFAULT '2024-2025',
  "matches_played" INTEGER DEFAULT 0,
  "matches_won" INTEGER DEFAULT 0,
  "matches_drawn" INTEGER DEFAULT 0,
  "matches_lost" INTEGER DEFAULT 0,
  "goals_for" INTEGER DEFAULT 0,
  "goals_against" INTEGER DEFAULT 0,
  "goal_difference" INTEGER GENERATED ALWAYS AS ("goals_for" - "goals_against") STORED,
  "clean_sheets" INTEGER DEFAULT 0,
  "points" INTEGER GENERATED ALWAYS AS ("matches_won" * 3 + "matches_drawn") STORED,
  "last_updated" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  CONSTRAINT "team_season_statistics_unique_team_season" UNIQUE ("team_id","season")
);

CREATE INDEX "team_season_statistics_idx_season" ON "team_season_statistics" ("season");
CREATE INDEX "team_season_statistics_idx_points" ON "team_season_statistics" ("points");

CREATE TABLE "team_stats" (
  "id" SERIAL PRIMARY KEY,
  "team_id" INTEGER NOT NULL,
  "matches_played" INTEGER DEFAULT 0,
  "matches_won" INTEGER DEFAULT 0,
  "matches_drawn" INTEGER DEFAULT 0,
  "matches_lost" INTEGER DEFAULT 0,
  "goals_scored" INTEGER DEFAULT 0,
  "goals_conceded" INTEGER DEFAULT 0,
  "average_rating" decimal(3,2) DEFAULT 0.00,
  "last_updated" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  CONSTRAINT "team_stats_unique_team" UNIQUE ("team_id")
);

CREATE TABLE "teams" (
  "id" SERIAL PRIMARY KEY,
  "name" varchar(150) NOT NULL,
  "description" text DEFAULT NULL,
  "logo" varchar(255) DEFAULT NULL,
  "captain_id" INTEGER NOT NULL,
  "skill_level" TEXT DEFAULT 'amateur',
  "max_players" INTEGER DEFAULT 15,
  "location_city" varchar(100) DEFAULT NULL,
  "location_lat" decimal(10,8) DEFAULT NULL,
  "location_lng" decimal(11,8) DEFAULT NULL,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  "logo_id" INTEGER DEFAULT NULL,
  "banner_id" INTEGER DEFAULT NULL,
  "banner_position" varchar(20) DEFAULT 'center',
  "mercato_actif" BOOLEAN DEFAULT true
);

CREATE INDEX "teams_captain_id" ON "teams" ("captain_id");
CREATE INDEX "teams_idx_location" ON "teams" ("location_lat","location_lng");
CREATE INDEX "teams_idx_skill_level" ON "teams" ("skill_level");
CREATE INDEX "teams_logo_id" ON "teams" ("logo_id");
CREATE INDEX "teams_idx_teams_banner" ON "teams" ("banner_id");
CREATE INDEX "teams_idx_teams_mercato_actif" ON "teams" ("mercato_actif");

CREATE TABLE "uploads" (
  "id" SERIAL PRIMARY KEY,
  "original_filename" varchar(255) NOT NULL,
  "stored_filename" varchar(255) NOT NULL,
  "file_path" varchar(500) NOT NULL,
  "mime_type" varchar(100) NOT NULL,
  "file_size" INTEGER NOT NULL,
  "file_extension" varchar(10) NOT NULL,
  "file_type" TEXT NOT NULL,
  "upload_context" TEXT NOT NULL DEFAULT 'other',
  "uploaded_by" INTEGER NOT NULL,
  "related_entity_type" TEXT DEFAULT NULL,
  "related_entity_id" INTEGER DEFAULT NULL,
  "image_width" INTEGER DEFAULT NULL,
  "image_height" INTEGER DEFAULT NULL,
  "is_public" BOOLEAN DEFAULT false,
  "is_active" BOOLEAN DEFAULT true,
  "uploaded_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "variants" TEXT DEFAULT NULL ,
  "processed_at" timestamp NULL DEFAULT NULL,
  "optimization_score" decimal(3,2) DEFAULT NULL,
  CONSTRAINT "uploads_stored_filename" UNIQUE ("stored_filename")
);

CREATE INDEX "uploads_idx_uploaded_by" ON "uploads" ("uploaded_by");
CREATE INDEX "uploads_idx_context" ON "uploads" ("upload_context");
CREATE INDEX "uploads_idx_entity" ON "uploads" ("related_entity_type","related_entity_id");
CREATE INDEX "uploads_idx_file_type" ON "uploads" ("file_type");
CREATE INDEX "uploads_idx_uploaded_at" ON "uploads" ("uploaded_at");
CREATE INDEX "uploads_idx_uploads_context" ON "uploads" ("upload_context","related_entity_type","related_entity_id");

CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "email" varchar(255) NOT NULL,
  "password" varchar(255) NOT NULL,
  "first_name" varchar(100) NOT NULL,
  "last_name" varchar(100) NOT NULL,
  "phone" varchar(20) DEFAULT NULL,
  "birth_date" date DEFAULT NULL,
  "bio" text DEFAULT NULL,
  "profile_picture" varchar(255) DEFAULT NULL,
  "position" varchar(50) DEFAULT NULL,
  "skill_level" varchar(50) DEFAULT NULL,
  "location_city" varchar(100) DEFAULT NULL,
  "location_lat" decimal(10,8) DEFAULT NULL,
  "location_lng" decimal(11,8) DEFAULT NULL,
  "is_active" BOOLEAN DEFAULT true,
  "email_verified" BOOLEAN DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  "profile_picture_id" INTEGER DEFAULT NULL,
  "cover_photo_id" INTEGER DEFAULT NULL,
  "user_type" TEXT DEFAULT 'player',
  "is_verified" BOOLEAN DEFAULT false,
  "verification_token" varchar(255) DEFAULT NULL,
  "verification_token_expires_at" TIMESTAMP DEFAULT NULL,
  "average_rating" decimal(3,2) DEFAULT NULL,
  "total_ratings" INTEGER DEFAULT 0,
  CONSTRAINT "users_email" UNIQUE ("email")
);

CREATE INDEX "users_profile_picture_id" ON "users" ("profile_picture_id");
CREATE INDEX "users_cover_photo_id" ON "users" ("cover_photo_id");

CREATE TABLE "venue_availability" (
  "id" SERIAL PRIMARY KEY,
  "venue_id" INTEGER NOT NULL,
  "day_of_week" TEXT NOT NULL,
  "opening_time" time NOT NULL,
  "closing_time" time NOT NULL,
  "is_closed" BOOLEAN DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP 
);

CREATE INDEX "venue_availability_idx_venue_day" ON "venue_availability" ("venue_id","day_of_week");

CREATE TABLE "venue_bookings" (
  "id" SERIAL PRIMARY KEY,
  "location_id" INTEGER NOT NULL,
  "match_id" INTEGER DEFAULT NULL,
  "team_id" INTEGER NOT NULL,
  "booked_by" INTEGER NOT NULL,
  "booking_date" date NOT NULL,
  "start_time" time NOT NULL,
  "end_time" time NOT NULL,
  "duration_minutes" INTEGER NOT NULL,
  "game_type" TEXT NOT NULL,
  "status" TEXT DEFAULT 'pending',
  "base_price" decimal(10,2) NOT NULL,
  "discount_applied" decimal(10,2) DEFAULT 0.00,
  "final_price" decimal(10,2) NOT NULL,
  "payment_status" TEXT DEFAULT 'pending',
  "payment_method" varchar(50) DEFAULT NULL,
  "paid_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  "notes" text DEFAULT NULL,
  "cancellation_reason" text DEFAULT NULL,
  "cancelled_at" timestamp NULL DEFAULT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  "owner_response_message" text DEFAULT NULL,
  "owner_responded_at" timestamp NULL DEFAULT NULL,
  "manager_confirmed_at" timestamp NULL DEFAULT NULL,
  "manager_confirmed_by" INTEGER DEFAULT NULL
);

CREATE INDEX "venue_bookings_booked_by" ON "venue_bookings" ("booked_by");
CREATE INDEX "venue_bookings_idx_location_date" ON "venue_bookings" ("location_id","booking_date");
CREATE INDEX "venue_bookings_idx_location_status" ON "venue_bookings" ("location_id","status");
CREATE INDEX "venue_bookings_idx_team_bookings" ON "venue_bookings" ("team_id","status");
CREATE INDEX "venue_bookings_idx_match_booking" ON "venue_bookings" ("match_id");
CREATE INDEX "venue_bookings_idx_booking_datetime" ON "venue_bookings" ("location_id","booking_date","start_time","end_time");
CREATE INDEX "venue_bookings_idx_venue_bookings_owner_responded" ON "venue_bookings" ("owner_responded_at");
CREATE INDEX "venue_bookings_fk_manager_confirmed_by" ON "venue_bookings" ("manager_confirmed_by");
CREATE INDEX "venue_bookings_idx_venue_bookings_availability" ON "venue_bookings" ("location_id","booking_date","status");

CREATE TABLE "venue_closures" (
  "id" SERIAL PRIMARY KEY,
  "venue_id" INTEGER NOT NULL,
  "closure_date" date NOT NULL,
  "closure_reason" varchar(255) DEFAULT NULL,
  "is_full_day" BOOLEAN DEFAULT true,
  "start_time" time DEFAULT NULL,
  "end_time" time DEFAULT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "venue_closures_idx_venue_date" ON "venue_closures" ("venue_id","closure_date");

CREATE TABLE "venue_owner_notifications" (
  "id" SERIAL PRIMARY KEY,
  "owner_id" INTEGER NOT NULL,
  "venue_id" INTEGER NOT NULL,
  "booking_id" INTEGER DEFAULT NULL,
  "notification_type" TEXT NOT NULL,
  "message" text NOT NULL,
  "is_read" BOOLEAN DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "venue_owner_notifications_venue_id" ON "venue_owner_notifications" ("venue_id");
CREATE INDEX "venue_owner_notifications_booking_id" ON "venue_owner_notifications" ("booking_id");
CREATE INDEX "venue_owner_notifications_idx_owner_unread" ON "venue_owner_notifications" ("owner_id","is_read");
CREATE INDEX "venue_owner_notifications_idx_created" ON "venue_owner_notifications" ("created_at");

CREATE TABLE "venue_partnerships" (
  "id" SERIAL PRIMARY KEY,
  "location_id" INTEGER NOT NULL,
  "partnership_type" TEXT NOT NULL,
  "discount_percentage" decimal(5,2) NOT NULL,
  "start_date" date NOT NULL,
  "end_date" date DEFAULT NULL,
  "terms" text DEFAULT NULL,
  "benefits" JSONB DEFAULT NULL,
  "contact_person" varchar(100) DEFAULT NULL,
  "contact_email" varchar(100) DEFAULT NULL,
  "contact_phone" varchar(20) DEFAULT NULL,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP 
);

CREATE INDEX "venue_partnerships_idx_location_partnership" ON "venue_partnerships" ("location_id","is_active");
CREATE INDEX "venue_partnerships_idx_partnership_type" ON "venue_partnerships" ("partnership_type");
CREATE INDEX "venue_partnerships_idx_active_partnerships" ON "venue_partnerships" ("is_active","end_date");

CREATE TABLE "venue_pricing" (
  "id" SERIAL PRIMARY KEY,
  "location_id" INTEGER NOT NULL,
  "game_type" TEXT NOT NULL,
  "duration_minutes" INTEGER NOT NULL,
  "price" decimal(10,2) NOT NULL,
  "currency" varchar(3) DEFAULT 'EUR',
  "day_type" TEXT DEFAULT 'weekday',
  "time_slot" TEXT DEFAULT NULL,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,
  CONSTRAINT "venue_pricing_unique_pricing" UNIQUE ("location_id","game_type","duration_minutes","day_type","time_slot")
);

CREATE INDEX "venue_pricing_idx_location_game_type" ON "venue_pricing" ("location_id","game_type");
CREATE INDEX "venue_pricing_idx_location_active" ON "venue_pricing" ("location_id","is_active");

CREATE TABLE "venue_ratings" (
  "id" SERIAL PRIMARY KEY,
  "location_id" INTEGER NOT NULL,
  "booking_id" INTEGER DEFAULT NULL,
  "user_id" INTEGER NOT NULL,
  "rating" INTEGER NOT NULL CHECK ("rating" between 1 and 5),
  "field_condition_rating" INTEGER DEFAULT NULL CHECK ("field_condition_rating" between 1 and 5),
  "facilities_rating" INTEGER DEFAULT NULL CHECK ("facilities_rating" between 1 and 5),
  "service_rating" INTEGER DEFAULT NULL CHECK ("service_rating" between 1 and 5),
  "comment" text DEFAULT NULL,
  "photos" JSONB DEFAULT NULL,
  "is_verified" BOOLEAN DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "venue_ratings_unique_user_booking_rating" UNIQUE ("user_id","booking_id")
);

CREATE INDEX "venue_ratings_booking_id" ON "venue_ratings" ("booking_id");
CREATE INDEX "venue_ratings_idx_location_ratings" ON "venue_ratings" ("location_id","rating");
CREATE INDEX "venue_ratings_idx_verified_ratings" ON "venue_ratings" ("location_id","is_verified");

CREATE TABLE "venue_revenue_tracking" (
  "id" SERIAL PRIMARY KEY,
  "venue_id" INTEGER NOT NULL,
  "booking_id" INTEGER NOT NULL,
  "amount" decimal(10,2) NOT NULL,
  "platform_fee" decimal(10,2) DEFAULT 0.00,
  "net_amount" decimal(10,2) NOT NULL,
  "revenue_date" date NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "venue_revenue_tracking_booking_id" ON "venue_revenue_tracking" ("booking_id");
CREATE INDEX "venue_revenue_tracking_idx_venue_date" ON "venue_revenue_tracking" ("venue_id","revenue_date");
CREATE INDEX "venue_revenue_tracking_idx_revenue_date" ON "venue_revenue_tracking" ("revenue_date");

-- Foreign Keys
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_ibfk_1" FOREIGN KEY ("admin_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "bans" ADD CONSTRAINT "bans_ibfk_1" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "bans" ADD CONSTRAINT "bans_ibfk_2" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE;
ALTER TABLE "bans" ADD CONSTRAINT "bans_ibfk_3" FOREIGN KEY ("banned_by") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "feed_comments" ADD CONSTRAINT "feed_comments_ibfk_1" FOREIGN KEY ("post_id") REFERENCES "feed_posts" ("id") ON DELETE CASCADE;
ALTER TABLE "feed_comments" ADD CONSTRAINT "feed_comments_ibfk_2" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "feed_comments" ADD CONSTRAINT "feed_comments_ibfk_3" FOREIGN KEY ("parent_comment_id") REFERENCES "feed_comments" ("id") ON DELETE CASCADE;
ALTER TABLE "feed_likes" ADD CONSTRAINT "feed_likes_ibfk_1" FOREIGN KEY ("post_id") REFERENCES "feed_posts" ("id") ON DELETE CASCADE;
ALTER TABLE "feed_likes" ADD CONSTRAINT "feed_likes_ibfk_2" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "feed_post_hashtags" ADD CONSTRAINT "feed_post_hashtags_ibfk_1" FOREIGN KEY ("post_id") REFERENCES "feed_posts" ("id") ON DELETE CASCADE;
ALTER TABLE "feed_post_hashtags" ADD CONSTRAINT "feed_post_hashtags_ibfk_2" FOREIGN KEY ("hashtag_id") REFERENCES "feed_hashtags" ("id") ON DELETE CASCADE;
ALTER TABLE "feed_post_views" ADD CONSTRAINT "feed_post_views_ibfk_1" FOREIGN KEY ("post_id") REFERENCES "feed_posts" ("id") ON DELETE CASCADE;
ALTER TABLE "feed_post_views" ADD CONSTRAINT "feed_post_views_ibfk_2" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL;
ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_ibfk_1" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_ibfk_2" FOREIGN KEY ("match_id") REFERENCES "matches" ("id") ON DELETE SET NULL;
ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_ibfk_3" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE SET NULL;
ALTER TABLE "feed_reports" ADD CONSTRAINT "feed_reports_ibfk_1" FOREIGN KEY ("post_id") REFERENCES "feed_posts" ("id") ON DELETE CASCADE;
ALTER TABLE "feed_reports" ADD CONSTRAINT "feed_reports_ibfk_2" FOREIGN KEY ("comment_id") REFERENCES "feed_comments" ("id") ON DELETE CASCADE;
ALTER TABLE "feed_reports" ADD CONSTRAINT "feed_reports_ibfk_3" FOREIGN KEY ("reported_by") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "feed_reports" ADD CONSTRAINT "feed_reports_ibfk_4" FOREIGN KEY ("reviewed_by") REFERENCES "users" ("id") ON DELETE SET NULL;
ALTER TABLE "feed_shares" ADD CONSTRAINT "feed_shares_ibfk_1" FOREIGN KEY ("post_id") REFERENCES "feed_posts" ("id") ON DELETE CASCADE;
ALTER TABLE "feed_shares" ADD CONSTRAINT "feed_shares_ibfk_2" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "location_availability" ADD CONSTRAINT "location_availability_ibfk_1" FOREIGN KEY ("location_id") REFERENCES "locations" ("id") ON DELETE CASCADE;
ALTER TABLE "location_photos" ADD CONSTRAINT "location_photos_ibfk_1" FOREIGN KEY ("location_id") REFERENCES "locations" ("id") ON DELETE CASCADE;
ALTER TABLE "location_photos" ADD CONSTRAINT "location_photos_ibfk_2" FOREIGN KEY ("upload_id") REFERENCES "uploads" ("id") ON DELETE CASCADE;
ALTER TABLE "locations" ADD CONSTRAINT "locations_ibfk_1" FOREIGN KEY ("main_photo_id") REFERENCES "uploads" ("id") ON DELETE SET NULL;
ALTER TABLE "locations" ADD CONSTRAINT "locations_ibfk_2" FOREIGN KEY ("photo_id") REFERENCES "uploads" ("id") ON DELETE SET NULL;
ALTER TABLE "locations" ADD CONSTRAINT "locations_ibfk_3" FOREIGN KEY ("banner_id") REFERENCES "uploads" ("id") ON DELETE SET NULL;
ALTER TABLE "locations" ADD CONSTRAINT "locations_ibfk_4" FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE SET NULL;
ALTER TABLE "match_disputes" ADD CONSTRAINT "match_disputes_ibfk_1" FOREIGN KEY ("match_id") REFERENCES "matches" ("id") ON DELETE CASCADE;
ALTER TABLE "match_disputes" ADD CONSTRAINT "match_disputes_ibfk_2" FOREIGN KEY ("opened_by") REFERENCES "users" ("id");
ALTER TABLE "match_disputes" ADD CONSTRAINT "match_disputes_ibfk_3" FOREIGN KEY ("resolved_by") REFERENCES "users" ("id");
ALTER TABLE "match_goals" ADD CONSTRAINT "match_goals_ibfk_1" FOREIGN KEY ("match_id") REFERENCES "matches" ("id") ON DELETE CASCADE;
ALTER TABLE "match_goals" ADD CONSTRAINT "match_goals_ibfk_2" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE;
ALTER TABLE "match_goals" ADD CONSTRAINT "match_goals_ibfk_3" FOREIGN KEY ("scorer_id") REFERENCES "users" ("id") ON DELETE SET NULL;
ALTER TABLE "match_goals" ADD CONSTRAINT "match_goals_ibfk_4" FOREIGN KEY ("assister_id") REFERENCES "users" ("id") ON DELETE SET NULL;
ALTER TABLE "match_goals" ADD CONSTRAINT "match_goals_ibfk_5" FOREIGN KEY ("recorded_by") REFERENCES "users" ("id") ON DELETE SET NULL;
ALTER TABLE "match_incidents" ADD CONSTRAINT "match_incidents_ibfk_1" FOREIGN KEY ("match_id") REFERENCES "matches" ("id") ON DELETE CASCADE;
ALTER TABLE "match_incidents" ADD CONSTRAINT "match_incidents_ibfk_2" FOREIGN KEY ("referee_id") REFERENCES "referees" ("id") ON DELETE CASCADE;
ALTER TABLE "match_incidents" ADD CONSTRAINT "match_incidents_ibfk_3" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE;
ALTER TABLE "match_incidents" ADD CONSTRAINT "match_incidents_ibfk_4" FOREIGN KEY ("player_id") REFERENCES "users" ("id") ON DELETE SET NULL;
ALTER TABLE "match_invitations" ADD CONSTRAINT "match_invitations_ibfk_1" FOREIGN KEY ("sender_team_id") REFERENCES "teams" ("id") ON DELETE CASCADE;
ALTER TABLE "match_invitations" ADD CONSTRAINT "match_invitations_ibfk_2" FOREIGN KEY ("receiver_team_id") REFERENCES "teams" ("id") ON DELETE CASCADE;
ALTER TABLE "match_invitations" ADD CONSTRAINT "match_invitations_ibfk_3" FOREIGN KEY ("match_id") REFERENCES "matches" ("id") ON DELETE SET NULL;
ALTER TABLE "match_invitations" ADD CONSTRAINT "match_invitations_ibfk_4" FOREIGN KEY ("proposed_location_id") REFERENCES "locations" ("id") ON DELETE SET NULL;
ALTER TABLE "match_invitations" ADD CONSTRAINT "match_invitations_ibfk_5" FOREIGN KEY ("venue_id") REFERENCES "locations" ("id") ON DELETE SET NULL;
ALTER TABLE "match_invitations" ADD CONSTRAINT "match_invitations_ibfk_6" FOREIGN KEY ("preferred_referee_id") REFERENCES "referees" ("id") ON DELETE SET NULL;
ALTER TABLE "match_participations" ADD CONSTRAINT "match_participations_ibfk_1" FOREIGN KEY ("match_id") REFERENCES "matches" ("id") ON DELETE CASCADE;
ALTER TABLE "match_participations" ADD CONSTRAINT "match_participations_ibfk_2" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE;
ALTER TABLE "match_participations" ADD CONSTRAINT "match_participations_ibfk_3" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "match_photos" ADD CONSTRAINT "match_photos_ibfk_1" FOREIGN KEY ("match_id") REFERENCES "matches" ("id") ON DELETE CASCADE;
ALTER TABLE "match_photos" ADD CONSTRAINT "match_photos_ibfk_2" FOREIGN KEY ("upload_id") REFERENCES "uploads" ("id") ON DELETE CASCADE;
ALTER TABLE "match_photos" ADD CONSTRAINT "match_photos_ibfk_3" FOREIGN KEY ("uploaded_by") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "match_referee_assignments" ADD CONSTRAINT "match_referee_assignments_ibfk_1" FOREIGN KEY ("match_id") REFERENCES "matches" ("id") ON DELETE CASCADE;
ALTER TABLE "match_referee_assignments" ADD CONSTRAINT "match_referee_assignments_ibfk_2" FOREIGN KEY ("referee_id") REFERENCES "referees" ("id") ON DELETE CASCADE;
ALTER TABLE "match_referee_assignments" ADD CONSTRAINT "match_referee_assignments_ibfk_3" FOREIGN KEY ("assigned_by") REFERENCES "users" ("id") ON DELETE SET NULL;
ALTER TABLE "match_reports" ADD CONSTRAINT "match_reports_ibfk_1" FOREIGN KEY ("match_id") REFERENCES "matches" ("id") ON DELETE CASCADE;
ALTER TABLE "match_reports" ADD CONSTRAINT "match_reports_ibfk_2" FOREIGN KEY ("referee_id") REFERENCES "referees" ("id") ON DELETE CASCADE;
ALTER TABLE "match_statistics" ADD CONSTRAINT "match_statistics_ibfk_1" FOREIGN KEY ("match_id") REFERENCES "matches" ("id") ON DELETE CASCADE;
ALTER TABLE "match_statistics" ADD CONSTRAINT "match_statistics_ibfk_2" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE;
ALTER TABLE "match_validation_history" ADD CONSTRAINT "match_validation_history_ibfk_1" FOREIGN KEY ("match_id") REFERENCES "matches" ("id") ON DELETE CASCADE;
ALTER TABLE "match_validations" ADD CONSTRAINT "match_validations_ibfk_1" FOREIGN KEY ("match_id") REFERENCES "matches" ("id") ON DELETE CASCADE;
ALTER TABLE "match_validations" ADD CONSTRAINT "match_validations_ibfk_2" FOREIGN KEY ("validator_id") REFERENCES "users" ("id");
ALTER TABLE "matches" ADD CONSTRAINT "fk_match_dispute_user" FOREIGN KEY ("dispute_opened_by") REFERENCES "users" ("id");
ALTER TABLE "matches" ADD CONSTRAINT "fk_match_referee" FOREIGN KEY ("referee_id") REFERENCES "users" ("id");
ALTER TABLE "matches" ADD CONSTRAINT "matches_ibfk_1" FOREIGN KEY ("home_team_id") REFERENCES "teams" ("id") ON DELETE CASCADE;
ALTER TABLE "matches" ADD CONSTRAINT "matches_ibfk_2" FOREIGN KEY ("away_team_id") REFERENCES "teams" ("id") ON DELETE CASCADE;
ALTER TABLE "matches" ADD CONSTRAINT "matches_ibfk_3" FOREIGN KEY ("location_id") REFERENCES "locations" ("id") ON DELETE SET NULL;
ALTER TABLE "matches" ADD CONSTRAINT "matches_ibfk_4" FOREIGN KEY ("venue_booking_id") REFERENCES "venue_bookings" ("id") ON DELETE SET NULL;
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_ibfk_1" FOREIGN KEY ("message_id") REFERENCES "messages" ("id") ON DELETE CASCADE;
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_ibfk_2" FOREIGN KEY ("upload_id") REFERENCES "uploads" ("id") ON DELETE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_ibfk_1" FOREIGN KEY ("match_id") REFERENCES "matches" ("id") ON DELETE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_ibfk_2" FOREIGN KEY ("sender_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_ibfk_1" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_ibfk_1" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "player_card_statistics" ADD CONSTRAINT "player_card_statistics_ibfk_1" FOREIGN KEY ("player_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "player_card_statistics" ADD CONSTRAINT "player_card_statistics_ibfk_2" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE;
ALTER TABLE "player_invitations" ADD CONSTRAINT "player_invitations_ibfk_1" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE;
ALTER TABLE "player_invitations" ADD CONSTRAINT "player_invitations_ibfk_2" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "player_invitations" ADD CONSTRAINT "player_invitations_ibfk_3" FOREIGN KEY ("invited_by") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "player_match_ratings" ADD CONSTRAINT "player_match_ratings_ibfk_1" FOREIGN KEY ("match_id") REFERENCES "matches" ("id") ON DELETE CASCADE;
ALTER TABLE "player_match_ratings" ADD CONSTRAINT "player_match_ratings_ibfk_2" FOREIGN KEY ("player_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "player_match_ratings" ADD CONSTRAINT "player_match_ratings_ibfk_3" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE;
ALTER TABLE "player_match_ratings" ADD CONSTRAINT "player_match_ratings_ibfk_4" FOREIGN KEY ("rated_by") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "player_match_statistics" ADD CONSTRAINT "player_match_statistics_ibfk_1" FOREIGN KEY ("match_id") REFERENCES "matches" ("id") ON DELETE CASCADE;
ALTER TABLE "player_match_statistics" ADD CONSTRAINT "player_match_statistics_ibfk_2" FOREIGN KEY ("player_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "player_match_statistics" ADD CONSTRAINT "player_match_statistics_ibfk_3" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE;
ALTER TABLE "player_season_statistics" ADD CONSTRAINT "player_season_statistics_ibfk_1" FOREIGN KEY ("player_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "player_season_statistics" ADD CONSTRAINT "player_season_statistics_ibfk_2" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE;
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_ibfk_1" FOREIGN KEY ("post_id") REFERENCES "feed_posts" ("id") ON DELETE CASCADE;
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_ibfk_2" FOREIGN KEY ("upload_id") REFERENCES "uploads" ("id") ON DELETE CASCADE;
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_ibfk_1" FOREIGN KEY ("match_id") REFERENCES "matches" ("id") ON DELETE CASCADE;
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_ibfk_2" FOREIGN KEY ("rater_team_id") REFERENCES "teams" ("id") ON DELETE CASCADE;
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_ibfk_3" FOREIGN KEY ("rated_team_id") REFERENCES "teams" ("id") ON DELETE CASCADE;
ALTER TABLE "referee_availability" ADD CONSTRAINT "referee_availability_ibfk_1" FOREIGN KEY ("referee_id") REFERENCES "referees" ("id") ON DELETE CASCADE;
ALTER TABLE "referee_certifications" ADD CONSTRAINT "referee_certifications_ibfk_1" FOREIGN KEY ("referee_id") REFERENCES "referees" ("id") ON DELETE CASCADE;
ALTER TABLE "referee_certifications" ADD CONSTRAINT "referee_certifications_ibfk_2" FOREIGN KEY ("document_id") REFERENCES "uploads" ("id") ON DELETE SET NULL;
ALTER TABLE "referee_ratings" ADD CONSTRAINT "referee_ratings_ibfk_1" FOREIGN KEY ("referee_id") REFERENCES "referees" ("id") ON DELETE CASCADE;
ALTER TABLE "referee_ratings" ADD CONSTRAINT "referee_ratings_ibfk_2" FOREIGN KEY ("match_id") REFERENCES "matches" ("id") ON DELETE CASCADE;
ALTER TABLE "referee_ratings" ADD CONSTRAINT "referee_ratings_ibfk_3" FOREIGN KEY ("assignment_id") REFERENCES "match_referee_assignments" ("id") ON DELETE CASCADE;
ALTER TABLE "referee_ratings" ADD CONSTRAINT "referee_ratings_ibfk_4" FOREIGN KEY ("rated_by") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "referee_ratings" ADD CONSTRAINT "referee_ratings_ibfk_5" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE;
ALTER TABLE "referees" ADD CONSTRAINT "referees_ibfk_1" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL;
ALTER TABLE "referees" ADD CONSTRAINT "referees_ibfk_2" FOREIGN KEY ("profile_picture_id") REFERENCES "uploads" ("id") ON DELETE SET NULL;
ALTER TABLE "reports" ADD CONSTRAINT "reports_ibfk_1" FOREIGN KEY ("reporter_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_ibfk_2" FOREIGN KEY ("assigned_to") REFERENCES "users" ("id") ON DELETE SET NULL;
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_ibfk_1" FOREIGN KEY ("updated_by") REFERENCES "users" ("id") ON DELETE SET NULL;
ALTER TABLE "team_availability" ADD CONSTRAINT "team_availability_ibfk_1" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE;
ALTER TABLE "team_followers" ADD CONSTRAINT "team_followers_ibfk_1" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "team_followers" ADD CONSTRAINT "team_followers_ibfk_2" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE;
ALTER TABLE "team_gallery" ADD CONSTRAINT "fk_team_gallery_team" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE;
ALTER TABLE "team_gallery" ADD CONSTRAINT "fk_team_gallery_upload" FOREIGN KEY ("upload_id") REFERENCES "uploads" ("id") ON DELETE CASCADE;
ALTER TABLE "team_gallery" ADD CONSTRAINT "fk_team_gallery_uploader" FOREIGN KEY ("uploaded_by") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "team_match_validations" ADD CONSTRAINT "team_match_validations_ibfk_1" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE;
ALTER TABLE "team_match_validations" ADD CONSTRAINT "team_match_validations_ibfk_2" FOREIGN KEY ("match_id") REFERENCES "matches" ("id") ON DELETE SET NULL;
ALTER TABLE "team_match_validations" ADD CONSTRAINT "team_match_validations_ibfk_3" FOREIGN KEY ("invitation_id") REFERENCES "match_invitations" ("id") ON DELETE SET NULL;
ALTER TABLE "team_match_validations" ADD CONSTRAINT "team_match_validations_ibfk_4" FOREIGN KEY ("validated_by") REFERENCES "users" ("id") ON DELETE SET NULL;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_ibfk_1" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_ibfk_2" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "team_season_statistics" ADD CONSTRAINT "team_season_statistics_ibfk_1" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE;
ALTER TABLE "team_stats" ADD CONSTRAINT "team_stats_ibfk_1" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE;
ALTER TABLE "teams" ADD CONSTRAINT "fk_teams_banner" FOREIGN KEY ("banner_id") REFERENCES "uploads" ("id") ON DELETE SET NULL;
ALTER TABLE "teams" ADD CONSTRAINT "teams_ibfk_1" FOREIGN KEY ("captain_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "teams" ADD CONSTRAINT "teams_ibfk_2" FOREIGN KEY ("logo_id") REFERENCES "uploads" ("id") ON DELETE SET NULL;
ALTER TABLE "teams" ADD CONSTRAINT "teams_ibfk_3" FOREIGN KEY ("banner_id") REFERENCES "uploads" ("id") ON DELETE SET NULL;
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_ibfk_1" FOREIGN KEY ("uploaded_by") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_ibfk_1" FOREIGN KEY ("profile_picture_id") REFERENCES "uploads" ("id") ON DELETE SET NULL;
ALTER TABLE "users" ADD CONSTRAINT "users_ibfk_2" FOREIGN KEY ("cover_photo_id") REFERENCES "uploads" ("id") ON DELETE SET NULL;
ALTER TABLE "venue_availability" ADD CONSTRAINT "venue_availability_ibfk_1" FOREIGN KEY ("venue_id") REFERENCES "locations" ("id") ON DELETE CASCADE;
ALTER TABLE "venue_bookings" ADD CONSTRAINT "fk_manager_confirmed_by" FOREIGN KEY ("manager_confirmed_by") REFERENCES "users" ("id");
ALTER TABLE "venue_bookings" ADD CONSTRAINT "venue_bookings_ibfk_1" FOREIGN KEY ("location_id") REFERENCES "locations" ("id") ON DELETE CASCADE;
ALTER TABLE "venue_bookings" ADD CONSTRAINT "venue_bookings_ibfk_2" FOREIGN KEY ("match_id") REFERENCES "matches" ("id") ON DELETE SET NULL;
ALTER TABLE "venue_bookings" ADD CONSTRAINT "venue_bookings_ibfk_3" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE;
ALTER TABLE "venue_bookings" ADD CONSTRAINT "venue_bookings_ibfk_4" FOREIGN KEY ("booked_by") REFERENCES "users" ("id");
ALTER TABLE "venue_closures" ADD CONSTRAINT "venue_closures_ibfk_1" FOREIGN KEY ("venue_id") REFERENCES "locations" ("id") ON DELETE CASCADE;
ALTER TABLE "venue_owner_notifications" ADD CONSTRAINT "venue_owner_notifications_ibfk_1" FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "venue_owner_notifications" ADD CONSTRAINT "venue_owner_notifications_ibfk_2" FOREIGN KEY ("venue_id") REFERENCES "locations" ("id") ON DELETE CASCADE;
ALTER TABLE "venue_owner_notifications" ADD CONSTRAINT "venue_owner_notifications_ibfk_3" FOREIGN KEY ("booking_id") REFERENCES "venue_bookings" ("id") ON DELETE CASCADE;
ALTER TABLE "venue_partnerships" ADD CONSTRAINT "venue_partnerships_ibfk_1" FOREIGN KEY ("location_id") REFERENCES "locations" ("id") ON DELETE CASCADE;
ALTER TABLE "venue_pricing" ADD CONSTRAINT "venue_pricing_ibfk_1" FOREIGN KEY ("location_id") REFERENCES "locations" ("id") ON DELETE CASCADE;
ALTER TABLE "venue_ratings" ADD CONSTRAINT "venue_ratings_ibfk_1" FOREIGN KEY ("location_id") REFERENCES "locations" ("id") ON DELETE CASCADE;
ALTER TABLE "venue_ratings" ADD CONSTRAINT "venue_ratings_ibfk_2" FOREIGN KEY ("booking_id") REFERENCES "venue_bookings" ("id") ON DELETE SET NULL;
ALTER TABLE "venue_ratings" ADD CONSTRAINT "venue_ratings_ibfk_3" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "venue_revenue_tracking" ADD CONSTRAINT "venue_revenue_tracking_ibfk_1" FOREIGN KEY ("venue_id") REFERENCES "locations" ("id") ON DELETE CASCADE;
ALTER TABLE "venue_revenue_tracking" ADD CONSTRAINT "venue_revenue_tracking_ibfk_2" FOREIGN KEY ("booking_id") REFERENCES "venue_bookings" ("id") ON DELETE CASCADE;

