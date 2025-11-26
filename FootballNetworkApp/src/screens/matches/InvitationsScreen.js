// ====== src/screens/matches/InvitationsScreen.js ======
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { matchesApi } from '../../services/api';

const THEME = {
  BG: '#0F172A',
  SURFACE: '#1E293B',
  TEXT: '#F8FAFC',
  TEXT_SEC: '#94A3B8',
  ACCENT: '#22C55E',
  BORDER: '#334155',
  DANGER: '#EF4444',
  PRIMARY: '#3B82F6',
};

// Carte d'invitation Reçue
const ReceivedInvitationCard = ({ invitation, onRespond }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.teamRow}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{invitation.senderTeam.name[0]}</Text>
        </View>
        <View>
          <Text style={styles.teamName}>{invitation.senderTeam.name}</Text>
          <Text style={styles.captainName}>
            Capitaine: {invitation.senderTeam.captain.firstName}
          </Text>
        </View>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>DÉFI</Text>
      </View>
    </View>

    <View style={styles.infoBlock}>
      <View style={styles.infoRow}>
        <Icon name="calendar" size={14} color={THEME.TEXT_SEC} />
        <Text style={styles.infoText}>
          {new Date(invitation.proposedDate).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      {invitation.location && (
        <View style={styles.infoRow}>
          <Icon name="map-pin" size={14} color={THEME.TEXT_SEC} />
          <Text style={styles.infoText}>{invitation.location.name}</Text>
        </View>
      )}
      {invitation.message && (
        <Text style={styles.message}>"{invitation.message}"</Text>
      )}
    </View>

    <View style={styles.actionsRow}>
      <TouchableOpacity
        style={[styles.actionBtn, styles.declineBtn]}
        onPress={() => onRespond(invitation.id, 'declined')}
      >
        <Icon name="x" size={18} color={THEME.DANGER} />
        <Text style={[styles.actionText, { color: THEME.DANGER }]}>
          Refuser
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionBtn, styles.acceptBtn]}
        onPress={() => onRespond(invitation.id, 'accepted')}
      >
        <Icon name="check" size={18} color="#000" />
        <Text style={[styles.actionText, { color: '#000' }]}>Accepter</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// Carte d'invitation Envoyée
const SentInvitationCard = ({ invitation, onCancel }) => (
  <View style={[styles.card, { opacity: 0.8 }]}>
    <View style={styles.cardHeader}>
      <View style={styles.teamRow}>
        <View
          style={[styles.avatarPlaceholder, { backgroundColor: '#3B82F6' }]}
        >
          <Icon name="arrow-right" size={20} color="#FFF" />
        </View>
        <View>
          <Text style={styles.labelSmall}>Envoyée à</Text>
          <Text style={styles.teamName}>{invitation.receiverTeam.name}</Text>
        </View>
      </View>
      <View style={[styles.badge, styles.pendingBadge]}>
        <Text style={[styles.badgeText, { color: '#F59E0B' }]}>EN ATTENTE</Text>
      </View>
    </View>

    <View style={styles.infoBlock}>
      <View style={styles.infoRow}>
        <Icon name="calendar" size={14} color={THEME.TEXT_SEC} />
        <Text style={styles.infoText}>
          {new Date(invitation.proposedDate).toLocaleDateString('fr-FR')}
        </Text>
      </View>
    </View>

    <TouchableOpacity
      style={styles.cancelLink}
      onPress={() => onCancel(invitation.id)}
    >
      <Text style={styles.cancelLinkText}>Annuler l'invitation</Text>
    </TouchableOpacity>
  </View>
);

export const InvitationsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('received');
  const [loading, setLoading] = useState(true);
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resReceived, resSent] = await Promise.all([
        matchesApi.getReceivedInvitations(),
        matchesApi.getSentInvitations(),
      ]);
      if (resReceived.success) setReceived(resReceived.data);
      if (resSent.success) setSent(resSent.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const handleRespond = async (id, response) => {
    const res = await matchesApi.respondToInvitation(id, response);
    if (res.success) {
      Alert.alert(
        'Succès',
        `Invitation ${response === 'accepted' ? 'acceptée' : 'refusée'}`,
      );
      loadData();
    } else {
      Alert.alert('Erreur', res.error);
    }
  };

  const handleCancel = async id => {
    Alert.alert('Annuler', 'Voulez-vous annuler cette invitation ?', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui',
        style: 'destructive',
        onPress: async () => {
          const res = await matchesApi.cancelInvitation(id);
          if (res.success) loadData();
        },
      },
    ]);
  };

  const list = activeTab === 'received' ? received : sent;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.BG} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon name="arrow-left" size={24} color={THEME.TEXT} />
        </TouchableOpacity>
        <Text style={styles.title}>Défis & Invitations</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'received' && styles.tabActive]}
          onPress={() => setActiveTab('received')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'received' && styles.tabTextActive,
            ]}
          >
            Reçus ({received.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && styles.tabActive]}
          onPress={() => setActiveTab('sent')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'sent' && styles.tabTextActive,
            ]}
          >
            Envoyés ({sent.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadData}
            tintColor={THEME.ACCENT}
          />
        }
      >
        {list.length === 0 && !loading ? (
          <View style={styles.empty}>
            <Icon name="inbox" size={48} color={THEME.TEXT_SEC} />
            <Text style={styles.emptyText}>
              Aucune invitation {activeTab === 'received' ? 'reçue' : 'envoyée'}
            </Text>
          </View>
        ) : (
          list.map(item =>
            activeTab === 'received' ? (
              <ReceivedInvitationCard
                key={item.id}
                invitation={item}
                onRespond={handleRespond}
              />
            ) : (
              <SentInvitationCard
                key={item.id}
                invitation={item}
                onCancel={handleCancel}
              />
            ),
          )
        )}
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: THEME.TEXT },

  tabs: { flexDirection: 'row', padding: 16, gap: 12 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: THEME.SURFACE,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  tabActive: { backgroundColor: THEME.ACCENT, borderColor: THEME.ACCENT },
  tabText: { color: THEME.TEXT_SEC, fontWeight: '600' },
  tabTextActive: { color: '#000' },

  content: { padding: 20 },

  // CARD
  card: {
    backgroundColor: THEME.SURFACE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  teamRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontWeight: 'bold', color: '#000', fontSize: 16 },
  teamName: { color: THEME.TEXT, fontWeight: 'bold', fontSize: 16 },
  captainName: { color: THEME.TEXT_SEC, fontSize: 12 },
  labelSmall: {
    color: THEME.TEXT_SEC,
    fontSize: 10,
    textTransform: 'uppercase',
  },

  badge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingBadge: { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
  badgeText: { color: THEME.ACCENT, fontSize: 10, fontWeight: 'bold' },

  infoBlock: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoText: { color: THEME.TEXT, fontSize: 14 },
  message: {
    color: THEME.TEXT_SEC,
    fontStyle: 'italic',
    fontSize: 13,
    marginTop: 8,
  },

  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
  },
  declineBtn: { borderColor: THEME.DANGER, backgroundColor: 'transparent' },
  acceptBtn: { backgroundColor: THEME.ACCENT, borderColor: THEME.ACCENT },
  actionText: { fontWeight: 'bold', fontSize: 14 },

  cancelLink: { alignSelf: 'center', padding: 8 },
  cancelLinkText: { color: THEME.TEXT_SEC, textDecorationLine: 'underline' },

  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: THEME.TEXT_SEC, marginTop: 16 },
});
