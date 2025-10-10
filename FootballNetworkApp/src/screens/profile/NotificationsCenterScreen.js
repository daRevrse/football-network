// ====== src/screens/profile/NotificationsCenterScreen.js ======
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
import { COLORS, DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';

export const NotificationsCenterScreen = ({ navigation }) => {
  const isDark = useSelector(state => state.theme?.isDark || false);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, unread, match, team, system

  // Données fictives des notifications (à remplacer par des données du backend)
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'match_invitation',
      title: 'Nouvelle invitation de match',
      message: 'Les Tigres vous invitent à un match le 15 octobre à 18h00',
      timestamp: '2024-10-08T14:30:00',
      read: false,
      data: { matchId: '123', teamName: 'Les Tigres' },
    },
    {
      id: '2',
      type: 'team_invitation',
      title: 'Invitation à rejoindre une équipe',
      message: 'FC Lions vous invite à rejoindre leur équipe',
      timestamp: '2024-10-08T10:15:00',
      read: false,
      data: { teamId: '456', teamName: 'FC Lions' },
    },
    {
      id: '3',
      type: 'match_confirmed',
      title: 'Match confirmé',
      message: 'Votre match contre Les Aigles est confirmé pour demain à 16h00',
      timestamp: '2024-10-07T18:45:00',
      read: true,
      data: { matchId: '789', teamName: 'Les Aigles' },
    },
    {
      id: '4',
      type: 'match_cancelled',
      title: 'Match annulé',
      message: 'Le match du 12 octobre contre Les Panthères a été annulé',
      timestamp: '2024-10-07T14:20:00',
      read: true,
      data: { matchId: '321', teamName: 'Les Panthères' },
    },
    {
      id: '5',
      type: 'team_update',
      title: "Mise à jour d'équipe",
      message: 'Votre équipe FC Lions a un nouveau logo',
      timestamp: '2024-10-06T16:30:00',
      read: true,
      data: { teamId: '456' },
    },
    {
      id: '6',
      type: 'new_message',
      title: 'Nouveau message',
      message: 'Jean Dupont : "Salut, prêt pour le match de demain ?"',
      timestamp: '2024-10-06T12:00:00',
      read: true,
      data: { matchId: '789', userId: '999' },
    },
    {
      id: '7',
      type: 'system',
      title: 'Mise à jour disponible',
      message: "Une nouvelle version de l'application est disponible",
      timestamp: '2024-10-05T09:00:00',
      read: true,
      data: {},
    },
  ]);

  // Filtrer les notifications
  const filteredNotifications = notifications.filter(notif => {
    if (selectedFilter === 'unread') return !notif.read;
    if (selectedFilter === 'match') return notif.type.includes('match');
    if (selectedFilter === 'team') return notif.type.includes('team');
    if (selectedFilter === 'system') return notif.type === 'system';
    return true; // all
  });

  // Stats
  const unreadCount = notifications.filter(n => !n.read).length;

  // Rafraîchir
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // TODO: Recharger les notifications depuis l'API
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Marquer une notification comme lue
  const markAsRead = useCallback(notificationId => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif,
      ),
    );
    // TODO: Appeler l'API pour marquer comme lue
  }, []);

  // Marquer toutes comme lues
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    // TODO: Appeler l'API pour marquer toutes comme lues
    Alert.alert(
      'Succès',
      'Toutes les notifications ont été marquées comme lues',
    );
  }, []);

  // Supprimer une notification
  const deleteNotification = useCallback(notificationId => {
    Alert.alert('Supprimer', 'Voulez-vous supprimer cette notification ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          setNotifications(prev =>
            prev.filter(notif => notif.id !== notificationId),
          );
          // TODO: Appeler l'API pour supprimer
        },
      },
    ]);
  }, []);

  // Tout supprimer
  const clearAll = useCallback(() => {
    Alert.alert(
      'Tout supprimer',
      'Voulez-vous supprimer toutes les notifications ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setNotifications([]);
            // TODO: Appeler l'API pour tout supprimer
          },
        },
      ],
    );
  }, []);

  // Gérer le clic sur une notification
  const handleNotificationPress = useCallback(
    notification => {
      // Marquer comme lue
      if (!notification.read) {
        markAsRead(notification.id);
      }

      // Navigation selon le type
      switch (notification.type) {
        case 'match_invitation':
        case 'match_confirmed':
        case 'match_cancelled':
          // TODO: Navigation vers le détail du match
          Alert.alert(
            'Info',
            `Navigation vers le match ${notification.data.matchId}`,
          );
          // navigation.navigate('MatchDetail', { matchId: notification.data.matchId });
          break;

        case 'team_invitation':
        case 'team_update':
          // TODO: Navigation vers le détail de l'équipe
          Alert.alert(
            'Info',
            `Navigation vers l\'équipe ${notification.data.teamId}`,
          );
          // navigation.navigate('TeamDetail', { teamId: notification.data.teamId });
          break;

        case 'new_message':
          // TODO: Navigation vers le chat
          Alert.alert('Info', 'Navigation vers le chat');
          break;

        case 'system':
          // TODO: Action système
          Alert.alert('Info', notification.message);
          break;

        default:
          break;
      }
    },
    [markAsRead],
  );

  // Obtenir l'icône selon le type
  const getNotificationIcon = type => {
    const icons = {
      match_invitation: 'calendar',
      match_confirmed: 'check-circle',
      match_cancelled: 'x-circle',
      team_invitation: 'users',
      team_update: 'bell',
      new_message: 'message-circle',
      system: 'info',
    };
    return icons[type] || 'bell';
  };

  // Obtenir la couleur selon le type
  const getNotificationColor = type => {
    const colors = {
      match_invitation: COLORS.PRIMARY,
      match_confirmed: COLORS.SUCCESS,
      match_cancelled: COLORS.ERROR,
      team_invitation: COLORS.WARNING,
      team_update: '#3B82F6',
      new_message: '#8B5CF6',
      system: '#6B7280',
    };
    return colors[type] || COLORS.PRIMARY;
  };

  // Formater la date
  const formatTimestamp = timestamp => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <View
      style={[styles.container, { backgroundColor: COLORS.BACKGROUND_LIGHT }]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.PRIMARY }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Icon name="bell" size={24} color={COLORS.WHITE} />
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.moreButton}
          onPress={() =>
            Alert.alert('Options', 'Que voulez-vous faire ?', [
              { text: 'Tout marquer comme lu', onPress: markAllAsRead },
              {
                text: 'Tout supprimer',
                onPress: clearAll,
                style: 'destructive',
              },
              { text: 'Annuler', style: 'cancel' },
            ])
          }
        >
          <Icon name="more-vertical" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedFilter === 'all' ? COLORS.PRIMARY : COLORS.WHITE,
              },
            ]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color:
                    selectedFilter === 'all'
                      ? COLORS.WHITE
                      : COLORS.TEXT_PRIMARY,
                },
              ]}
            >
              Toutes ({notifications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedFilter === 'unread' ? COLORS.ERROR : COLORS.WHITE,
              },
            ]}
            onPress={() => setSelectedFilter('unread')}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color:
                    selectedFilter === 'unread'
                      ? COLORS.WHITE
                      : COLORS.TEXT_PRIMARY,
                },
              ]}
            >
              Non lues ({unreadCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedFilter === 'match' ? COLORS.SUCCESS : COLORS.WHITE,
              },
            ]}
            onPress={() => setSelectedFilter('match')}
          >
            <Icon
              name="calendar"
              size={16}
              color={
                selectedFilter === 'match' ? COLORS.WHITE : COLORS.TEXT_PRIMARY
              }
            />
            <Text
              style={[
                styles.filterChipText,
                {
                  color:
                    selectedFilter === 'match'
                      ? COLORS.WHITE
                      : COLORS.TEXT_PRIMARY,
                },
              ]}
            >
              Matchs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedFilter === 'team' ? COLORS.WARNING : COLORS.WHITE,
              },
            ]}
            onPress={() => setSelectedFilter('team')}
          >
            <Icon
              name="users"
              size={16}
              color={
                selectedFilter === 'team' ? COLORS.WHITE : COLORS.TEXT_PRIMARY
              }
            />
            <Text
              style={[
                styles.filterChipText,
                {
                  color:
                    selectedFilter === 'team'
                      ? COLORS.WHITE
                      : COLORS.TEXT_PRIMARY,
                },
              ]}
            >
              Équipes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedFilter === 'system' ? '#6B7280' : COLORS.WHITE,
              },
            ]}
            onPress={() => setSelectedFilter('system')}
          >
            <Icon
              name="info"
              size={16}
              color={
                selectedFilter === 'system' ? COLORS.WHITE : COLORS.TEXT_PRIMARY
              }
            />
            <Text
              style={[
                styles.filterChipText,
                {
                  color:
                    selectedFilter === 'system'
                      ? COLORS.WHITE
                      : COLORS.TEXT_PRIMARY,
                },
              ]}
            >
              Système
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Liste des notifications */}
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
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                {
                  backgroundColor: notification.read
                    ? COLORS.WHITE
                    : `${COLORS.PRIMARY}10`,
                },
              ]}
              onPress={() => handleNotificationPress(notification)}
              onLongPress={() => deleteNotification(notification.id)}
            >
              <View
                style={[
                  styles.notificationIcon,
                  {
                    backgroundColor: `${getNotificationColor(
                      notification.type,
                    )}20`,
                  },
                ]}
              >
                <Icon
                  name={getNotificationIcon(notification.type)}
                  size={24}
                  color={getNotificationColor(notification.type)}
                />
              </View>

              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text
                    style={[
                      styles.notificationTitle,
                      {
                        color: COLORS.TEXT_PRIMARY,
                        fontWeight: notification.read
                          ? FONTS.WEIGHT.MEDIUM
                          : FONTS.WEIGHT.BOLD,
                      },
                    ]}
                  >
                    {notification.title}
                  </Text>
                  {!notification.read && (
                    <View
                      style={[
                        styles.unreadDot,
                        { backgroundColor: COLORS.PRIMARY },
                      ]}
                    />
                  )}
                </View>

                <Text
                  style={[
                    styles.notificationMessage,
                    { color: COLORS.TEXT_SECONDARY },
                  ]}
                  numberOfLines={2}
                >
                  {notification.message}
                </Text>

                <View style={styles.notificationFooter}>
                  <Icon name="clock" size={14} color={COLORS.TEXT_MUTED} />
                  <Text
                    style={[
                      styles.notificationTime,
                      { color: COLORS.TEXT_MUTED },
                    ]}
                  >
                    {formatTimestamp(notification.timestamp)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteNotification(notification.id)}
              >
                <Icon name="x" size={20} color={COLORS.TEXT_MUTED} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: COLORS.BACKGROUND_LIGHT },
              ]}
            >
              <Icon name="bell-off" size={48} color={COLORS.TEXT_MUTED} />
            </View>
            <Text style={[styles.emptyTitle, { color: COLORS.TEXT_PRIMARY }]}>
              Aucune notification
            </Text>
            <Text
              style={[
                styles.emptyDescription,
                { color: COLORS.TEXT_SECONDARY },
              ]}
            >
              {selectedFilter === 'all'
                ? 'Vous êtes à jour !'
                : `Aucune notification ${
                    selectedFilter === 'unread' ? 'non lue' : selectedFilter
                  }`}
            </Text>
          </View>
        )}

        {/* Espace en bas */}
        <View style={{ height: DIMENSIONS.SPACING_XXL }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: DIMENSIONS.SPACING_MD,
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.SMALL,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DIMENSIONS.SPACING_SM,
  },
  headerTitle: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.WHITE,
  },
  badge: {
    backgroundColor: COLORS.ERROR,
    paddingHorizontal: DIMENSIONS.SPACING_SM,
    paddingVertical: 2,
    borderRadius: DIMENSIONS.BORDER_RADIUS_FULL,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: FONTS.SIZE.XS,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.WHITE,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    backgroundColor: COLORS.WHITE,
    paddingVertical: DIMENSIONS.SPACING_SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  filtersContent: {
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
    gap: DIMENSIONS.SPACING_SM,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING_MD,
    paddingVertical: DIMENSIONS.SPACING_SM,
    borderRadius: DIMENSIONS.BORDER_RADIUS_FULL,
    gap: DIMENSIONS.SPACING_XXS,
    ...SHADOWS.SMALL,
  },
  filterChipText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
    paddingVertical: DIMENSIONS.SPACING_MD,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    marginBottom: DIMENSIONS.SPACING_SM,
    ...SHADOWS.SMALL,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.SPACING_MD,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_SM,
    marginBottom: DIMENSIONS.SPACING_XXS,
  },
  notificationTitle: {
    flex: 1,
    fontSize: FONTS.SIZE.MD,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationMessage: {
    fontSize: FONTS.SIZE.SM,
    lineHeight: FONTS.SIZE.SM * 1.4,
    marginBottom: DIMENSIONS.SPACING_XS,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_XXS,
  },
  notificationTime: {
    fontSize: FONTS.SIZE.XS,
  },
  deleteButton: {
    padding: DIMENSIONS.SPACING_XS,
  },
  emptyState: {
    alignItems: 'center',
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
  emptyDescription: {
    fontSize: FONTS.SIZE.MD,
    textAlign: 'center',
  },
});
