// ====== src/screens/profile/SettingsScreen.js - NOUVEAU DESIGN ======
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
import LinearGradient from 'react-native-linear-gradient';
import { DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';

// Composant MenuItem moderne
const MenuItem = ({ icon, label, onPress, gradient, showChevron = true }) => (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.menuLeft}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.menuIconContainer}
      >
        <Icon name={icon} size={20} color="#FFF" />
      </LinearGradient>
      <Text style={styles.menuLabel}>{label}</Text>
    </View>
    {showChevron && <Icon name="chevron-right" size={22} color="#CBD5E1" />}
  </TouchableOpacity>
);

// Composant SwitchItem moderne
const SwitchItem = ({
  icon,
  label,
  description,
  value,
  onValueChange,
  gradient,
}) => (
  <View style={styles.switchItem}>
    <View style={styles.switchLeft}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.switchIconContainer}
      >
        <Icon name={icon} size={20} color="#FFF" />
      </LinearGradient>
      <View style={styles.switchTextContainer}>
        <Text style={styles.switchLabel}>{label}</Text>
        {description && (
          <Text style={styles.switchDescription}>{description}</Text>
        )}
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#E5E7EB', true: '#86EFAC' }}
      thumbColor={value ? '#22C55E' : '#F3F4F6'}
      ios_backgroundColor="#E5E7EB"
    />
  </View>
);

// Composant Section
const Section = ({ title, description, icon, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Icon name={icon} size={20} color="#22C55E" />
      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {description && (
          <Text style={styles.sectionDescription}>{description}</Text>
        )}
      </View>
    </View>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

export const SettingsScreen = ({ navigation }) => {
  const user = useSelector(state => state.auth.user);

  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    matchInvitations: true,
    teamUpdates: true,
    messages: true,
    marketing: false,
  });

  const [preferences, setPreferences] = useState({
    darkMode: false,
    soundEffects: true,
    vibration: true,
  });

  const toggleNotification = useCallback(key => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const togglePreference = useCallback(key => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const handleChangeLanguage = useCallback(() => {
    Alert.alert('Langue', 'Quelle langue préférez-vous ?', [
      { text: 'Français', onPress: () => {} },
      { text: 'English', onPress: () => {} },
      { text: 'Español', onPress: () => {} },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }, []);

  const handleClearCache = useCallback(() => {
    Alert.alert('Vider le cache', 'Êtes-vous sûr de vouloir vider le cache ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Vider',
        style: 'destructive',
        onPress: () => Alert.alert('Succès', 'Cache vidé'),
      },
    ]);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header avec gradient */}
      <LinearGradient
        colors={['#22C55E', '#16A34A']}
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
          <Icon name="settings" size={24} color="#FFF" />
          <Text style={styles.headerTitle}>Paramètres</Text>
        </View>

        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Compte */}
        <Section
          title="Compte"
          description="Gérez votre profil et sécurité"
          icon="user"
        >
          <MenuItem
            icon="edit-3"
            label="Modifier mon profil"
            onPress={() => navigation.navigate('EditProfile')}
            gradient={['#22C55E', '#16A34A']}
          />
          <MenuItem
            icon="lock"
            label="Changer le mot de passe"
            onPress={() => Alert.alert('Info', 'Bientôt disponible')}
            gradient={['#3B82F6', '#2563EB']}
          />
          <MenuItem
            icon="shield"
            label="Confidentialité"
            onPress={() => navigation.navigate('Privacy')}
            gradient={['#8B5CF6', '#7C3AED']}
          />
        </Section>

        {/* Notifications */}
        <Section
          title="Notifications"
          description="Configurez vos préférences"
          icon="bell"
        >
          <SwitchItem
            icon="bell"
            label="Notifications push"
            description="Recevoir des notifications sur l'app"
            value={notifications.push}
            onValueChange={() => toggleNotification('push')}
            gradient={['#22C55E', '#16A34A']}
          />
          <SwitchItem
            icon="mail"
            label="Notifications email"
            description="Recevoir des emails"
            value={notifications.email}
            onValueChange={() => toggleNotification('email')}
            gradient={['#3B82F6', '#2563EB']}
          />
          <SwitchItem
            icon="calendar"
            label="Invitations de matchs"
            description="Être notifié des invitations"
            value={notifications.matchInvitations}
            onValueChange={() => toggleNotification('matchInvitations')}
            gradient={['#F59E0B', '#D97706']}
          />
          <SwitchItem
            icon="users"
            label="Mises à jour d'équipe"
            description="Activités de vos équipes"
            value={notifications.teamUpdates}
            onValueChange={() => toggleNotification('teamUpdates')}
            gradient={['#8B5CF6', '#7C3AED']}
          />
          <SwitchItem
            icon="message-circle"
            label="Messages"
            description="Nouveaux messages reçus"
            value={notifications.messages}
            onValueChange={() => toggleNotification('messages')}
            gradient={['#EC4899', '#DB2777']}
          />
          <SwitchItem
            icon="tag"
            label="Offres promotionnelles"
            description="Recevoir les promotions"
            value={notifications.marketing}
            onValueChange={() => toggleNotification('marketing')}
            gradient={['#EF4444', '#DC2626']}
          />
        </Section>

        {/* Préférences */}
        <Section
          title="Préférences"
          description="Personnalisez votre expérience"
          icon="sliders"
        >
          <SwitchItem
            icon="moon"
            label="Mode sombre"
            description="Thème sombre automatique"
            value={preferences.darkMode}
            onValueChange={() => togglePreference('darkMode')}
            gradient={['#6B7280', '#4B5563']}
          />
          <MenuItem
            icon="globe"
            label="Langue"
            onPress={handleChangeLanguage}
            gradient={['#3B82F6', '#2563EB']}
          />
          <SwitchItem
            icon="volume-2"
            label="Effets sonores"
            description="Sons dans l'application"
            value={preferences.soundEffects}
            onValueChange={() => togglePreference('soundEffects')}
            gradient={['#F59E0B', '#D97706']}
          />
          <SwitchItem
            icon="smartphone"
            label="Vibration"
            description="Retour haptique"
            value={preferences.vibration}
            onValueChange={() => togglePreference('vibration')}
            gradient={['#8B5CF6', '#7C3AED']}
          />
        </Section>

        {/* Données */}
        <Section
          title="Données et stockage"
          description="Gérez vos données"
          icon="database"
        >
          <MenuItem
            icon="trash-2"
            label="Vider le cache"
            onPress={handleClearCache}
            gradient={['#EF4444', '#DC2626']}
          />
          <MenuItem
            icon="download"
            label="Télécharger mes données"
            onPress={() => Alert.alert('Info', 'Bientôt disponible')}
            gradient={['#3B82F6', '#2563EB']}
          />
        </Section>

        {/* À propos */}
        <Section
          title="À propos"
          description="Infos sur l'application"
          icon="info"
        >
          <MenuItem
            icon="file-text"
            label="Conditions d'utilisation"
            onPress={() => {}}
            gradient={['#6B7280', '#4B5563']}
          />
          <MenuItem
            icon="shield"
            label="Politique de confidentialité"
            onPress={() => {}}
            gradient={['#8B5CF6', '#7C3AED']}
          />
          <MenuItem
            icon="help-circle"
            label="Centre d'aide"
            onPress={() => navigation.navigate('Help')}
            gradient={['#F59E0B', '#D97706']}
          />
          <View style={styles.versionContainer}>
            <Text style={styles.versionLabel}>Version</Text>
            <Text style={styles.versionValue}>1.0.0</Text>
          </View>
        </Section>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 10,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  sectionContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.SMALL,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  switchIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  versionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  versionLabel: {
    fontSize: 15,
    color: '#6B7280',
    marginLeft: 52,
  },
  versionValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
});
