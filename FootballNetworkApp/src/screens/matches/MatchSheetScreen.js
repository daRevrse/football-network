// ====== src/screens/matches/MatchSheetScreen.js ======
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { refereeApi } from '../../services/api';

const THEME = {
  BG: '#FFFFFF',
  SURFACE: '#F8FAFC',
  TEXT: '#0F172A',
  TEXT_SEC: '#64748B',
  ACCENT: '#22C55E',
  BORDER: '#E2E8F0',
  HOME: '#3B82F6',
  AWAY: '#EC4899',
};

export const MatchSheetScreen = ({ route, navigation }) => {
  const { matchId } = route.params;
  const [loading, setLoading] = useState(true);
  const [matchSheet, setMatchSheet] = useState(null);

  useEffect(() => {
    loadMatchSheet();
  }, []);

  const loadMatchSheet = async () => {
    try {
      const res = await refereeApi.getMatchSheet(matchId);
      if (res.success) {
        setMatchSheet(res.data.matchSheet);
      }
    } catch (error) {
      console.error('Load match sheet error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!matchSheet) return;

    const homePlayersText = matchSheet.homeTeam.players
      .map(p => `  ${p.jerseyNumber || '--'} - ${p.name}${p.isCaptain ? ' (C)' : ''}`)
      .join('\n');

    const awayPlayersText = matchSheet.awayTeam.players
      .map(p => `  ${p.jerseyNumber || '--'} - ${p.name}${p.isCaptain ? ' (C)' : ''}`)
      .join('\n');

    const text = `
FICHE DE MATCH
==============
Date: ${new Date(matchSheet.match.date).toLocaleDateString('fr-FR')}
Lieu: ${matchSheet.match.location}

${matchSheet.homeTeam.name} (Domicile)
${homePlayersText}

${matchSheet.awayTeam.name} (Extérieur)
${awayPlayersText}

Arbitre: ${matchSheet.referee.name}
Licence: ${matchSheet.referee.license || 'N/A'}
`;

    try {
      await Share.share({
        message: text,
        title: 'Fiche de match',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const renderPlayerRow = (player, index) => (
    <View key={index} style={styles.playerRow}>
      <View style={styles.jerseyCell}>
        <Text style={styles.jerseyNumber}>{player.jerseyNumber || '--'}</Text>
      </View>
      <View style={styles.nameCell}>
        <Text style={styles.playerName}>
          {player.name}
          {player.isCaptain && <Text style={styles.captainBadge}> (C)</Text>}
        </Text>
      </View>
      <View style={styles.positionCell}>
        <Text style={styles.position}>{player.position || '-'}</Text>
      </View>
      <View style={styles.signatureCell}>
        <View style={styles.signatureLine} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.containerDark, styles.centered]}>
        <ActivityIndicator size="large" color={THEME.ACCENT} />
      </View>
    );
  }

  if (!matchSheet) {
    return (
      <View style={[styles.containerDark, styles.centered]}>
        <Icon name="alert-circle" size={48} color="#94A3B8" />
        <Text style={styles.errorText}>Impossible de charger la fiche de match</Text>
      </View>
    );
  }

  return (
    <View style={styles.containerDark}>
      <View style={styles.headerDark}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.titleDark}>Fiche de match</Text>
        <TouchableOpacity onPress={handleShare}>
          <Icon name="share-2" size={24} color={THEME.ACCENT} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Print-ready sheet with white background */}
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>FICHE DE MATCH</Text>
            <Text style={styles.sheetSubtitle}>
              {new Date(matchSheet.match.date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          {/* Match Info */}
          <View style={styles.matchInfo}>
            <View style={styles.matchInfoRow}>
              <Icon name="map-pin" size={16} color={THEME.TEXT_SEC} />
              <Text style={styles.matchInfoText}>{matchSheet.match.location}</Text>
            </View>
            <View style={styles.matchInfoRow}>
              <Icon name="user" size={16} color={THEME.TEXT_SEC} />
              <Text style={styles.matchInfoText}>
                Arbitre: {matchSheet.referee.name} ({matchSheet.referee.level})
              </Text>
            </View>
          </View>

          {/* Home Team */}
          <View style={styles.teamSection}>
            <View style={[styles.teamHeader, { backgroundColor: THEME.HOME }]}>
              <Text style={styles.teamHeaderText}>{matchSheet.homeTeam.name}</Text>
              <Text style={styles.teamHeaderLabel}>DOMICILE</Text>
            </View>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.jerseyCell]}>N°</Text>
              <Text style={[styles.headerCell, styles.nameCell]}>Joueur</Text>
              <Text style={[styles.headerCell, styles.positionCell]}>Poste</Text>
              <Text style={[styles.headerCell, styles.signatureCell]}>Signature</Text>
            </View>
            {matchSheet.homeTeam.players.map(renderPlayerRow)}
          </View>

          {/* Away Team */}
          <View style={styles.teamSection}>
            <View style={[styles.teamHeader, { backgroundColor: THEME.AWAY }]}>
              <Text style={styles.teamHeaderText}>{matchSheet.awayTeam.name}</Text>
              <Text style={styles.teamHeaderLabel}>EXTERIEUR</Text>
            </View>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.jerseyCell]}>N°</Text>
              <Text style={[styles.headerCell, styles.nameCell]}>Joueur</Text>
              <Text style={[styles.headerCell, styles.positionCell]}>Poste</Text>
              <Text style={[styles.headerCell, styles.signatureCell]}>Signature</Text>
            </View>
            {matchSheet.awayTeam.players.map(renderPlayerRow)}
          </View>

          {/* Score Section */}
          <View style={styles.scoreSection}>
            <Text style={styles.scoreSectionTitle}>SCORE FINAL</Text>
            <View style={styles.scoreBoxes}>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreTeamName}>{matchSheet.homeTeam.name}</Text>
                <View style={styles.scoreInputBox} />
              </View>
              <Text style={styles.scoreDash}>-</Text>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreTeamName}>{matchSheet.awayTeam.name}</Text>
                <View style={styles.scoreInputBox} />
              </View>
            </View>
          </View>

          {/* Signatures */}
          <View style={styles.signaturesSection}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Arbitre</Text>
              <View style={styles.signatureArea} />
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Manager Domicile</Text>
              <View style={styles.signatureArea} />
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Manager Extérieur</Text>
              <View style={styles.signatureArea} />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.sheetFooter}>
            <Text style={styles.footerText}>
              Généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  containerDark: { flex: 1, backgroundColor: '#0F172A' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  headerDark: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 20,
  },
  titleDark: { fontSize: 18, fontWeight: 'bold', color: '#F8FAFC' },
  errorText: { color: '#94A3B8', marginTop: 16, fontSize: 16 },
  scrollView: { flex: 1, paddingHorizontal: 16 },
  sheet: {
    backgroundColor: THEME.BG,
    borderRadius: 8,
    marginBottom: 24,
    overflow: 'hidden',
  },
  sheetHeader: {
    backgroundColor: THEME.TEXT,
    padding: 20,
    alignItems: 'center',
  },
  sheetTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.BG, letterSpacing: 2 },
  sheetSubtitle: { fontSize: 14, color: '#94A3B8', marginTop: 8, textTransform: 'capitalize' },
  matchInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER,
  },
  matchInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchInfoText: { fontSize: 14, color: THEME.TEXT, marginLeft: 8 },
  teamSection: {
    marginTop: 16,
  },
  teamHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamHeaderText: { fontSize: 16, fontWeight: 'bold', color: THEME.BG },
  teamHeaderLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: THEME.SURFACE,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER,
  },
  headerCell: { fontSize: 11, fontWeight: '600', color: THEME.TEXT_SEC, textTransform: 'uppercase' },
  playerRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER,
    alignItems: 'center',
  },
  jerseyCell: { width: 40 },
  jerseyNumber: { fontSize: 14, fontWeight: 'bold', color: THEME.TEXT },
  nameCell: { flex: 1 },
  playerName: { fontSize: 14, color: THEME.TEXT },
  captainBadge: { fontSize: 12, fontWeight: 'bold', color: '#F59E0B' },
  positionCell: { width: 60 },
  position: { fontSize: 12, color: THEME.TEXT_SEC, textAlign: 'center' },
  signatureCell: { width: 80 },
  signatureLine: {
    height: 1,
    backgroundColor: THEME.BORDER,
    marginTop: 16,
  },
  scoreSection: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: THEME.BORDER,
    marginTop: 16,
  },
  scoreSectionTitle: { fontSize: 14, fontWeight: '600', color: THEME.TEXT_SEC, marginBottom: 16, letterSpacing: 1 },
  scoreBoxes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBox: { alignItems: 'center' },
  scoreTeamName: { fontSize: 12, color: THEME.TEXT_SEC, marginBottom: 8 },
  scoreInputBox: {
    width: 60,
    height: 50,
    borderWidth: 2,
    borderColor: THEME.BORDER,
    borderRadius: 8,
  },
  scoreDash: { fontSize: 24, color: THEME.TEXT_SEC, marginHorizontal: 20 },
  signaturesSection: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: THEME.BORDER,
  },
  signatureBox: { flex: 1, alignItems: 'center' },
  signatureLabel: { fontSize: 10, color: THEME.TEXT_SEC, marginBottom: 8, textTransform: 'uppercase' },
  signatureArea: {
    width: '90%',
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: THEME.TEXT,
  },
  sheetFooter: {
    backgroundColor: THEME.SURFACE,
    padding: 12,
    alignItems: 'center',
  },
  footerText: { fontSize: 10, color: THEME.TEXT_SEC },
});

export default MatchSheetScreen;
