// ====== src/screens/profile/SettingsScreen.js ======
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
  Linking,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';
import { SectionCard } from '../../components/common/SectionCard';

export const SettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const isDark = useSelector(state => state.theme?.isDark || false);

  // États des paramètres
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    matchInvitations: true,
    teamUpdates: true,
    messages: true,
    marketing: false,
  });

  const [preferences, setPreferences] = useState({
    darkMode: isDark,
    language: 'fr',
    soundEffects: true,
    vibration: true,
  });

  // Toggle notification
  const toggleNotification = useCallback(key => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    // TODO: Sauvegarder en backend
  }, []);

  // Toggle préférence
  const togglePreference = useCallback(key => {
    setPreferences(prev => {
      const newValue = !prev[key];

      // Cas spécial pour le dark mode
      if (key === 'darkMode') {
        // TODO: Dispatch action pour changer le thème
        // dispatch(toggleTheme());
      }

      return {
        ...prev,
        [key]: newValue,
      };
    });
  }, []);

  // Changer la langue
  const handleChangeLanguage = useCallback(() => {
    Alert.alert('Changer la langue', 'Quelle langue préférez-vous ?', [
      {
        text: 'Français',
        onPress: () => setPreferences(prev => ({ ...prev, language: 'fr' })),
      },
      {
        text: 'English',
        onPress: () => setPreferences(prev => ({ ...prev, language: 'en' })),
      },
      {
        text: 'Español',
        onPress: () => setPreferences(prev => ({ ...prev, language: 'es' })),
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }, []);

  // Vider le cache
  const handleClearCache = useCallback(() => {
    Alert.alert(
      'Vider le cache',
      "Êtes-vous sûr de vouloir vider le cache de l'application ?",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vider',
          style: 'destructive',
          onPress: () => {
            // TODO: Vider le cache
            Alert.alert('Succès', 'Cache vidé avec succès');
          },
        },
      ],
    );
  }, []);

  // Ouvrir les liens externes
  const openURL = useCallback(url => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Erreur', "Impossible d'ouvrir ce lien");
      }
    });
  }, []);

  // Contacter le support
  const handleContactSupport = useCallback(() => {
    const email = 'support@footballnetwork.com';
    const subject = 'Support - Football Network';
    openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}`);
  }, [openURL]);

  // Déconnexion
  const handleLogout = useCallback(() => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: () => {
          // TODO: Dispatch logout action
          // dispatch(logout());
          Alert.alert('Info', 'Déconnexion en cours...');
        },
      },
    ]);
  }, []);

  // Supprimer le compte
  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est IRRÉVERSIBLE. Toutes vos données seront définitivement supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmation finale',
              'Êtes-vous VRAIMENT sûr ? Cette action ne peut pas être annulée.',
              [
                { text: 'Non, garder mon compte', style: 'cancel' },
                {
                  text: 'Oui, supprimer',
                  style: 'destructive',
                  onPress: () => {
                    // TODO: Appeler API de suppression
                    Alert.alert('Info', 'Suppression du compte...');
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }, []);

  // Composant pour les items de menu
  const MenuItem = ({
    icon,
    label,
    onPress,
    rightText,
    showChevron = true,
    iconColor,
    danger = false,
  }) => (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: COLORS.WHITE }]}
      onPress={onPress}
    >
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
        {rightText && (
          <Text style={[styles.menuValue, { color: COLORS.TEXT_MUTED }]}>
            {rightText}
          </Text>
        )}
        {showChevron && (
          <Icon name="chevron-right" size={20} color={COLORS.TEXT_MUTED} />
        )}
      </View>
    </TouchableOpacity>
  );

  // Composant pour les items avec switch
  const SwitchItem = ({ icon, label, value, onValueChange, iconColor }) => (
    <View style={[styles.menuItem, { backgroundColor: COLORS.WHITE }]}>
      <View style={styles.menuLeft}>
        <View
          style={[
            styles.menuIcon,
            {
              backgroundColor: iconColor
                ? `${iconColor}20`
                : COLORS.PRIMARY_LIGHT,
            },
          ]}
        >
          <Icon name={icon} size={20} color={iconColor || COLORS.PRIMARY} />
        </View>
        <Text style={[styles.menuLabel, { color: COLORS.TEXT_PRIMARY }]}>
          {label}
        </Text>
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

  const languageLabels = {
    fr: 'Français',
    en: 'English',
    es: 'Español',
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
          <Icon name="settings" size={24} color={COLORS.WHITE} />
          <Text style={styles.headerTitle}>Paramètres</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Compte */}
        <SectionCard
          title="Compte"
          description="Gérez votre compte"
          icon="user"
        >
          <MenuItem
            icon="user"
            label="Modifier mon profil"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <MenuItem
            icon="lock"
            label="Changer le mot de passe"
            onPress={() =>
              Alert.alert('Info', 'Fonctionnalité bientôt disponible')
            }
          />
          <MenuItem
            icon="shield"
            label="Confidentialité"
            onPress={() => navigation.navigate('Privacy')}
          />
        </SectionCard>

        {/* Notifications */}
        <SectionCard
          title="Notifications"
          description="Gérez vos notifications"
          icon="bell"
        >
          <SwitchItem
            icon="bell"
            label="Notifications push"
            value={notifications.push}
            onValueChange={() => toggleNotification('push')}
          />
          <SwitchItem
            icon="mail"
            label="Notifications email"
            value={notifications.email}
            onValueChange={() => toggleNotification('email')}
          />
          <SwitchItem
            icon="calendar"
            label="Invitations de match"
            value={notifications.matchInvitations}
            onValueChange={() => toggleNotification('matchInvitations')}
          />
          <SwitchItem
            icon="users"
            label="Mises à jour d'équipe"
            value={notifications.teamUpdates}
            onValueChange={() => toggleNotification('teamUpdates')}
          />
          <SwitchItem
            icon="message-circle"
            label="Messages"
            value={notifications.messages}
            onValueChange={() => toggleNotification('messages')}
          />
          <SwitchItem
            icon="tag"
            label="Offres et promotions"
            value={notifications.marketing}
            onValueChange={() => toggleNotification('marketing')}
          />
        </SectionCard>

        {/* Préférences */}
        <SectionCard
          title="Préférences"
          description="Personnalisez l'application"
          icon="sliders"
        >
          <SwitchItem
            icon="moon"
            label="Mode sombre"
            value={preferences.darkMode}
            onValueChange={() => togglePreference('darkMode')}
            iconColor="#8B5CF6"
          />
          <MenuItem
            icon="globe"
            label="Langue"
            rightText={languageLabels[preferences.language]}
            onPress={handleChangeLanguage}
            iconColor="#3B82F6"
          />
          <SwitchItem
            icon="volume-2"
            label="Effets sonores"
            value={preferences.soundEffects}
            onValueChange={() => togglePreference('soundEffects')}
            iconColor="#F59E0B"
          />
          <SwitchItem
            icon="smartphone"
            label="Vibrations"
            value={preferences.vibration}
            onValueChange={() => togglePreference('vibration')}
            iconColor="#10B981"
          />
        </SectionCard>

        {/* Application */}
        <SectionCard
          title="Application"
          description="Infos et aide"
          icon="info"
        >
          <MenuItem
            icon="trash-2"
            label="Vider le cache"
            onPress={handleClearCache}
            showChevron={false}
            iconColor="#F59E0B"
          />
          <MenuItem
            icon="life-buoy"
            label="Centre d'aide"
            onPress={() => navigation.navigate('Help')}
            iconColor="#3B82F6"
          />
          <MenuItem
            icon="mail"
            label="Contacter le support"
            onPress={handleContactSupport}
            showChevron={false}
            iconColor="#8B5CF6"
          />
          <MenuItem
            icon="file-text"
            label="Conditions d'utilisation"
            onPress={() => openURL('https://footballnetwork.com/terms')}
            iconColor="#6B7280"
          />
          <MenuItem
            icon="shield"
            label="Politique de confidentialité"
            onPress={() => openURL('https://footballnetwork.com/privacy')}
            iconColor="#6B7280"
          />
          <MenuItem
            icon="info"
            label="À propos"
            rightText="v1.0.0"
            onPress={() =>
              Alert.alert(
                'Football Network',
                'Version 1.0.0\n© 2025 Football Network',
              )
            }
            iconColor="#10B981"
          />
        </SectionCard>

        {/* Actions dangereuses */}
        <SectionCard
          title="Zone de danger"
          description="Actions irréversibles"
          icon="alert-triangle"
          iconColor={COLORS.ERROR}
        >
          <MenuItem
            icon="log-out"
            label="Se déconnecter"
            onPress={handleLogout}
            showChevron={false}
            danger
          />
          <MenuItem
            icon="trash-2"
            label="Supprimer mon compte"
            onPress={handleDeleteAccount}
            showChevron={false}
            danger
          />
        </SectionCard>

        {/* Info utilisateur */}
        <View style={styles.userInfo}>
          <Text style={[styles.userInfoText, { color: COLORS.TEXT_MUTED }]}>
            Connecté en tant que
          </Text>
          <Text style={[styles.userInfoEmail, { color: COLORS.TEXT_PRIMARY }]}>
            {user?.email || 'utilisateur@example.com'}
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
  userInfo: {
    alignItems: 'center',
    paddingVertical: DIMENSIONS.SPACING_XL,
  },
  userInfoText: {
    fontSize: FONTS.SIZE.SM,
    marginBottom: DIMENSIONS.SPACING_XXS,
  },
  userInfoEmail: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
});
