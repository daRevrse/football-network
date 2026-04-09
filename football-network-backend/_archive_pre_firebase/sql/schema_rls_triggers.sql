-- ==========================================
-- SUPABASE FULL SERVERLESS : RLS & TRIGGERS
-- ==========================================

-- 1. ACTIVER LE ROW LEVEL SECURITY (RLS) SUR TOUTES LES TABLES
-- Cela bloque tout l'accès par défaut depuis l'API publique (anon et authenticated)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_bookings ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- 2. POLITIQUES RLS (ROW LEVEL SECURITY)
-- ==========================================
-- auth.uid() correspond à l'ID de l'utilisateur connecté via Supabase Auth.
-- IMPORTANT : Dans notre table `users`, l'ID est un entier classique, MAIS auth.uid() renvoie un UUID !
-- Puisque nous avons conçu `users.email` comme clé commune, beaucoup de nos accès se feront via des sous-requêtes 
-- ou en liant l'UUID Supabase à notre table Users locale.

-- Astuce de conception pour notre architecture existante : 
-- Nous allons créer une fonction helper pour récupérer le `user.id` (entier) à partir de auth.jwt()->>'email'.
create or replace function public.get_current_user_id()
returns integer
language plpgsql security definer
as $$
declare
  matching_user_id integer;
begin
  select id into matching_user_id from public.users where email = auth.jwt()->>'email';
  return matching_user_id;
end;
$$;


-- ============= USERS =============
-- Lecture : Tout le monde authentifié peut voir les profils des autres
create policy "Users visible to all authenticated"
on public.users for select to authenticated using (true);

-- Modification : Un utilisateur ne peut modifier que sa propre ligne
create policy "Users can update own profile"
on public.users for update to authenticated 
using ( id = public.get_current_user_id() );


-- ============= TEAMS =============
-- Lecture : Tout le monde peut voir les équipes
create policy "Teams visible to all authenticated"
on public.teams for select to authenticated using (true);

-- Création : Tout utilisateur authentifié peut créer une équipe
create policy "Users can create teams"
on public.teams for insert to authenticated with check ( captain_id = public.get_current_user_id() );

-- Modification : Seul le manager ou le capitaine peut modifier
create policy "Captain can update team"
on public.teams for update to authenticated 
using ( captain_id = public.get_current_user_id() );


-- ============= TEAM_MEMBERS =============
-- Lecture : Tout le monde authentifié
create policy "Team members visible to all"
on public.team_members for select to authenticated using (true);

-- Rejoindre : Un joueur peut créer une ligne avec status='pending' pour lui-même
create policy "Users can request to join a team"
on public.team_members for insert to authenticated 
with check ( user_id = public.get_current_user_id() );

-- Un manager d'équipe peut insérer/accepter/modifier des membres pour son équipe
create policy "Team managers can manage members"
on public.team_members for all to authenticated 
using ( 
  exists (select 1 from public.teams where id = team_id and captain_id = public.get_current_user_id())
);

-- Un joueur peut quitter une équipe ou refuser une invitation
create policy "Users can manage their own memberships"
on public.team_members for update to authenticated 
using ( user_id = public.get_current_user_id() );
create policy "Users can leave teams"
on public.team_members for delete to authenticated 
using ( user_id = public.get_current_user_id() );


-- ============= MATCHES =============
create policy "Matches visible to all"
on public.matches for select to authenticated using (true);

create policy "Captains can create matches"
on public.matches for insert to authenticated 
with check ( 
  exists (select 1 from public.teams where id = home_team_id and captain_id = public.get_current_user_id())
);

create policy "Captains can update matches"
on public.matches for update to authenticated 
using ( 
  exists (select 1 from public.teams where (id = home_team_id or id = away_team_id) and captain_id = public.get_current_user_id())
);


-- ============= PARTICIPATIONS =============
create policy "Participations visible to all"
on public.match_participations for select to authenticated using (true);

-- Le créateur du match (ou capitaines des équipes) peut inviter
create policy "Match creators can manage participations"
on public.match_participations for all to authenticated 
using ( 
  exists (
    select 1 from public.matches m
    join public.teams t on (t.id = m.home_team_id or t.id = m.away_team_id)
    where m.id = match_id and t.captain_id = public.get_current_user_id()
  )
);

-- L'utilisateur peut répondre à ses invitations / rejoindre un match public
create policy "Users can manage own participations"
on public.match_participations for insert to authenticated 
with check ( user_id = public.get_current_user_id() );

create policy "Users can update own participations"
on public.match_participations for update to authenticated 
using ( user_id = public.get_current_user_id() );


-- ============= FEED & MEDIA =============
create policy "Feed visible to all"
on public.feed_posts for select to authenticated using (is_active = true);

create policy "Users can create posts"
on public.feed_posts for insert to authenticated 
with check ( user_id = public.get_current_user_id() );

create policy "Users can manage own posts"
on public.feed_posts for update to authenticated using (user_id = public.get_current_user_id());
create policy "Users can delete own posts"
on public.feed_posts for delete to authenticated using (user_id = public.get_current_user_id());



-- ==========================================
-- 3. TRIGGERS & FONCTIONS AUTOMATIQUES
-- ==========================================

-- A. CRÉATION PROFIL AUTO À L'INSCRIPTION
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (email, password, first_name, last_name, user_type, is_active, email_verified)
  values (
    new.email,
    'SUPABASE_AUTH_MANAGED',
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'user_type', 'player'),
    true,
    false
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- B. MISE A JOUR AUTOMATIQUE DES "updated_at"
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Appliquer le trigger sur les tables qui ont le champ updated_at
drop trigger if exists set_updated_at_feed_posts on public.feed_posts;
create trigger set_updated_at_feed_posts before update on public.feed_posts for each row execute procedure public.handle_updated_at();

drop trigger if exists set_updated_at_feed_comments on public.feed_comments;
create trigger set_updated_at_feed_comments before update on public.feed_comments for each row execute procedure public.handle_updated_at();


-- ==========================================
-- 4. BUCKETS STORAGE (AVATARS, COVERS)
-- ==========================================
-- Exécuter ces commandes pour autoriser l'upload d'images par les utilisateurs.

-- (Vous devrez avoir créé manuellement ou via dashboard un bucket nommé 'medias')
-- insert into storage.buckets (id, name, public) values ('medias', 'medias', true) on conflict do nothing;

-- 1. Tout le monde peut voir les médias
-- create policy "Medias are publicly accessible" on storage.objects for select using ( bucket_id = 'medias' );

-- 2. Authentifiés peuvent uploader
-- create policy "Users can upload media" on storage.objects for insert to authenticated with check ( bucket_id = 'medias' );

-- 3. Les utilisateurs peuvent modifier leurs propres médias
-- create policy "Users can update own media" on storage.objects for update to authenticated using ( bucket_id = 'medias' and owner = auth.uid() );
