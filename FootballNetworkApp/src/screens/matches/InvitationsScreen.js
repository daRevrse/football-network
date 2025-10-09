// ====== src/screens/matches/InvitationsScreen.js ======
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  StatusBar,
  RefreshControl,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';

// Composant TabButton
const TabButton = ({ label, count, active, onPress, COLORS }) => (
  <TouchableOpacity
    style={[styles.tabButton, active && { backgroundColor: COLORS.PRIMARY }]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.tabButtonText,
        { color: active ? COLORS.WHITE : COLORS.TEXT_SECONDARY },
      ]}
    >
      {label}
    </Text>
    {count > 0 && (
      <View
        style={[
          styles.countBadge,
          {
            backgroundColor: active ? COLORS.WHITE : COLORS.PRIMARY_LIGHT,
          },
        ]}
      >
        <Text
          style={[
            styles.countText,
            {
              color: active ? COLORS.PRIMARY : COLORS.WHITE,
            },
          ]}
        >
          {count}
        </Text>
      </View>
    )}
  </TouchableOpacity>
);

// Composant InvitationCard (reçues)
const InvitationCard = ({
  invitation,
  onAccept,
  onDecline,
  onPress,
  COLORS,
}) => (
  <TouchableOpacity
    style={[styles.invitationCard, { backgroundColor: COLORS.WHITE }]}
    onPress={onPress}
  >
    {/* Header */}
    <View style={styles.cardHeader}>
      <View
        style={[
          styles.senderAvatar,
          { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT },
        ]}
      >
        <Icon name="user" size={20} color={COLORS.PRIMARY} />
      </View>
      <View style={styles.senderInfo}>
        <Text style={[styles.senderName, { color: COLORS.TEXT_PRIMARY }]}>
          {invitation.sender}
        </Text>
        <Text style={[styles.invitationTime, { color: COLORS.TEXT_MUTED }]}>
          {invitation.sentTime}
        </Text>
      </View>
      <View
        style={[
          styles.matchTypeBadge,
          {
            backgroundColor:
              invitation.matchType === 'friendly'
                ? COLORS.PRIMARY_LIGHT
                : invitation.matchType === 'competitive'
                ? COLORS.WARNING_LIGHT
                : COLORS.SECONDARY_LIGHT,
          },
        ]}
      >
        <Icon
          name={
            invitation.matchType === 'friendly'
              ? 'smile'
              : invitation.matchType === 'competitive'
              ? 'zap'
              : 'trophy'
          }
          size={12}
          color={
            invitation.matchType === 'friendly'
              ? COLORS.PRIMARY
              : invitation.matchType === 'competitive'
              ? COLORS.WARNING
              : COLORS.SECONDARY
          }
        />
      </View>
    </View>

    {/* Match Info */}
    <View style={styles.matchInfo}>
      <View style={styles.teamsRow}>
        <View
          style={[
            styles.teamIcon,
            { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT },
          ]}
        >
          <Icon name="dribbble" size={16} color={COLORS.PRIMARY} />
        </View>
        <Text style={[styles.teamText, { color: COLORS.TEXT_PRIMARY }]}>
          {invitation.homeTeam}
        </Text>
        <Text style={[styles.vsText, { color: COLORS.TEXT_MUTED }]}>vs</Text>
        <Text style={[styles.teamText, { color: COLORS.TEXT_PRIMARY }]}>
          {invitation.awayTeam}
        </Text>
        <View
          style={[styles.teamIcon, { backgroundColor: COLORS.SECONDARY_LIGHT }]}
        >
          <Icon name="dribbble" size={16} color={COLORS.SECONDARY} />
        </View>
      </View>

      <View style={styles.matchDetails}>
        <View style={styles.detailItem}>
          <Icon name="calendar" size={14} color={COLORS.TEXT_MUTED} />
          <Text style={[styles.detailText, { color: COLORS.TEXT_SECONDARY }]}>
            {invitation.date}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="clock" size={14} color={COLORS.TEXT_MUTED} />
          <Text style={[styles.detailText, { color: COLORS.TEXT_SECONDARY }]}>
            {invitation.time}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="map-pin" size={14} color={COLORS.TEXT_MUTED} />
          <Text style={[styles.detailText, { color: COLORS.TEXT_SECONDARY }]}>
            {invitation.location}
          </Text>
        </View>
      </View>
    </View>

    {/* Actions */}
    <View style={styles.cardActions}>
      <TouchableOpacity
        style={[
          styles.actionButton,
          styles.declineButton,
          { borderColor: COLORS.TEXT_MUTED },
        ]}
        onPress={onDecline}
      >
        <Icon name="x" size={18} color={COLORS.TEXT_MUTED} />
        <Text style={[styles.actionText, { color: COLORS.TEXT_MUTED }]}>
          Décliner
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.actionButton,
          styles.acceptButton,
          { backgroundColor: COLORS.PRIMARY },
        ]}
        onPress={onAccept}
      >
        <Icon name="check" size={18} color={COLORS.WHITE} />
        <Text style={[styles.actionText, { color: COLORS.WHITE }]}>
          Accepter
        </Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

// Composant SentInvitationCard (envoyées)
const SentInvitationCard = ({ invitation, onCancel, onPress, COLORS }) => (
  <TouchableOpacity
    style={[styles.invitationCard, { backgroundColor: COLORS.WHITE }]}
    onPress={onPress}
  >
    {/* Header */}
    <View style={styles.cardHeader}>
      <View
        style={[
          styles.senderAvatar,
          { backgroundColor: COLORS.SECONDARY_LIGHT },
        ]}
      >
        <Icon name="user" size={20} color={COLORS.SECONDARY} />
      </View>
      <View style={styles.senderInfo}>
        <Text style={[styles.senderName, { color: COLORS.TEXT_PRIMARY }]}>
          {invitation.recipient}
        </Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  invitation.status === 'accepted'
                    ? COLORS.SUCCESS
                    : invitation.status === 'declined'
                    ? COLORS.ERROR
                    : COLORS.WARNING,
              },
            ]}
          />
          <Text style={[styles.statusText, { color: COLORS.TEXT_MUTED }]}>
            {invitation.status === 'accepted'
              ? 'Acceptée'
              : invitation.status === 'declined'
              ? 'Déclinée'
              : 'En attente'}
          </Text>
        </View>
      </View>
      {invitation.status === 'pending' && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Icon name="x-circle" size={20} color={COLORS.ERROR} />
        </TouchableOpacity>
      )}
    </View>

    {/* Match Info */}
    <View style={styles.matchInfo}>
      <View style={styles.teamsRow}>
        <View
          style={[
            styles.teamIcon,
            { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT },
          ]}
        >
          <Icon name="dribbble" size={16} color={COLORS.PRIMARY} />
        </View>
        <Text style={[styles.teamText, { color: COLORS.TEXT_PRIMARY }]}>
          {invitation.homeTeam}
        </Text>
        <Text style={[styles.vsText, { color: COLORS.TEXT_MUTED }]}>vs</Text>
        <Text style={[styles.teamText, { color: COLORS.TEXT_PRIMARY }]}>
          {invitation.awayTeam}
        </Text>
        <View
          style={[styles.teamIcon, { backgroundColor: COLORS.SECONDARY_LIGHT }]}
        >
          <Icon name="dribbble" size={16} color={COLORS.SECONDARY} />
        </View>
      </View>

      <View style={styles.matchDetails}>
        <View style={styles.detailItem}>
          <Icon name="calendar" size={14} color={COLORS.TEXT_MUTED} />
          <Text style={[styles.detailText, { color: COLORS.TEXT_SECONDARY }]}>
            {invitation.date}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="clock" size={14} color={COLORS.TEXT_MUTED} />
          <Text style={[styles.detailText, { color: COLORS.TEXT_SECONDARY }]}>
            {invitation.time}
          </Text>
        </View>
      </View>
    </View>

    {/* Footer */}
    <View style={styles.sentFooter}>
      <Text style={[styles.sentTime, { color: COLORS.TEXT_MUTED }]}>
        Envoyée {invitation.sentTime}
      </Text>
    </View>
  </TouchableOpacity>
);

// Composant EmptyState
const EmptyState = ({ icon, title, message, COLORS }) => (
  <View style={styles.emptyState}>
    <View
      style={[
        styles.emptyIcon,
        { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT },
      ]}
    >
      <Icon name={icon} size={48} color={COLORS.PRIMARY} />
    </View>
    <Text style={[styles.emptyTitle, { color: COLORS.TEXT_PRIMARY }]}>
      {title}
    </Text>
    <Text style={[styles.emptyMessage, { color: COLORS.TEXT_SECONDARY }]}>
      {message}
    </Text>
  </View>
);

export const InvitationsScreen = ({ navigation }) => {
  const { colors: COLORS, isDark } = useTheme('auto');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('received'); // received, sent

  // Données mockées (à remplacer par API)
  const [receivedInvitations] = useState([
    {
      id: 1,
      sender: 'Jean Dupont',
      homeTeam: 'Les Tigres de Paris',
      awayTeam: 'FC Olympique',
      date: 'Sam 20 Avril',
      time: '15:00',
      location: 'Stade Municipal',
      matchType: 'friendly',
      sentTime: 'Il y a 2h',
    },
    {
      id: 2,
      sender: 'Marie Martin',
      homeTeam: 'Racing Club 75',
      awayTeam: 'AS Montparnasse',
      date: 'Dim 21 Avril',
      time: '10:30',
      location: 'Terrain Synthétique',
      matchType: 'competitive',
      sentTime: 'Il y a 5h',
    },
    {
      id: 3,
      sender: 'Thomas Dubois',
      homeTeam: 'FC Montmartre',
      awayTeam: 'Paris United',
      date: 'Sam 27 Avril',
      time: '14:00',
      location: 'Parc des Sports',
      matchType: 'tournament',
      sentTime: 'Hier',
    },
  ]);

  const [sentInvitations] = useState([
    {
      id: 1,
      recipient: 'Sophie Bernard',
      homeTeam: 'Les Tigres de Paris',
      awayTeam: 'FC Saint-Germain',
      date: 'Sam 20 Avril',
      time: '15:00',
      status: 'accepted',
      sentTime: 'il y a 1 jour',
    },
    {
      id: 2,
      recipient: 'Pierre Leroy',
      homeTeam: 'Les Tigres de Paris',
      awayTeam: 'AS Belleville',
      date: 'Dim 28 Avril',
      time: '10:30',
      status: 'pending',
      sentTime: 'il y a 3h',
    },
    {
      id: 3,
      recipient: 'Julie Moreau',
      homeTeam: 'Les Tigres de Paris',
      awayTeam: 'RC Paris',
      date: 'Sam 04 Mai',
      time: '16:00',
      status: 'declined',
      sentTime: 'il y a 2 jours',
    },
    {
      id: 4,
      recipient: 'Lucas Simon',
      homeTeam: 'Les Tigres de Paris',
      awayTeam: 'FC Bastille',
      date: 'Dim 05 Mai',
      time: '11:00',
      status: 'pending',
      sentTime: 'il y a 1h',
    },
  ]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleAcceptInvitation = invitationId => {
    Alert.alert(
      "Accepter l'invitation",
      'Voulez-vous accepter cette invitation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: () => {
            Alert.alert('Succès', 'Invitation acceptée !');
          },
        },
      ],
    );
  };

  const handleDeclineInvitation = invitationId => {
    Alert.alert(
      "Décliner l'invitation",
      'Voulez-vous décliner cette invitation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Décliner',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Info', 'Invitation déclinée');
          },
        },
      ],
    );
  };

  const handleCancelInvitation = invitationId => {
    Alert.alert(
      "Annuler l'invitation",
      'Voulez-vous annuler cette invitation ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Info', 'Invitation annulée');
          },
        },
      ],
    );
  };

  const handleInvitationPress = matchId => {
    navigation.navigate('MatchDetail', { matchId });
  };

  return (
    <View
      style={[styles.container, { backgroundColor: COLORS.BACKGROUND_LIGHT }]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.WHITE }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: COLORS.TEXT_PRIMARY }]}>
            Invitations
          </Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Tabs */}
        <View
          style={[styles.tabs, { backgroundColor: COLORS.BACKGROUND_LIGHT }]}
        >
          <TabButton
            label="Reçues"
            count={receivedInvitations.length}
            active={activeTab === 'received'}
            onPress={() => setActiveTab('received')}
            COLORS={COLORS}
          />
          <TabButton
            label="Envoyées"
            count={sentInvitations.filter(i => i.status === 'pending').length}
            active={activeTab === 'sent'}
            onPress={() => setActiveTab('sent')}
            COLORS={COLORS}
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'received' && (
          <>
            {receivedInvitations.length === 0 ? (
              <EmptyState
                icon="inbox"
                title="Aucune invitation"
                message="Vous n'avez pas d'invitation en attente"
                COLORS={COLORS}
              />
            ) : (
              <View style={styles.invitationsList}>
                {receivedInvitations.map(invitation => (
                  <InvitationCard
                    key={invitation.id}
                    invitation={invitation}
                    onAccept={() => handleAcceptInvitation(invitation.id)}
                    onDecline={() => handleDeclineInvitation(invitation.id)}
                    onPress={() => handleInvitationPress(invitation.id)}
                    COLORS={COLORS}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {activeTab === 'sent' && (
          <>
            {sentInvitations.length === 0 ? (
              <EmptyState
                icon="send"
                title="Aucune invitation envoyée"
                message="Vous n'avez envoyé aucune invitation"
                COLORS={COLORS}
              />
            ) : (
              <View style={styles.invitationsList}>
                {sentInvitations.map(invitation => (
                  <SentInvitationCard
                    key={invitation.id}
                    invitation={invitation}
                    onCancel={() => handleCancelInvitation(invitation.id)}
                    onPress={() => handleInvitationPress(invitation.id)}
                    COLORS={COLORS}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: DIMENSIONS.SPACING_MD,
    ...SHADOWS.SMALL,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONTS.SIZE.XL,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  headerPlaceholder: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: DIMENSIONS.CONTAINER_PADDING,
    padding: 4,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DIMENSIONS.SPACING_SM,
    borderRadius: DIMENSIONS.BORDER_RADIUS_SM,
    gap: DIMENSIONS.SPACING_XS,
  },
  tabButtonText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: DIMENSIONS.SPACING_XS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: FONTS.SIZE.XXS,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: DIMENSIONS.CONTAINER_PADDING,
    paddingBottom: DIMENSIONS.SPACING_XXL,
  },
  invitationsList: {
    gap: DIMENSIONS.SPACING_MD,
  },
  invitationCard: {
    padding: DIMENSIONS.SPACING_LG,
    borderRadius: DIMENSIONS.BORDER_RADIUS_LG,
    ...SHADOWS.MEDIUM,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  senderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.SPACING_MD,
  },
  senderInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    marginBottom: 2,
  },
  invitationTime: {
    fontSize: FONTS.SIZE.XS,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_XS,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: FONTS.SIZE.XS,
  },
  matchTypeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    padding: DIMENSIONS.SPACING_XS,
  },
  matchInfo: {
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DIMENSIONS.SPACING_SM,
    gap: DIMENSIONS.SPACING_SM,
  },
  teamIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  vsText: {
    fontSize: FONTS.SIZE.XS,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  matchDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DIMENSIONS.SPACING_MD,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_XS,
  },
  detailText: {
    fontSize: FONTS.SIZE.SM,
  },
  cardActions: {
    flexDirection: 'row',
    gap: DIMENSIONS.SPACING_SM,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    gap: DIMENSIONS.SPACING_XS,
  },
  declineButton: {
    borderWidth: 2,
  },
  acceptButton: {
    ...SHADOWS.SMALL,
  },
  actionText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  sentFooter: {
    paddingTop: DIMENSIONS.SPACING_SM,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  sentTime: {
    fontSize: FONTS.SIZE.XS,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DIMENSIONS.SPACING_XXL * 2,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_LG,
  },
  emptyTitle: {
    fontSize: FONTS.SIZE.XL,
    fontWeight: FONTS.WEIGHT.BOLD,
    marginBottom: DIMENSIONS.SPACING_SM,
  },
  emptyMessage: {
    fontSize: FONTS.SIZE.MD,
    textAlign: 'center',
    paddingHorizontal: DIMENSIONS.SPACING_XL,
  },
});
