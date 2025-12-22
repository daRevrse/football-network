// ====== src/screens/matches/PublicMatchDetailScreen.js ======
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
  Image,
  Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { matchesApi } from '../../services/api';
import { API_CONFIG } from '../../utils/constants/api';

const THEME = {
  BG: '#0F172A',
  SURFACE: '#1E293B',
  TEXT: '#F8FAFC',
  TEXT_SEC: '#94A3B8',
  ACCENT: '#22C55E',
  BORDER: '#334155',
};

const StatRow = ({ label, value, icon }) => (
  <View style={styles.statRow}>
    <View style={styles.statLabelRow}>
      <Icon name={icon} size={16} color={THEME.TEXT_SEC} />
      <Text style={styles.statLabel}>{label}</Text>
    </View>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

export const PublicMatchDetailScreen = ({ route, navigation }) => {
  const { matchId } = route.params;
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadMatch();
    }, [matchId]),
  );

  const loadMatch = async () => {
    try {
      setLoading(true);
      // Utiliser l'endpoint public qui ne nécessite pas d'authentification
      const res = await matchesApi.getPublicMatchById(matchId);
      if (res.success) setMatch(res.data);
    } catch (e) {
      console.error('Error loading match:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Venez suivre le match ${match.homeTeam.name} vs ${match.awayTeam?.name || 'TBD'} sur Football Network!`,
        title: 'Match de football',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading || !match)
    return (
      <View style={styles.center}>
        <ActivityIndicator color={THEME.ACCENT} />
      </View>
    );

  const getStatusBadge = () => {
    switch (match.status) {
      case 'pending':
        return { bg: '#F59E0B20', color: '#F59E0B', label: 'EN ATTENTE' };
      case 'confirmed':
        return { bg: '#3B82F620', color: '#3B82F6', label: 'CONFIRMÉ' };
      case 'in_progress':
        return { bg: '#22C55E20', color: '#22C55E', label: 'EN COURS' };
      case 'completed':
        return { bg: '#64748B20', color: '#64748B', label: 'TERMINÉ' };
      case 'cancelled':
        return { bg: '#EF444420', color: '#EF4444', label: 'ANNULÉ' };
      default:
        return { bg: '#94A3B820', color: '#94A3B8', label: 'PRÉVU' };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.BG} />

      {/* HEADER SCOREBOARD */}
      <View style={styles.scoreboard}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon name="arrow-left" size={24} color={THEME.TEXT} />
        </TouchableOpacity>

        <Text style={styles.leagueText}>{match.type || 'Match Amical'}</Text>

        <View style={styles.teamsContainer}>
          <View style={styles.teamCol}>
            <View style={styles.logoBox}>
              {match.homeTeam.logoUrl ? (
                <Image
                  source={{
                    uri: `${API_CONFIG.BASE_URL.replace('/api', '')}${match.homeTeam.logoUrl}`,
                  }}
                  style={styles.logoImage}
                />
              ) : (
                <Text style={styles.logoText}>{match.homeTeam.name[0]}</Text>
              )}
            </View>
            <Text style={styles.teamName} numberOfLines={2}>
              {match.homeTeam.name}
            </Text>
          </View>

          <View style={styles.scoreCol}>
            <Text style={styles.scoreBig}>
              {match.score?.home ?? '-'} : {match.score?.away ?? '-'}
            </Text>
            <View
              style={[
                styles.timeBadge,
                { backgroundColor: statusBadge.bg, borderColor: statusBadge.color },
              ]}
            >
              <Text style={[styles.timeText, { color: statusBadge.color }]}>
                {statusBadge.label}
              </Text>
            </View>
          </View>

          <View style={styles.teamCol}>
            <View
              style={[
                styles.logoBox,
                { backgroundColor: '#3B82F620', borderColor: '#3B82F650' },
              ]}
            >
              {match.awayTeam?.logoUrl ? (
                <Image
                  source={{
                    uri: `${API_CONFIG.BASE_URL.replace('/api', '')}${match.awayTeam.logoUrl}`,
                  }}
                  style={styles.logoImage}
                />
              ) : match.awayTeam ? (
                <Text style={[styles.logoText, { color: '#3B82F6' }]}>
                  {match.awayTeam.name[0]}
                </Text>
              ) : (
                <Icon name="help-circle" size={24} color="#94A3B8" />
              )}
            </View>
            <Text style={styles.teamName} numberOfLines={2}>
              {match.awayTeam?.name || 'En attente...'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* PARTAGER */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Icon name="share-2" size={20} color="#FFF" />
            <Text style={styles.shareBtnText}>Partager ce match</Text>
          </TouchableOpacity>
        </View>

        {/* INFO CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Détails du match</Text>
          <StatRow
            icon="calendar"
            label="Date"
            value={new Date(match.matchDate).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          />
          <StatRow
            icon="clock"
            label="Heure"
            value={new Date(match.matchDate).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
          <StatRow
            icon="map-pin"
            label="Lieu"
            value={match.location?.name || 'Non défini'}
          />
          {match.location?.city && (
            <StatRow
              icon="navigation"
              label="Ville"
              value={match.location.city}
            />
          )}
          <StatRow
            icon="user"
            label="Arbitre"
            value={match.refereeContact || 'Non assigné'}
          />
        </View>

        {/* DESCRIPTION */}
        {match.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{match.notes}</Text>
          </View>
        )}

        {/* INFO MESSAGE */}
        <View style={styles.infoBox}>
          <Icon name="info" size={16} color={THEME.TEXT_SEC} />
          <Text style={styles.infoText}>
            Cette page est publique. Connectez-vous pour plus de fonctionnalités.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.BG },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.BG,
  },

  // SCOREBOARD HEADER
  scoreboard: {
    backgroundColor: THEME.SURFACE,
    paddingBottom: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER,
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 20,
    zIndex: 10,
  },
  leagueText: {
    textAlign: 'center',
    color: THEME.TEXT_SEC,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 20,
  },

  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  teamCol: { alignItems: 'center', width: '30%' },
  scoreCol: { alignItems: 'center', width: '40%' },

  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  logoText: { fontSize: 24, fontWeight: 'bold', color: THEME.ACCENT },
  teamName: {
    color: THEME.TEXT,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  scoreBig: {
    fontSize: 36,
    fontWeight: 'bold',
    color: THEME.TEXT,
    marginBottom: 8,
  },
  timeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  timeText: { fontSize: 10, fontWeight: 'bold' },

  content: { padding: 20 },

  // ACTIONS
  actionsRow: { marginBottom: 24 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  shareBtnText: { color: '#FFF', fontWeight: '600', fontSize: 15 },

  // CARD
  card: {
    backgroundColor: THEME.SURFACE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  cardTitle: {
    color: THEME.TEXT,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statLabel: { color: THEME.TEXT_SEC, fontSize: 14 },
  statValue: { color: THEME.TEXT, fontSize: 14, fontWeight: '600' },
  notesText: { color: THEME.TEXT_SEC, lineHeight: 20 },

  // INFO BOX
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.SURFACE,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.BORDER,
    gap: 8,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    color: THEME.TEXT_SEC,
    fontSize: 12,
  },
});
