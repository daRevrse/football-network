// ====== src/screens/matches/MatchReportScreen.js ======
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { refereeApi } from '../../services/api';

const THEME = {
  BG: '#0F172A',
  SURFACE: '#1E293B',
  TEXT: '#F8FAFC',
  TEXT_SEC: '#94A3B8',
  ACCENT: '#22C55E',
  BORDER: '#334155',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  HOME: '#3B82F6',
  AWAY: '#EC4899',
};

export const MatchReportScreen = ({ route, navigation }) => {
  const { matchId } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [report, setReport] = useState({
    homeScore: 0,
    awayScore: 0,
    matchSummary: '',
    weatherConditions: '',
    pitchConditions: '',
  });
  const [goals, setGoals] = useState([]);
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    loadMatchData();
  }, []);

  const loadMatchData = async () => {
    try {
      const res = await refereeApi.getMatchDetails(matchId);
      if (res.success) {
        setMatchData(res.data);
        setReport(prev => ({
          ...prev,
          homeScore: res.data.match?.score?.home || 0,
          awayScore: res.data.match?.score?.away || 0,
        }));
        setGoals(res.data.goals || []);
        setIncidents(res.data.incidents || []);
      }
    } catch (error) {
      console.error('Load match data error:', error);
      Alert.alert('Erreur', 'Impossible de charger les données du match');
    } finally {
      setLoading(false);
    }
  };

  const updateScore = (team, delta) => {
    const key = team === 'home' ? 'homeScore' : 'awayScore';
    setReport(prev => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta),
    }));
  };

  const handleSaveReport = async () => {
    setSaving(true);
    try {
      const res = await refereeApi.saveMatchReport(matchId, report);
      if (res.success) {
        Alert.alert('Succès', 'Rapport enregistré (brouillon)');
      } else {
        Alert.alert('Erreur', res.error || 'Impossible de sauvegarder');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitReport = async () => {
    Alert.alert(
      'Soumettre le rapport',
      'Une fois soumis, le rapport ne pourra plus être modifié. Confirmer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Soumettre',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              // D'abord sauvegarder
              await refereeApi.saveMatchReport(matchId, report);
              // Puis soumettre
              const res = await refereeApi.submitMatchReport(matchId);
              if (res.success) {
                Alert.alert(
                  'Rapport soumis',
                  `Score final: ${report.homeScore} - ${report.awayScore}`,
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
              } else {
                Alert.alert('Erreur', res.error || 'Impossible de soumettre');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleAddGoal = (teamId) => {
    navigation.navigate('AddGoalScreen', {
      matchId,
      teamId,
      players: teamId === matchData.homeTeam.id
        ? matchData.homeTeam.roster
        : matchData.awayTeam.roster,
      onGoalAdded: (newGoal) => {
        setGoals(prev => [...prev, newGoal]);
        updateScore(teamId === matchData.homeTeam.id ? 'home' : 'away', 1);
      },
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={THEME.ACCENT} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={THEME.TEXT} />
        </TouchableOpacity>
        <Text style={styles.title}>Rapport de match</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MatchSheetScreen', { matchId })}>
          <Icon name="printer" size={24} color={THEME.ACCENT} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Score Section */}
        <View style={styles.scoreSection}>
          <View style={styles.teamScore}>
            <Text style={styles.teamName} numberOfLines={1}>
              {matchData?.homeTeam?.name || 'Domicile'}
            </Text>
            <View style={styles.scoreControls}>
              <TouchableOpacity
                style={styles.scoreBtn}
                onPress={() => updateScore('home', -1)}
              >
                <Icon name="minus" size={20} color={THEME.TEXT} />
              </TouchableOpacity>
              <Text style={[styles.scoreValue, { color: THEME.HOME }]}>
                {report.homeScore}
              </Text>
              <TouchableOpacity
                style={styles.scoreBtn}
                onPress={() => updateScore('home', 1)}
              >
                <Icon name="plus" size={20} color={THEME.TEXT} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.scoreDash}>-</Text>

          <View style={styles.teamScore}>
            <Text style={styles.teamName} numberOfLines={1}>
              {matchData?.awayTeam?.name || 'Extérieur'}
            </Text>
            <View style={styles.scoreControls}>
              <TouchableOpacity
                style={styles.scoreBtn}
                onPress={() => updateScore('away', -1)}
              >
                <Icon name="minus" size={20} color={THEME.TEXT} />
              </TouchableOpacity>
              <Text style={[styles.scoreValue, { color: THEME.AWAY }]}>
                {report.awayScore}
              </Text>
              <TouchableOpacity
                style={styles.scoreBtn}
                onPress={() => updateScore('away', 1)}
              >
                <Icon name="plus" size={20} color={THEME.TEXT} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Buts</Text>
            <View style={styles.addBtns}>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: THEME.HOME }]}
                onPress={() => handleAddGoal(matchData?.homeTeam?.id)}
              >
                <Icon name="plus" size={16} color="#FFF" />
                <Text style={styles.addBtnText}>Dom.</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: THEME.AWAY }]}
                onPress={() => handleAddGoal(matchData?.awayTeam?.id)}
              >
                <Icon name="plus" size={16} color="#FFF" />
                <Text style={styles.addBtnText}>Ext.</Text>
              </TouchableOpacity>
            </View>
          </View>
          {goals.length === 0 ? (
            <Text style={styles.emptyText}>Aucun but enregistré</Text>
          ) : (
            goals.map((goal, index) => (
              <View key={index} style={styles.goalRow}>
                <Text style={styles.goalMinute}>{goal.minute}'</Text>
                <Icon name="target" size={16} color={THEME.ACCENT} />
                <Text style={styles.goalScorer}>
                  {goal.scorerName || 'Buteur inconnu'}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Incidents Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cartons / Incidents</Text>
            <TouchableOpacity
              style={styles.addIncidentBtn}
              onPress={() => navigation.navigate('AddIncidentScreen', { matchId, matchData })}
            >
              <Icon name="alert-triangle" size={16} color={THEME.WARNING} />
              <Text style={[styles.addBtnText, { color: THEME.WARNING }]}>Ajouter</Text>
            </TouchableOpacity>
          </View>
          {incidents.length === 0 ? (
            <Text style={styles.emptyText}>Aucun incident signalé</Text>
          ) : (
            incidents.map((incident, index) => (
              <View key={index} style={styles.incidentRow}>
                <Text style={styles.goalMinute}>{incident.minute}'</Text>
                <View style={[
                  styles.cardBadge,
                  incident.type === 'red_card' && styles.redCard,
                ]}>
                  <Text style={styles.cardText}>
                    {incident.type === 'yellow_card' ? 'J' : incident.type === 'red_card' ? 'R' : '!'}
                  </Text>
                </View>
                <Text style={styles.goalScorer}>{incident.description}</Text>
              </View>
            ))
          )}
        </View>

        {/* Match Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résumé du match</Text>
          <TextInput
            style={styles.textArea}
            value={report.matchSummary}
            onChangeText={(text) => setReport(prev => ({ ...prev, matchSummary: text }))}
            placeholder="Décrivez le déroulement du match..."
            placeholderTextColor={THEME.TEXT_SEC}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Conditions */}
        <View style={styles.conditionsRow}>
          <View style={styles.conditionItem}>
            <Text style={styles.conditionLabel}>Météo</Text>
            <TextInput
              style={styles.conditionInput}
              value={report.weatherConditions}
              onChangeText={(text) => setReport(prev => ({ ...prev, weatherConditions: text }))}
              placeholder="Ex: Ensoleillé"
              placeholderTextColor={THEME.TEXT_SEC}
            />
          </View>
          <View style={styles.conditionItem}>
            <Text style={styles.conditionLabel}>Terrain</Text>
            <TextInput
              style={styles.conditionInput}
              value={report.pitchConditions}
              onChangeText={(text) => setReport(prev => ({ ...prev, pitchConditions: text }))}
              placeholder="Ex: Bon état"
              placeholderTextColor={THEME.TEXT_SEC}
            />
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSaveReport}
          disabled={saving}
        >
          <Icon name="save" size={18} color={THEME.ACCENT} />
          <Text style={styles.saveBtnText}>Enregistrer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
          onPress={handleSubmitReport}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Icon name="send" size={18} color="#000" />
              <Text style={styles.submitBtnText}>Soumettre</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.BG },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 20,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: THEME.TEXT },
  content: { flex: 1, paddingHorizontal: 24 },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.SURFACE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  teamScore: { flex: 1, alignItems: 'center' },
  teamName: { fontSize: 14, color: THEME.TEXT_SEC, marginBottom: 12, textAlign: 'center' },
  scoreControls: { flexDirection: 'row', alignItems: 'center' },
  scoreBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: THEME.BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: { fontSize: 48, fontWeight: 'bold', marginHorizontal: 16 },
  scoreDash: { fontSize: 32, color: THEME.TEXT_SEC, marginHorizontal: 8 },
  section: {
    backgroundColor: THEME.SURFACE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: THEME.TEXT },
  addBtns: { flexDirection: 'row', gap: 8 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addBtnText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  addIncidentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emptyText: { color: THEME.TEXT_SEC, fontSize: 14, textAlign: 'center', paddingVertical: 12 },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER,
    gap: 12,
  },
  goalMinute: { fontSize: 14, color: THEME.ACCENT, fontWeight: '600', width: 32 },
  goalScorer: { flex: 1, color: THEME.TEXT, fontSize: 14 },
  incidentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER,
    gap: 12,
  },
  cardBadge: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: THEME.WARNING,
    justifyContent: 'center',
    alignItems: 'center',
  },
  redCard: { backgroundColor: THEME.ERROR },
  cardText: { fontSize: 12, fontWeight: 'bold', color: '#FFF' },
  textArea: {
    backgroundColor: THEME.BG,
    borderRadius: 8,
    padding: 12,
    color: THEME.TEXT,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  conditionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  conditionItem: { flex: 1 },
  conditionLabel: { fontSize: 12, color: THEME.TEXT_SEC, marginBottom: 8 },
  conditionInput: {
    backgroundColor: THEME.SURFACE,
    borderRadius: 8,
    padding: 12,
    color: THEME.TEXT,
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: THEME.BG,
    borderTopWidth: 1,
    borderTopColor: THEME.BORDER,
    gap: 12,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.SURFACE,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: THEME.ACCENT,
  },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: THEME.ACCENT },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.ACCENT,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 14, fontWeight: 'bold', color: '#000' },
});

export default MatchReportScreen;
