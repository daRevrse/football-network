// ====== src/screens/matches/MatchesScreen.js ======
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { matchesApi } from '../../services/api';
import { API_CONFIG } from '../../utils/constants';

// Thème Premium Night
const THEME = {
  BG: '#0F172A', // Slate 900
  SURFACE: '#1E293B', // Slate 800
  TEXT: '#F8FAFC', // Slate 50
  TEXT_SEC: '#94A3B8', // Slate 400
  ACCENT: '#22C55E', // Green 500
  BORDER: '#334155', // Slate 700
  LIVE: '#EF4444', // Red 500 (En cours)
  WIN: '#F59E0B', // Amber 500 (Vainqueur)
};

// Helper Date
const formatDate = dateString => {
  const date = new Date(dateString);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  if (isToday) {
    return `Aujourd'hui • ${date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Helper Status
const getStatusInfo = status => {
  switch (status) {
    case 'in_progress':
      return { label: 'EN DIRECT', color: THEME.LIVE, icon: 'activity' };
    case 'completed':
      return { label: 'TERMINÉ', color: THEME.TEXT_SEC, icon: 'check' };
    case 'cancelled':
      return { label: 'ANNULÉ', color: '#EF4444', icon: 'x' };
    case 'confirmed':
      return { label: 'CONFIRMÉ', color: THEME.ACCENT, icon: 'check-circle' };
    default:
      return { label: 'À VENIR', color: '#3B82F6', icon: 'calendar' };
  }
};

// Composant Avatar d'Équipe (Image ou Initiale)
const TeamAvatar = ({ name, logoUrl, size = 48 }) => {
  if (logoUrl) {
    return (
      <Image
        source={{ uri: API_CONFIG.BASE_URL.replace('/api', '') + logoUrl }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 3,
          backgroundColor: '#FFF',
        }}
        resizeMode="cover"
      />
    );
  }

  return (
    <LinearGradient
      colors={[THEME.ACCENT, '#166534']}
      style={{
        width: size,
        height: size,
        borderRadius: size / 3,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
      }}
    >
      <Text style={{ fontSize: size * 0.4, fontWeight: 'bold', color: '#FFF' }}>
        {name ? name.charAt(0).toUpperCase() : '?'}
      </Text>
    </LinearGradient>
  );
};

const MatchCard = ({ match, onPress }) => {
  const statusInfo = getStatusInfo(match.status);
  const isScoreVisible =
    match.status === 'completed' || match.status === 'in_progress';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <LinearGradient
        colors={[THEME.SURFACE, '#162032']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* Header Carte */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { borderColor: statusInfo.color }]}>
            <View
              style={[styles.statusDot, { backgroundColor: statusInfo.color }]}
            />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
          <Text style={styles.dateText}>{formatDate(match.matchDate)}</Text>
        </View>

        {/* Teams Row */}
        <View style={styles.teamsRow}>
          {/* Home Team */}
          <View style={styles.teamSide}>
            <TeamAvatar
              name={match.homeTeam.name}
              logoUrl={match.homeTeam.logoUrl}
            />
            <Text style={styles.teamName} numberOfLines={1}>
              {match.homeTeam.name}
            </Text>
          </View>

          {/* Score / VS */}
          <View
            style={[styles.scoreBox, isScoreVisible && styles.scoreBoxActive]}
          >
            {isScoreVisible ? (
              <Text style={styles.scoreText}>
                {match.score.home} - {match.score.away}
              </Text>
            ) : (
              <Text style={styles.vsText}>VS</Text>
            )}
          </View>

          {/* Away Team */}
          <View style={styles.teamSide}>
            {match.awayTeam ? (
              <>
                <TeamAvatar
                  name={match.awayTeam.name}
                  logoUrl={match.awayTeam.logoUrl}
                />
                <Text style={styles.teamName} numberOfLines={1}>
                  {match.awayTeam.name}
                </Text>
              </>
            ) : (
              <>
                <View
                  style={[
                    styles.avatarPlaceholder,
                    { width: 48, height: 48, borderRadius: 16 },
                  ]}
                >
                  <Icon name="help-circle" size={24} color={THEME.TEXT_SEC} />
                </View>
                <Text style={[styles.teamName, { color: THEME.TEXT_SEC }]}>
                  En attente
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Location Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.locationContainer}>
            <Icon name="map-pin" size={12} color={THEME.TEXT_SEC} />
            <Text style={styles.locationText} numberOfLines={1}>
              {match.location?.name ||
                match.location?.address ||
                'Lieu à définir'}
            </Text>
          </View>
          {match.isOrganizer && (
            <View style={styles.organizerBadge}>
              <Icon name="star" size={10} color="#000" />
              <Text style={styles.organizerText}>ORGANISATEUR</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const MatchesScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [filter, setFilter] = useState('upcoming'); // upcoming, past

  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, []),
  );

  const loadMatches = async () => {
    try {
      setLoading(true);
      const result = await matchesApi.getMyMatches();
      console.log('Matches loaded:', result); // Debug pour vérifier les logos
      if (result.success) setMatches(result.data || result.matches || []);
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  };

  const handleInvitations = () => {
    navigation.navigate('Invitations');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const filteredMatches = matches.filter(m => {
    const isPast =
      new Date(m.matchDate) < new Date() ||
      m.status === 'completed' ||
      m.status === 'cancelled';
    return filter === 'past' ? isPast : !isPast;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.BG} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mes Matchs</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateMatch')}
        >
          <Icon name="plus" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.invitationButton} // ou styles.iconBtn selon la version
          onPress={handleInvitations}
        >
          <Icon name="mail" size={20} color="#FFF" />
          {/* Badge de notification optionnel */}
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, filter === 'upcoming' && styles.tabActive]}
          onPress={() => setFilter('upcoming')}
        >
          <Text
            style={[
              styles.tabText,
              filter === 'upcoming' && styles.tabTextActive,
            ]}
          >
            À venir
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, filter === 'past' && styles.tabActive]}
          onPress={() => setFilter('past')}
        >
          <Text
            style={[styles.tabText, filter === 'past' && styles.tabTextActive]}
          >
            Historique
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={THEME.ACCENT}
          />
        }
      >
        {filteredMatches.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Icon name="calendar" size={48} color={THEME.TEXT_SEC} />
            <Text style={styles.emptyText}>
              Aucun match {filter === 'upcoming' ? 'prévu' : 'trouvé'}
            </Text>
            {filter === 'upcoming' && (
              <TouchableOpacity
                onPress={() => navigation.navigate('CreateMatch')}
              >
                <Text style={styles.linkText}>Organiser un match</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredMatches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              onPress={() =>
                navigation.navigate('MatchDetail', { matchId: match.id })
              }
            />
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.BG },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER,
  },
  title: { fontSize: 28, fontWeight: '900', color: THEME.TEXT },
  createBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 12,
    marginTop: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.BORDER,
    backgroundColor: THEME.SURFACE,
  },
  tabActive: {
    backgroundColor: THEME.ACCENT,
    borderColor: THEME.ACCENT,
  },
  tabText: { color: THEME.TEXT_SEC, fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: '#000' },
  content: { paddingHorizontal: 24 },

  // CARD
  card: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cardGradient: { padding: 16 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  dateText: { color: THEME.TEXT_SEC, fontSize: 12, fontWeight: '500' },

  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamSide: { flex: 1, alignItems: 'center', gap: 8 },
  teamName: {
    color: THEME.TEXT,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: '90%',
  },

  scoreBox: {
    minWidth: 60,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.BORDER,
    paddingHorizontal: 12,
  },
  scoreBoxActive: {
    borderColor: THEME.ACCENT,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  scoreText: { color: THEME.TEXT, fontSize: 18, fontWeight: 'bold' },
  vsText: { color: THEME.TEXT_SEC, fontSize: 14, fontWeight: 'bold' },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  locationText: { color: THEME.TEXT_SEC, fontSize: 12, flex: 1 },

  organizerBadge: {
    backgroundColor: THEME.CAPTAIN,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  organizerText: { color: '#000', fontSize: 9, fontWeight: 'bold' },

  avatarPlaceholder: {
    backgroundColor: THEME.SURFACE_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },

  emptyState: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { color: THEME.TEXT_SEC, fontSize: 16 },
  linkText: {
    color: THEME.ACCENT,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
