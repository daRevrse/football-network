// ====== src/screens/teams/JerseyAssignmentScreen.js ======
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { teamsApi } from '../../services/api';

const THEME = {
  BG: '#0F172A',
  SURFACE: '#1E293B',
  TEXT: '#F8FAFC',
  TEXT_SEC: '#94A3B8',
  ACCENT: '#22C55E',
  BORDER: '#334155',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
};

export const JerseyAssignmentScreen = ({ route, navigation }) => {
  const { teamId, teamName } = route.params;
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [jerseyInput, setJerseyInput] = useState('');

  useEffect(() => {
    loadRoster();
  }, []);

  const loadRoster = async () => {
    try {
      const res = await teamsApi.getTeamRoster(teamId);
      if (res.success) {
        setRoster(res.data.roster || []);
      }
    } catch (error) {
      console.error('Load roster error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignJersey = async (playerId) => {
    const jerseyNumber = parseInt(jerseyInput);
    if (isNaN(jerseyNumber) || jerseyNumber < 1 || jerseyNumber > 99) {
      Alert.alert('Erreur', 'Le dossard doit être entre 1 et 99');
      return;
    }

    // Vérifier si le dossard est déjà pris
    const existing = roster.find(p => p.jerseyNumber === jerseyNumber && p.id !== playerId);
    if (existing) {
      Alert.alert('Erreur', `Le dossard ${jerseyNumber} est déjà attribué à ${existing.firstName} ${existing.lastName}`);
      return;
    }

    setSaving(true);
    try {
      const res = await teamsApi.assignJersey(teamId, playerId, jerseyNumber);
      if (res.success) {
        setRoster(prev => prev.map(p =>
          p.id === playerId ? { ...p, jerseyNumber } : p
        ));
        setEditingPlayer(null);
        setJerseyInput('');
      } else {
        Alert.alert('Erreur', res.error || 'Impossible d\'assigner le dossard');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (player) => {
    setEditingPlayer(player.id);
    setJerseyInput(player.jerseyNumber ? String(player.jerseyNumber) : '');
  };

  const cancelEditing = () => {
    setEditingPlayer(null);
    setJerseyInput('');
  };

  const renderPlayer = ({ item }) => {
    const isEditing = editingPlayer === item.id;
    const isManager = item.role === 'manager';

    if (isManager) return null;

    return (
      <View style={styles.playerRow}>
        <View style={[styles.jerseyBadge, !item.jerseyNumber && styles.jerseyEmpty]}>
          {isEditing ? (
            <TextInput
              style={styles.jerseyInput}
              value={jerseyInput}
              onChangeText={setJerseyInput}
              keyboardType="number-pad"
              maxLength={2}
              autoFocus
              placeholder="--"
              placeholderTextColor={THEME.TEXT_SEC}
            />
          ) : (
            <Text style={styles.jerseyText}>
              {item.jerseyNumber || '--'}
            </Text>
          )}
        </View>

        <View style={styles.playerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.playerName}>
              {item.firstName} {item.lastName}
            </Text>
            {item.isCaptain && (
              <View style={styles.captainBadge}>
                <Icon name="award" size={12} color={THEME.WARNING} />
                <Text style={styles.captainText}>C</Text>
              </View>
            )}
          </View>
          <Text style={styles.position}>{item.position || 'Non défini'}</Text>
        </View>

        {isEditing ? (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.cancelBtn]}
              onPress={cancelEditing}
            >
              <Icon name="x" size={18} color={THEME.TEXT} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.saveBtn]}
              onPress={() => handleAssignJersey(item.id)}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Icon name="check" size={18} color="#000" />
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => startEditing(item)}
          >
            <Icon name="edit-2" size={18} color={THEME.ACCENT} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const playersOnly = roster.filter(p => p.userType === 'player');
  const assignedCount = playersOnly.filter(p => p.jerseyNumber).length;

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
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Dossards</Text>
          <Text style={styles.subtitle}>{teamName}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{playersOnly.length}</Text>
          <Text style={styles.statLabel}>Joueurs</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: THEME.ACCENT }]}>{assignedCount}</Text>
          <Text style={styles.statLabel}>Attribués</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: THEME.WARNING }]}>
            {playersOnly.length - assignedCount}
          </Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>
      </View>

      <FlatList
        data={playersOnly}
        keyExtractor={item => String(item.id)}
        renderItem={renderPlayer}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="users" size={48} color={THEME.TEXT_SEC} />
            <Text style={styles.emptyText}>Aucun joueur dans l'équipe</Text>
          </View>
        }
      />
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
  headerCenter: { alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: THEME.TEXT },
  subtitle: { fontSize: 12, color: THEME.TEXT_SEC, marginTop: 2 },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: THEME.SURFACE,
    marginHorizontal: 24,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: THEME.TEXT },
  statLabel: { fontSize: 12, color: THEME.TEXT_SEC, marginTop: 4 },
  statDivider: { width: 1, height: 32, backgroundColor: THEME.BORDER },
  list: { paddingHorizontal: 24, paddingBottom: 24 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.SURFACE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  jerseyBadge: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: THEME.ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jerseyEmpty: { backgroundColor: THEME.BORDER },
  jerseyText: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  jerseyInput: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    width: 40,
  },
  playerInfo: { flex: 1, marginLeft: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  playerName: { fontSize: 16, fontWeight: '600', color: THEME.TEXT },
  captainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  captainText: { fontSize: 10, color: THEME.WARNING, marginLeft: 2, fontWeight: 'bold' },
  position: { fontSize: 12, color: THEME.TEXT_SEC, marginTop: 4 },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: { backgroundColor: THEME.BORDER },
  saveBtn: { backgroundColor: THEME.ACCENT },
  emptyState: { alignItems: 'center', paddingTop: 48 },
  emptyText: { color: THEME.TEXT_SEC, marginTop: 16, fontSize: 16 },
});

export default JerseyAssignmentScreen;
