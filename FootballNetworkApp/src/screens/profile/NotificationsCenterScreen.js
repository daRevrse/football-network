// ====== src/screens/profile/NotificationsCenterScreen.js - NOUVEAU DESIGN ======
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
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';

// Helper pour formater les dates
const formatTimestamp = timestamp => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Maintenant';
  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}j`;

  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

// Helper pour les types de notifications
const getNotificationTypeInfo = type => {
  const types = {
    match_invitation: { icon: 'calendar', gradient: ['#22C55E', '#16A34A'] },
    team_invitation: { icon: 'users', gradient: ['#F59E0B', '#D97706'] },
    match_confirmed: { icon: 'check-circle', gradient: ['#22C55E', '#16A34A'] },
    match_cancelled: { icon: 'x-circle', gradient: ['#EF4444', '#DC2626'] },
    team_update: { icon: 'info', gradient: ['#3B82F6', '#2563EB'] },
    new_message: { icon: 'message-circle', gradient: ['#EC4899', '#DB2777'] },
    system: { icon: 'bell', gradient: ['#6B7280', '#4B5563'] },
  };

  return types[type] || types.system;
};

// Composant NotificationItem
const NotificationItem = ({ notification, onPress, onDelete }) => {
  const typeInfo = getNotificationTypeInfo(notification.type);

  return (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !notification.read && styles.notificationCardUnread,
      ]}
      onPress={() => onPress(notification)}
      onLongPress={() => onDelete(notification.id)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={typeInfo.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.notificationIcon}
      >
        <Icon name={typeInfo.icon} size={22} color="#FFF" />
      </LinearGradient>

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            {notification.title}
          </Text>
          {!notification.read && <View style={styles.unreadDot} />}
        </View>

        <Text style={styles.notificationMessage} numberOfLines={2}>
          {notification.message}
        </Text>

        <Text style={styles.notificationTime}>
          {formatTimestamp(notification.timestamp)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Composant FilterChip
const FilterChip = ({ icon, label, active, onPress, gradient }) => (
  <TouchableOpacity
    style={[styles.filterChip, active && styles.filterChipActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    {active ? (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.filterChipGradient}
      >
        <Icon name={icon} size={16} color="#FFF" />
        <Text style={styles.filterChipTextActive}>{label}</Text>
      </LinearGradient>
    ) : (
      <View style={styles.filterChipContent}>
        <Icon name={icon} size={16} color="#6B7280" />
        <Text style={styles.filterChipText}>{label}</Text>
      </View>
    )}
  </TouchableOpacity>
);

export const NotificationsCenterScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'match_invitation',
      title: 'Nouvelle invitation de match',
      message: 'Les Tigres vous invitent à un match le 15 octobre à 18h00',
      timestamp: '2024-10-08T14:30:00',
      read: false,
    },
    {
      id: '2',
      type: 'team_invitation',
      title: 'Invitation à rejoindre une équipe',
      message: 'FC Lions vous invite à rejoindre leur équipe',
      timestamp: '2024-10-08T10:15:00',
      read: false,
    },
    {
      id: '3',
      type: 'match_confirmed',
      title: 'Match confirmé',
      message: 'Match contre Les Aigles confirmé pour demain à 16h00',
      timestamp: '2024-10-07T18:45:00',
      read: true,
    },
    {
      id: '4',
      type: 'system',
      title: 'Mise à jour disponible',
      message: "Une nouvelle version de l'application est disponible",
      timestamp: '2024-10-05T09:00:00',
      read: true,
    },
  ]);

  const filteredNotifications = notifications.filter(notif => {
    if (selectedFilter === 'unread') return !notif.read;
    if (selectedFilter === 'match') return notif.type.includes('match');
    if (selectedFilter === 'team') return notif.type.includes('team');
    if (selectedFilter === 'system') return notif.type === 'system';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const markAsRead = useCallback(notificationId => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif,
      ),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    Alert.alert('Succès', 'Toutes les notifications sont marquées comme lues');
  }, []);

  const deleteNotification = useCallback(notificationId => {
    Alert.alert('Supprimer', 'Supprimer cette notification ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          setNotifications(prev =>
            prev.filter(notif => notif.id !== notificationId),
          );
        },
      },
    ]);
  }, []);

  const clearAll = useCallback(() => {
    Alert.alert('Tout supprimer', 'Supprimer toutes les notifications ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => setNotifications([]),
      },
    ]);
  }, []);

  const handleNotificationPress = useCallback(
    notification => {
      if (!notification.read) {
        markAsRead(notification.id);
      }
      // Navigation selon le type
    },
    [markAsRead],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#3B82F6', '#2563EB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Icon name="bell" size={24} color="#FFF" />
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.headerButton} onPress={markAllAsRead}>
          <Icon name="check-circle" size={20} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          <FilterChip
            icon="list"
            label="Toutes"
            active={selectedFilter === 'all'}
            onPress={() => setSelectedFilter('all')}
            gradient={['#3B82F6', '#2563EB']}
          />
          <FilterChip
            icon="alert-circle"
            label="Non lues"
            active={selectedFilter === 'unread'}
            onPress={() => setSelectedFilter('unread')}
            gradient={['#EF4444', '#DC2626']}
          />
          <FilterChip
            icon="calendar"
            label="Matchs"
            active={selectedFilter === 'match'}
            onPress={() => setSelectedFilter('match')}
            gradient={['#22C55E', '#16A34A']}
          />
          <FilterChip
            icon="users"
            label="Équipes"
            active={selectedFilter === 'team'}
            onPress={() => setSelectedFilter('team')}
            gradient={['#F59E0B', '#D97706']}
          />
          <FilterChip
            icon="info"
            label="Système"
            active={selectedFilter === 'system'}
            onPress={() => setSelectedFilter('system')}
            gradient={['#6B7280', '#4B5563']}
          />
        </ScrollView>
      </View>

      {/* Liste */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onPress={handleNotificationPress}
              onDelete={deleteNotification}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['#F3F4F620', '#F3F4F610']}
              style={styles.emptyGradient}
            >
              <Icon name="bell-off" size={64} color="#CBD5E1" />
              <Text style={styles.emptyStateText}>Aucune notification</Text>
              <Text style={styles.emptyStateSubtext}>
                {selectedFilter === 'all'
                  ? 'Vous êtes à jour !'
                  : 'Aucune dans cette catégorie'}
              </Text>
            </LinearGradient>
          </View>
        )}

        {notifications.length > 0 && (
          <TouchableOpacity style={styles.clearAllButton} onPress={clearAll}>
            <LinearGradient
              colors={['#EF444415', '#EF444405']}
              style={styles.clearAllGradient}
            >
              <Icon name="trash-2" size={18} color="#EF4444" />
              <Text style={styles.clearAllText}>Tout supprimer</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    ...SHADOWS.MEDIUM,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filtersScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  filterChipActive: {
    ...SHADOWS.SMALL,
  },
  filterChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  filterChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
    backgroundColor: '#F3F4F6',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    ...SHADOWS.SMALL,
  },
  notificationCardUnread: {
    backgroundColor: '#DBEAFE',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyState: {
    marginTop: 60,
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
  },
  clearAllButton: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  clearAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  clearAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
});
