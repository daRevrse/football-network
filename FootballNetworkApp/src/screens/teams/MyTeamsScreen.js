// ====== src/screens/teams/MyTeamsScreen.js - NOUVEAU DESIGN + BACKEND ======
import React, { useState, useCallback, useEffect } from 'react';
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
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';
import { teamsApi } from '../../services/api';
import { LinearGradient } from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

// Composant TeamCard moderne
const TeamCard = ({ team, onPress, onManage }) => {
  const getRoleInfo = role => {
    if (role === 'owner' || role === 'captain')
      return { label: 'Capitaine', icon: 'award', color: '#F59E0B' };
    return { label: 'Membre', icon: 'user', color: '#22C55E' };
  };

  const roleInfo = getRoleInfo(team.role);

  return (
    <TouchableOpacity
      style={styles.teamCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F9FAFB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.teamCardGradient}
      >
        {/* Icon avec gradient */}
        <View style={styles.teamIconContainer}>
          <LinearGradient
            colors={['#22C55E', '#16A34A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.teamIcon}
          >
            <Icon name="shield" size={32} color="#FFF" />
          </LinearGradient>
        </View>

        {/* Info */}
        <View style={styles.teamInfo}>
          <View style={styles.teamHeader}>
            <Text style={styles.teamName}>{team.name}</Text>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: roleInfo.color + '20' },
              ]}
            >
              <Icon name={roleInfo.icon} size={12} color={roleInfo.color} />
              <Text style={[styles.roleText, { color: roleInfo.color }]}>
                {roleInfo.label}
              </Text>
            </View>
          </View>

          <View style={styles.teamStats}>
            <View style={styles.teamStat}>
              <Icon name="users" size={14} color="#6B7280" />
              <Text style={styles.teamStatText}>
                {team.member_count || 0} membres
              </Text>
            </View>
            <View style={styles.teamStat}>
              <Icon name="calendar" size={14} color="#6B7280" />
              <Text style={styles.teamStatText}>
                {team.matches_count || 0} matchs
              </Text>
            </View>
          </View>

          {team.description && (
            <Text style={styles.teamDescription} numberOfLines={2}>
              {team.description}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.teamActions}>
          {(team.role === 'owner' || team.role === 'captain') && (
            <TouchableOpacity
              style={styles.manageButton}
              onPress={e => {
                e.stopPropagation();
                onManage();
              }}
            >
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.manageButtonGradient}
              >
                <Icon name="settings" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          )}
          <Icon name="chevron-right" size={24} color="#CBD5E1" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Composant QuickStat
const QuickStat = ({ icon, value, label, gradient }) => (
  <View style={styles.quickStat}>
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.quickStatGradient}
    >
      <Icon name={icon} size={20} color="#FFF" />
      <Text style={styles.quickStatValue}>{value}</Text>
      <Text style={styles.quickStatLabel}>{label}</Text>
    </LinearGradient>
  </View>
);

// Composant EmptyState
const EmptyState = ({ onCreateTeam }) => (
  <View style={styles.emptyState}>
    <LinearGradient
      colors={['#22C55E20', '#22C55E10']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.emptyStateGradient}
    >
      <View style={styles.emptyIconContainer}>
        <Icon name="users" size={48} color="#22C55E" />
      </View>
      <Text style={styles.emptyTitle}>Aucune équipe</Text>
      <Text style={styles.emptyDescription}>
        Créez votre première équipe ou rejoignez-en une existante
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={onCreateTeam}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#22C55E', '#16A34A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyButtonGradient}
        >
          <Icon name="plus" size={20} color="#FFF" />
          <Text style={styles.emptyButtonText}>Créer une équipe</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  </View>
);

export const MyTeamsScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all, owner, member
  const [stats, setStats] = useState({
    totalTeams: 0,
    ownedTeams: 0,
    totalMembers: 0,
  });

  // Charger les équipes au focus de l'écran
  useFocusEffect(
    useCallback(() => {
      loadTeams();
    }, []),
  );

  const loadTeams = async () => {
    try {
      setLoading(true);
      const result = await teamsApi.getMyTeams();

      if (result.success) {
        setTeams(result.data);

        // Calculer les statistiques
        const ownedCount = result.data.filter(
          t => t.role === 'owner' || t.role === 'captain',
        ).length;
        const totalMembers = result.data.reduce(
          (sum, t) => sum + (t.currentPlayers || 0),
          0,
        );

        setStats({
          totalTeams: result.data.length,
          ownedTeams: ownedCount,
          totalMembers: totalMembers,
        });
      } else {
        Alert.alert(
          'Erreur',
          result.error || 'Impossible de charger les équipes',
        );
      }
    } catch (error) {
      console.error('Load teams error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTeams();
    setRefreshing(false);
  }, []);

  const handleTeamPress = team => {
    navigation.navigate('TeamDetail', {
      teamId: team.id,
      teamName: team.name,
    });
  };

  const handleManageTeam = team => {
    navigation.navigate('EditTeam', {
      teamId: team.id,
      teamName: team.name,
    });
  };

  const handleCreateTeam = () => {
    navigation.navigate('CreateTeam');
  };

  // Filtrer les équipes selon l'onglet actif
  const filteredTeams = teams.filter(team => {
    if (activeTab === 'owner') {
      return team.role === 'owner' || team.role === 'captain';
    }
    if (activeTab === 'member') {
      return team.role !== 'owner' && team.role !== 'captain';
    }
    return true;
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header avec gradient */}
      <LinearGradient
        colors={['#22C55E', '#16A34A', '#15803D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Mes Équipes</Text>
            <Text style={styles.headerSubtitle}>
              {teams.length} {teams.length > 1 ? 'équipes' : 'équipe'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => navigation.navigate('Search')}
          >
            <Icon name="search" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsContainer}>
          <QuickStat
            icon="users"
            value={stats.totalTeams}
            label="Équipes"
            gradient={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
          />
          <QuickStat
            icon="award"
            value={stats.ownedTeams}
            label="Capitaine"
            gradient={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
          />
          <QuickStat
            icon="user"
            value={stats.totalMembers}
            label="Membres"
            gradient={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
          />
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          {activeTab === 'all' ? (
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tabGradient}
            >
              <Icon name="list" size={16} color="#FFF" />
              <Text style={styles.tabTextActive}>Toutes</Text>
            </LinearGradient>
          ) : (
            <View style={styles.tabContent}>
              <Icon name="list" size={16} color="#6B7280" />
              <Text style={styles.tabText}>Toutes</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'owner' && styles.tabActive]}
          onPress={() => setActiveTab('owner')}
        >
          {activeTab === 'owner' ? (
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tabGradient}
            >
              <Icon name="award" size={16} color="#FFF" />
              <Text style={styles.tabTextActive}>Capitaine</Text>
            </LinearGradient>
          ) : (
            <View style={styles.tabContent}>
              <Icon name="award" size={16} color="#6B7280" />
              <Text style={styles.tabText}>Capitaine</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'member' && styles.tabActive]}
          onPress={() => setActiveTab('member')}
        >
          {activeTab === 'member' ? (
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tabGradient}
            >
              <Icon name="user" size={16} color="#FFF" />
              <Text style={styles.tabTextActive}>Membre</Text>
            </LinearGradient>
          ) : (
            <View style={styles.tabContent}>
              <Icon name="user" size={16} color="#6B7280" />
              <Text style={styles.tabText}>Membre</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Liste des équipes */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#22C55E']}
            tintColor="#22C55E"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredTeams.length === 0 ? (
          <EmptyState onCreateTeam={handleCreateTeam} />
        ) : (
          filteredTeams.map(team => (
            <TeamCard
              key={team.id}
              team={team}
              onPress={() => handleTeamPress(team)}
              onManage={() => handleManageTeam(team)}
            />
          ))
        )}
      </ScrollView>

      {/* Bouton Créer */}
      {teams.length > 0 && (
        <TouchableOpacity
          style={styles.fabButton}
          onPress={handleCreateTeam}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#22C55E', '#16A34A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Icon name="plus" size={28} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    ...SHADOWS.MEDIUM,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStat: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  quickStatGradient: {
    padding: 12,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 4,
  },
  quickStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tab: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tabActive: {
    ...SHADOWS.SMALL,
  },
  tabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    backgroundColor: '#F3F4F6',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  teamCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    ...SHADOWS.MEDIUM,
  },
  teamCardGradient: {
    padding: 16,
  },
  teamIconContainer: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  teamIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamInfo: {
    marginBottom: 12,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  teamName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  teamStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  teamStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamStatText: {
    fontSize: 13,
    color: '#6B7280',
  },
  teamDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  teamActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  manageButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  manageButtonGradient: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    paddingVertical: 60,
  },
  emptyStateGradient: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  fabButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: 28,
    overflow: 'hidden',
    ...SHADOWS.LARGE,
  },
  fabGradient: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
