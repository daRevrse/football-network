// ====== src/screens/matches/InvitationsScreen.js - NOUVEAU DESIGN + BACKEND ======
import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';
import { matchesApi } from '../../services/api';

// Helper pour formater les dates
const formatDate = dateString => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 1) return "À l'instant";
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;

  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

// Composant InvitationCard
const InvitationCard = ({ invitation, onAccept, onDecline, type }) => {
  const [processing, setProcessing] = useState(false);

  const handleAccept = async () => {
    setProcessing(true);
    await onAccept(invitation.id);
    setProcessing(false);
  };

  const handleDecline = async () => {
    setProcessing(true);
    await onDecline(invitation.id);
    setProcessing(false);
  };

  return (
    <View style={styles.invitationCard}>
      <LinearGradient
        colors={['#FFFFFF', '#F9FAFB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.invitationCardGradient}
      >
        {/* Header */}
        <View style={styles.invitationHeader}>
          <View style={styles.invitationIconContainer}>
            <LinearGradient
              colors={
                type === 'received'
                  ? ['#22C55E', '#16A34A']
                  : ['#3B82F6', '#2563EB']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.invitationIcon}
            >
              <Icon name="mail" size={20} color="#FFF" />
            </LinearGradient>
          </View>
          <View style={styles.invitationHeaderText}>
            <Text style={styles.invitationTeam}>
              {type === 'received'
                ? `${invitation.senderTeam.name}`
                : `${invitation.receiverTeam.name}`}
            </Text>
            <Text style={styles.invitationDate}>
              {formatDate(invitation.sentAt)}
            </Text>
          </View>
          {type === 'received' && invitation.status === 'pending' && (
            <View style={styles.pendingBadge}>
              <Icon name="clock" size={12} color="#F59E0B" />
            </View>
          )}
        </View>

        {/* Match Info */}
        <View style={styles.matchInfo}>
          <View style={styles.matchInfoRow}>
            <Icon name="calendar" size={14} color="#6B7280" />
            <Text style={styles.matchInfoText}>
              {new Date(invitation.proposedDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          {invitation.location && (
            <View style={styles.matchInfoRow}>
              <Icon name="map-pin" size={14} color="#6B7280" />
              <Text style={styles.matchInfoText}>
                {invitation.location?.name}
              </Text>
            </View>
          )}
        </View>

        {/* Message */}
        {invitation.message && (
          <View style={styles.messageContainer}>
            <Icon name="message-circle" size={14} color="#9CA3AF" />
            <Text style={styles.messageText}>{invitation.message}</Text>
          </View>
        )}

        {/* Actions */}
        {type === 'received' && invitation.status === 'pending' && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={handleDecline}
              disabled={processing}
              activeOpacity={0.7}
            >
              <Icon name="x" size={18} color="#EF4444" />
              <Text style={styles.declineText}>Refuser</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAccept}
              disabled={processing}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.acceptGradient}
              >
                {processing ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Icon name="check" size={18} color="#FFF" />
                    <Text style={styles.acceptText}>Accepter</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Status Badge pour sent */}
        {type === 'sent' && invitation.status !== 'pending' && (
          <View style={styles.statusBadgeContainer}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    invitation.status === 'accepted'
                      ? '#22C55E20'
                      : '#EF444420',
                },
              ]}
            >
              <Icon
                name={
                  invitation.status === 'accepted' ? 'check-circle' : 'x-circle'
                }
                size={12}
                color={invitation.status === 'accepted' ? '#22C55E' : '#EF4444'}
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  {
                    color:
                      invitation.status === 'accepted' ? '#22C55E' : '#EF4444',
                  },
                ]}
              >
                {invitation.status === 'accepted' ? 'Acceptée' : 'Refusée'}
              </Text>
            </View>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

// Composant EmptyState
const EmptyState = ({ type }) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconContainer}>
      <Icon name="inbox" size={48} color="#D1D5DB" />
    </View>
    <Text style={styles.emptyTitle}>
      {type === 'received'
        ? 'Aucune invitation reçue'
        : 'Aucune invitation envoyée'}
    </Text>
    <Text style={styles.emptyDescription}>
      {type === 'received'
        ? 'Vous recevrez des invitations lorsque des équipes voudront jouer contre vous'
        : 'Créez un match pour envoyer des invitations'}
    </Text>
  </View>
);

export const InvitationsScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received'); // received, sent
  const [receivedInvitations, setReceivedInvitations] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadInvitations();
    }, []),
  );

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const [receivedResult, sentResult] = await Promise.all([
        matchesApi.getReceivedInvitations(),
        matchesApi.getSentInvitations(),
      ]);

      if (receivedResult.success) {
        setReceivedInvitations(receivedResult.data);
        console.log('received', receivedResult.data);
      }

      if (sentResult.success) {
        setSentInvitations(sentResult.data);
        console.log('sent', sentResult.data);
      }
    } catch (error) {
      console.error('Load invitations error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInvitations();
    setRefreshing(false);
  }, []);

  const handleAcceptInvitation = async invitationId => {
    try {
      const result = await matchesApi.respondToInvitation(
        invitationId,
        'accepted',
      );

      if (result.success) {
        Alert.alert('Succès', 'Invitation acceptée !');
        loadInvitations();
      } else {
        Alert.alert('Erreur', result.error);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const handleDeclineInvitation = async invitationId => {
    Alert.alert(
      "Refuser l'invitation",
      'Êtes-vous sûr de vouloir refuser cette invitation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await matchesApi.respondToInvitation(
                invitationId,
                'declined',
              );

              if (result.success) {
                Alert.alert('Invitation refusée');
                loadInvitations();
              } else {
                Alert.alert('Erreur', result.error);
              }
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue');
            }
          },
        },
      ],
    );
  };

  const pendingReceivedCount = receivedInvitations.filter(
    i => i.status === 'pending',
  ).length;

  if (loading) {
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

      {/* Header */}
      <LinearGradient
        colors={['#22C55E', '#16A34A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invitations</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{pendingReceivedCount}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{receivedInvitations.length}</Text>
            <Text style={styles.statLabel}>Reçues</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{sentInvitations.length}</Text>
            <Text style={styles.statLabel}>Envoyées</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'received' && styles.tabActive]}
          onPress={() => setActiveTab('received')}
        >
          {activeTab === 'received' ? (
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tabGradient}
            >
              <Icon name="inbox" size={16} color="#FFF" />
              <Text style={styles.tabTextActive}>
                Reçues {pendingReceivedCount > 0 && `(${pendingReceivedCount})`}
              </Text>
            </LinearGradient>
          ) : (
            <View style={styles.tabContent}>
              <Icon name="inbox" size={16} color="#6B7280" />
              <Text style={styles.tabText}>
                Reçues {pendingReceivedCount > 0 && `(${pendingReceivedCount})`}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && styles.tabActive]}
          onPress={() => setActiveTab('sent')}
        >
          {activeTab === 'sent' ? (
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tabGradient}
            >
              <Icon name="send" size={16} color="#FFF" />
              <Text style={styles.tabTextActive}>Envoyées</Text>
            </LinearGradient>
          ) : (
            <View style={styles.tabContent}>
              <Icon name="send" size={16} color="#6B7280" />
              <Text style={styles.tabText}>Envoyées</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Liste */}
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
        {activeTab === 'received' ? (
          receivedInvitations.length === 0 ? (
            <EmptyState type="received" />
          ) : (
            receivedInvitations.map(invitation => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                type="received"
                onAccept={handleAcceptInvitation}
                onDecline={handleDeclineInvitation}
              />
            ))
          )
        ) : sentInvitations.length === 0 ? (
          <EmptyState type="sent" />
        ) : (
          sentInvitations.map(invitation => (
            <InvitationCard
              key={invitation.id}
              invitation={invitation}
              type="sent"
              onAccept={() => {}}
              onDecline={() => {}}
            />
          ))
        )}
      </ScrollView>
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
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
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
  invitationCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    ...SHADOWS.MEDIUM,
  },
  invitationCardGradient: {
    padding: 16,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  invitationIconContainer: {
    marginRight: 12,
  },
  invitationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invitationHeaderText: {
    flex: 1,
  },
  invitationTeam: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  invitationDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  pendingBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchInfo: {
    gap: 8,
    marginBottom: 12,
  },
  matchInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchInfoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    gap: 6,
  },
  declineText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  acceptButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  acceptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  statusBadgeContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
