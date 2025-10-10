// ====== src/screens/profile/PrivacyScreen.js ======
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';
import { SectionCard } from '../../components/common/SectionCard';

export const PrivacyScreen = ({ navigation }) => {
  const isDark = useSelector(state => state.theme?.isDark || false);

  // États des paramètres de confidentialité
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public', // public, friends, private
    showEmail: false,
    showPhone: false,
    showLocation: true,
    showStats: true,
    allowMatchInvites: true,
    allowTeamInvites: true,
    allowMessages: 'everyone', // everyone, friends, nobody
    showOnlineStatus: true,
    showLastSeen: false,
  });

  const [blockedUsers] = useState([
    { id: '1', name: 'John Blocked', email: 'blocked@example.com' },
  ]);

  // Toggle paramètre
  const togglePrivacy = useCallback(key => {
    setPrivacy(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    // TODO: Sauvegarder en backend
  }, []);

  // Changer la visibilité du profil
  const handleChangeVisibility = useCallback(() => {
    Alert.alert(
      'Visibilité du profil',
      'Qui peut voir votre profil complet ?',
      [
        {
          text: 'Public',
          onPress: () =>
            setPrivacy(prev => ({ ...prev, profileVisibility: 'public' })),
        },
        {
          text: 'Amis uniquement',
          onPress: () =>
            setPrivacy(prev => ({ ...prev, profileVisibility: 'friends' })),
        },
        {
          text: 'Privé',
          onPress: () =>
            setPrivacy(prev => ({ ...prev, profileVisibility: 'private' })),
        },
        { text: 'Annuler', style: 'cancel' },
      ],
    );
  }, []);

  // Changer qui peut envoyer des messages
  const handleChangeMessaging = useCallback(() => {
    Alert.alert('Messagerie', 'Qui peut vous envoyer des messages ?', [
      {
        text: 'Tout le monde',
        onPress: () =>
          setPrivacy(prev => ({ ...prev, allowMessages: 'everyone' })),
      },
      {
        text: 'Amis uniquement',
        onPress: () =>
          setPrivacy(prev => ({ ...prev, allowMessages: 'friends' })),
      },
      {
        text: 'Personne',
        onPress: () =>
          setPrivacy(prev => ({ ...prev, allowMessages: 'nobody' })),
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }, []);

  // Bloquer un utilisateur
  const handleBlockUser = useCallback(() => {
    Alert.prompt(
      'Bloquer un utilisateur',
      "Entrez l'email ou le nom de l'utilisateur à bloquer",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Bloquer',
          style: 'destructive',
          onPress: value => {
            if (value && value.trim()) {
              // TODO: Appeler l'API pour bloquer l'utilisateur
              Alert.alert('Succès', 'Utilisateur bloqué');
            }
          },
        },
      ],
      'plain-text',
    );
  }, []);

  // Débloquer un utilisateur
  const handleUnblockUser = useCallback(user => {
    Alert.alert('Débloquer', `Voulez-vous débloquer ${user.name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Débloquer',
        onPress: () => {
          // TODO: Appeler l'API pour débloquer l'utilisateur
          Alert.alert('Succès', 'Utilisateur débloqué');
        },
      },
    ]);
  }, []);

  // Télécharger les données
  const handleDownloadData = useCallback(() => {
    Alert.alert(
      'Télécharger mes données',
      'Vous allez recevoir un email avec un lien pour télécharger toutes vos données (profil, équipes, matchs, messages). Cette opération peut prendre quelques minutes.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            // TODO: Appeler l'API pour générer l'export
            Alert.alert(
              'Demande envoyée',
              'Vous recevrez un email sous peu avec le lien de téléchargement.',
            );
          },
        },
      ],
    );
  }, []);

  // Supprimer les données
  const handleDeleteData = useCallback(() => {
    Alert.alert(
      'Supprimer mes données',
      'Cette action supprimera DÉFINITIVEMENT toutes vos données personnelles. Cette action est IRRÉVERSIBLE.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmation finale',
              'Êtes-vous VRAIMENT sûr ? Toutes vos données seront perdues pour toujours.',
              [
                { text: 'Non, garder mes données', style: 'cancel' },
                {
                  text: 'Oui, supprimer tout',
                  style: 'destructive',
                  onPress: () => {
                    // TODO: Appeler l'API pour supprimer les données
                    Alert.alert('Info', 'Suppression en cours...');
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }, []);

  // Obtenir le label de visibilité
  const getVisibilityLabel = () => {
    const labels = {
      public: 'Public',
      friends: 'Amis uniquement',
      private: 'Privé',
    };
    return labels[privacy.profileVisibility] || 'Public';
  };

  // Obtenir le label de messagerie
  const getMessagingLabel = () => {
    const labels = {
      everyone: 'Tout le monde',
      friends: 'Amis uniquement',
      nobody: 'Personne',
    };
    return labels[privacy.allowMessages] || 'Tout le monde';
  };

  // Composant Switch Item
  const SwitchItem = ({
    icon,
    label,
    description,
    value,
    onValueChange,
    iconColor,
  }) => (
    <View style={styles.switchItem}>
      <View style={styles.switchLeft}>
        <View
          style={[
            styles.switchIcon,
            {
              backgroundColor: iconColor
                ? `${iconColor}20`
                : COLORS.PRIMARY_LIGHT,
            },
          ]}
        >
          <Icon name={icon} size={20} color={iconColor || COLORS.PRIMARY} />
        </View>
        <View style={styles.switchContent}>
          <Text style={[styles.switchLabel, { color: COLORS.TEXT_PRIMARY }]}>
            {label}
          </Text>
          {description && (
            <Text
              style={[styles.switchDescription, { color: COLORS.TEXT_MUTED }]}
            >
              {description}
            </Text>
          )}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: COLORS.BORDER_LIGHT,
          true: COLORS.PRIMARY,
        }}
        thumbColor={COLORS.WHITE}
        ios_backgroundColor={COLORS.BORDER_LIGHT}
      />
    </View>
  );

  // Composant Menu Item
  const MenuItem = ({
    icon,
    label,
    value,
    onPress,
    iconColor,
    danger = false,
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <View
          style={[
            styles.menuIcon,
            {
              backgroundColor: danger
                ? COLORS.ERROR_LIGHT
                : iconColor
                ? `${iconColor}20`
                : COLORS.PRIMARY_LIGHT,
            },
          ]}
        >
          <Icon
            name={icon}
            size={20}
            color={danger ? COLORS.ERROR : iconColor || COLORS.PRIMARY}
          />
        </View>
        <Text
          style={[
            styles.menuLabel,
            { color: danger ? COLORS.ERROR : COLORS.TEXT_PRIMARY },
          ]}
        >
          {label}
        </Text>
      </View>
      <View style={styles.menuRight}>
        {value && (
          <Text style={[styles.menuValue, { color: COLORS.TEXT_MUTED }]}>
            {value}
          </Text>
        )}
        <Icon name="chevron-right" size={20} color={COLORS.TEXT_MUTED} />
      </View>
    </TouchableOpacity>
  );

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
          <Icon name="shield" size={24} color={COLORS.WHITE} />
          <Text style={styles.headerTitle}>Confidentialité</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Visibilité du profil */}
        <SectionCard
          title="Visibilité du profil"
          description="Contrôlez qui peut voir vos informations"
          icon="eye"
        >
          <MenuItem
            icon="globe"
            label="Visibilité du profil"
            value={getVisibilityLabel()}
            onPress={handleChangeVisibility}
          />

          <SwitchItem
            icon="mail"
            label="Afficher mon email"
            value={privacy.showEmail}
            onValueChange={() => togglePrivacy('showEmail')}
            iconColor="#3B82F6"
          />

          <SwitchItem
            icon="phone"
            label="Afficher mon téléphone"
            value={privacy.showPhone}
            onValueChange={() => togglePrivacy('showPhone')}
            iconColor="#10B981"
          />

          <SwitchItem
            icon="map-pin"
            label="Afficher ma localisation"
            value={privacy.showLocation}
            onValueChange={() => togglePrivacy('showLocation')}
            iconColor="#F59E0B"
          />

          <SwitchItem
            icon="bar-chart-2"
            label="Afficher mes statistiques"
            value={privacy.showStats}
            onValueChange={() => togglePrivacy('showStats')}
            iconColor="#8B5CF6"
          />
        </SectionCard>

        {/* Interactions */}
        <SectionCard
          title="Interactions"
          description="Gérez qui peut interagir avec vous"
          icon="users"
        >
          <SwitchItem
            icon="calendar"
            label="Recevoir des invitations de match"
            description="Autoriser les autres équipes à vous inviter"
            value={privacy.allowMatchInvites}
            onValueChange={() => togglePrivacy('allowMatchInvites')}
          />

          <SwitchItem
            icon="user-plus"
            label="Recevoir des invitations d'équipe"
            description="Autoriser les équipes à vous recruter"
            value={privacy.allowTeamInvites}
            onValueChange={() => togglePrivacy('allowTeamInvites')}
          />

          <MenuItem
            icon="message-circle"
            label="Messagerie"
            value={getMessagingLabel()}
            onPress={handleChangeMessaging}
            iconColor="#3B82F6"
          />
        </SectionCard>

        {/* Présence */}
        <SectionCard
          title="Présence"
          description="Contrôlez votre visibilité en ligne"
          icon="activity"
        >
          <SwitchItem
            icon="circle"
            label="Afficher mon statut en ligne"
            description="Les autres peuvent voir si vous êtes en ligne"
            value={privacy.showOnlineStatus}
            onValueChange={() => togglePrivacy('showOnlineStatus')}
            iconColor="#10B981"
          />

          <SwitchItem
            icon="clock"
            label="Afficher ma dernière connexion"
            description="Les autres peuvent voir quand vous étiez en ligne"
            value={privacy.showLastSeen}
            onValueChange={() => togglePrivacy('showLastSeen')}
            iconColor="#F59E0B"
          />
        </SectionCard>

        {/* Utilisateurs bloqués */}
        <SectionCard
          title="Utilisateurs bloqués"
          description={`${blockedUsers.length} utilisateur${
            blockedUsers.length > 1 ? 's' : ''
          } bloqué${blockedUsers.length > 1 ? 's' : ''}`}
          icon="slash"
          iconColor={COLORS.ERROR}
        >
          {blockedUsers.length > 0 ? (
            blockedUsers.map(user => (
              <View key={user.id} style={styles.blockedUser}>
                <View style={styles.blockedUserLeft}>
                  <View
                    style={[
                      styles.blockedUserAvatar,
                      { backgroundColor: COLORS.ERROR_LIGHT },
                    ]}
                  >
                    <Icon name="user-x" size={20} color={COLORS.ERROR} />
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.blockedUserName,
                        { color: COLORS.TEXT_PRIMARY },
                      ]}
                    >
                      {user.name}
                    </Text>
                    <Text
                      style={[
                        styles.blockedUserEmail,
                        { color: COLORS.TEXT_MUTED },
                      ]}
                    >
                      {user.email}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.unblockButton,
                    { backgroundColor: COLORS.PRIMARY_LIGHT },
                  ]}
                  onPress={() => handleUnblockUser(user)}
                >
                  <Text
                    style={[
                      styles.unblockButtonText,
                      { color: COLORS.PRIMARY },
                    ]}
                  >
                    Débloquer
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={[styles.noBlockedUsers, { color: COLORS.TEXT_MUTED }]}>
              Aucun utilisateur bloqué
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.blockButton,
              { backgroundColor: COLORS.ERROR_LIGHT },
            ]}
            onPress={handleBlockUser}
          >
            <Icon name="user-x" size={20} color={COLORS.ERROR} />
            <Text style={[styles.blockButtonText, { color: COLORS.ERROR }]}>
              Bloquer un utilisateur
            </Text>
          </TouchableOpacity>
        </SectionCard>

        {/* Données personnelles */}
        <SectionCard
          title="Mes données"
          description="RGPD - Gérez vos données personnelles"
          icon="database"
        >
          <MenuItem
            icon="download"
            label="Télécharger mes données"
            onPress={handleDownloadData}
            iconColor="#3B82F6"
          />

          <MenuItem
            icon="trash-2"
            label="Supprimer toutes mes données"
            onPress={handleDeleteData}
            danger
          />
        </SectionCard>

        {/* Informations légales */}
        <View style={styles.legalInfo}>
          <Icon name="info" size={16} color={COLORS.TEXT_MUTED} />
          <Text style={[styles.legalText, { color: COLORS.TEXT_MUTED }]}>
            Conformément au RGPD, vous avez le droit d'accéder, de modifier et
            de supprimer vos données personnelles.
          </Text>
        </View>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
    paddingVertical: DIMENSIONS.SPACING_LG,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DIMENSIONS.SPACING_MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: DIMENSIONS.SPACING_MD,
  },
  switchIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.SPACING_MD,
  },
  switchContent: {
    flex: 1,
  },
  switchLabel: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.MEDIUM,
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: FONTS.SIZE.SM,
    lineHeight: FONTS.SIZE.SM * 1.3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DIMENSIONS.SPACING_MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.SPACING_MD,
  },
  menuLabel: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.MEDIUM,
    flex: 1,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_SM,
  },
  menuValue: {
    fontSize: FONTS.SIZE.SM,
  },
  blockedUser: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DIMENSIONS.SPACING_MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  blockedUserLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  blockedUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.SPACING_MD,
  },
  blockedUserName: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  blockedUserEmail: {
    fontSize: FONTS.SIZE.SM,
  },
  unblockButton: {
    paddingHorizontal: DIMENSIONS.SPACING_MD,
    paddingVertical: DIMENSIONS.SPACING_SM,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
  },
  unblockButtonText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  noBlockedUsers: {
    fontSize: FONTS.SIZE.SM,
    textAlign: 'center',
    paddingVertical: DIMENSIONS.SPACING_MD,
  },
  blockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    marginTop: DIMENSIONS.SPACING_SM,
    gap: DIMENSIONS.SPACING_SM,
  },
  blockButtonText: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  legalInfo: {
    flexDirection: 'row',
    gap: DIMENSIONS.SPACING_SM,
    padding: DIMENSIONS.SPACING_MD,
    backgroundColor: COLORS.WHITE,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    marginTop: DIMENSIONS.SPACING_LG,
  },
  legalText: {
    flex: 1,
    fontSize: FONTS.SIZE.SM,
    lineHeight: FONTS.SIZE.SM * 1.5,
  },
});
