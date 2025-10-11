// ====== src/screens/teams/MyTeamsScreen.js - NOUVEAU DESIGN ======
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
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';

const { width } = Dimensions.get('window');

// Composant TeamCard moderne
const TeamCard = ({ team, onPress, onManage }) => {
  const getRoleInfo = role => {
    if (role === 'owner')
      return { label: 'Capitaine', icon: 'crown', color: '#F59E0B' };
    if (role === 'captain')
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
            <Text style={styles.teamName} numberOfLines={1}>
              {team.name}
            </Text>
            {team.role && (
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
            )}
          </View>

          <View style={styles.teamStats}>
            <View style={styles.teamStat}>
              <Icon name="users" size={14} color="#6B7280" />
              <Text style={styles.teamStatText}>
                {team.members || 0} membres
              </Text>
            </View>
            <View style={styles.teamStat}>
              <Icon name="calendar" size={14} color="#6B7280" />
              <Text style={styles.teamStatText}>
                {team.matchesCount || 0} matchs
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
          {team.role === 'owner' && (
            <TouchableOpacity
              style={styles.manageButton}
              onPress={e => {
                e.stopPropagation();
                onManage(team);
              }}
            >
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
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

export const MyTeamsScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all, owner, member

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      // TODO: Appeler l'API
      // const result = await TeamApi.getMyTeams();
      // setTeams(result.data);

      // Mock data
      setTeams([
        {
          id: '1',
          name: 'Les Tigres de Paris',
          description: 'Équipe compétitive cherchant à gagner tous les matchs',
          members: 11,
          matchesCount: 24,
          role: 'owner',
        },
        {
          id: '2',
          name: 'FC Montmartre',
          description: 'Football amateur et convivial',
          members: 9,
          matchesCount: 15,
          role: 'captain',
        },
        {
          id: '3',
          name: 'Racing Club 75',
          members: 15,
          matchesCount: 32,
          role: null,
        },
      ]);
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTeams();
    setRefreshing(false);
  }, []);

  const handleCreateTeam = () => {
    navigation.navigate('CreateTeam');
  };

  const handleTeamPress = team => {
    navigation.navigate('TeamDetail', { teamId: team.id, teamName: team.name });
  };

  const handleManageTeam = team => {
    navigation.navigate('EditTeam', { teamId: team.id });
  };

  const filteredTeams = teams.filter(team => {
    if (activeTab === 'owner') return team.role === 'owner';
    if (activeTab === 'member') return !team.role || team.role === 'captain';
    return true;
  });

  const stats = {
    total: teams.length,
    owner: teams.filter(t => t.role === 'owner').length,
    member: teams.filter(t => !t.role || t.role === 'captain').length,
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header avec gradient */}
      <LinearGradient
        colors={['#F59E0B', '#D97706']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Mes Équipes</Text>
            <Text style={styles.headerSubtitle}>
              {teams.length} équipe{teams.length > 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => navigation.navigate('SearchTeams')}
          >
            <Icon name="search" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Stats rapides */}
        <View style={styles.quickStatsContainer}>
          <QuickStat
            icon="shield"
            value={stats.total}
            label="Total"
            gradient={['#FFFFFF30', '#FFFFFF20']}
          />
          <QuickStat
            icon="crown"
            value={stats.owner}
            label="Capitaine"
            gradient={['#FFFFFF30', '#FFFFFF20']}
          />
          <QuickStat
            icon="users"
            value={stats.member}
            label="Membre"
            gradient={['#FFFFFF30', '#FFFFFF20']}
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
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tabGradient}
            >
              <Icon name="list" size={18} color="#FFF" />
              <Text style={styles.tabTextActive}>Toutes</Text>
            </LinearGradient>
          ) : (
            <View style={styles.tabContent}>
              <Icon name="list" size={18} color="#6B7280" />
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
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tabGradient}
            >
              <Icon name="crown" size={18} color="#FFF" />
              <Text style={styles.tabTextActive}>Mes équipes</Text>
            </LinearGradient>
          ) : (
            <View style={styles.tabContent}>
              <Icon name="crown" size={18} color="#6B7280" />
              <Text style={styles.tabText}>Mes équipes</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'member' && styles.tabActive]}
          onPress={() => setActiveTab('member')}
        >
          {activeTab === 'member' ? (
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tabGradient}
            >
              <Icon name="users" size={18} color="#FFF" />
              <Text style={styles.tabTextActive}>Membre</Text>
            </LinearGradient>
          ) : (
            <View style={styles.tabContent}>
              <Icon name="users" size={18} color="#6B7280" />
              <Text style={styles.tabText}>Membre</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Liste des équipes */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F59E0B"
          />
        }
      >
        {filteredTeams.length > 0 ? (
          filteredTeams.map(team => (
            <TeamCard
              key={team.id}
              team={team}
              onPress={() => handleTeamPress(team)}
              onManage={handleManageTeam}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['#F3F4F620', '#F3F4F610']}
              style={styles.emptyGradient}
            >
              <Icon name="users" size={64} color="#CBD5E1" />
              <Text style={styles.emptyStateText}>
                {activeTab === 'all'
                  ? 'Aucune équipe'
                  : 'Aucune équipe dans cette catégorie'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Créez votre première équipe ou rejoignez-en une !
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={handleCreateTeam}
              >
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.emptyStateButtonGradient}
                >
                  <Icon name="plus" size={18} color="#FFF" />
                  <Text style={styles.emptyStateButtonText}>
                    Créer une équipe
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bouton flottant */}
      <TouchableOpacity
        style={styles.fabContainer}
        onPress={handleCreateTeam}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <Icon name="plus" size={28} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
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
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    marginTop: 40,
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyGradient: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyStateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  emptyStateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 28,
    ...SHADOWS.MEDIUM,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
