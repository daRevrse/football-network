// ====== src/screens/profile/PrivacyScreen.js - NOUVEAU DESIGN ======
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

// Composant SwitchItem
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
        style={styles.iconContainer}
      >
        <Icon name={icon} size={20} color="#FFF" />
      </LinearGradient>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
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

// Composant SelectItem
const SelectItem = ({ icon, label, value, onPress, gradient }) => (
  <TouchableOpacity
    style={styles.selectItem}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.selectLeft}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconContainer}
      >
        <Icon name={icon} size={20} color="#FFF" />
      </LinearGradient>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
    <Icon name="chevron-right" size={22} color="#CBD5E1" />
  </TouchableOpacity>
);

// Composant ActionButton
const ActionButton = ({
  icon,
  label,
  description,
  onPress,
  gradient,
  danger,
}) => (
  <TouchableOpacity
    style={styles.actionButton}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.actionLeft}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconContainer}
      >
        <Icon name={icon} size={20} color="#FFF" />
      </LinearGradient>
      <View style={styles.textContainer}>
        <Text style={[styles.label, danger && { color: '#EF4444' }]}>
          {label}
        </Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
    </View>
    <Icon
      name="chevron-right"
      size={22}
      color={danger ? '#EF4444' : '#CBD5E1'}
    />
  </TouchableOpacity>
);

// Composant Section
const Section = ({ title, icon, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Icon name={icon} size={20} color="#22C55E" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

export const PrivacyScreen = ({ navigation }) => {
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    showLocation: true,
    showStats: true,
    allowMatchInvites: true,
    allowTeamInvites: true,
    allowMessages: 'everyone',
    showOnlineStatus: true,
    showLastSeen: false,
  });

  const [blockedUsers] = useState([
    { id: '1', name: 'Utilisateur Bloqué', email: 'blocked@example.com' },
  ]);

  const togglePrivacy = useCallback(key => {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleChangeVisibility = useCallback(() => {
    Alert.alert('Visibilité du profil', 'Qui peut voir votre profil ?', [
      {
        text: 'Public',
        onPress: () => setPrivacy(p => ({ ...p, profileVisibility: 'public' })),
      },
      {
        text: 'Amis uniquement',
        onPress: () =>
          setPrivacy(p => ({ ...p, profileVisibility: 'friends' })),
      },
      {
        text: 'Privé',
        onPress: () =>
          setPrivacy(p => ({ ...p, profileVisibility: 'private' })),
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }, []);

  const handleChangeMessaging = useCallback(() => {
    Alert.alert('Messagerie', 'Qui peut vous envoyer des messages ?', [
      {
        text: 'Tout le monde',
        onPress: () => setPrivacy(p => ({ ...p, allowMessages: 'everyone' })),
      },
      {
        text: 'Amis uniquement',
        onPress: () => setPrivacy(p => ({ ...p, allowMessages: 'friends' })),
      },
      {
        text: 'Personne',
        onPress: () => setPrivacy(p => ({ ...p, allowMessages: 'nobody' })),
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }, []);

  const handleExportData = useCallback(() => {
    Alert.alert(
      'Exporter mes données',
      'Vous recevrez un email avec vos données dans 48h',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => Alert.alert('Succès', 'Demande enregistrée'),
        },
      ],
    );
  }, []);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      '⚠️ Supprimer mon compte',
      'Cette action est irréversible. Toutes vos données seront supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Confirmer', 'Êtes-vous vraiment sûr ?', [
              { text: 'Non', style: 'cancel' },
              { text: 'Oui, supprimer', style: 'destructive' },
            ]);
          },
        },
      ],
    );
  }, []);

  const getVisibilityLabel = value => {
    const labels = {
      public: 'Public',
      friends: 'Amis uniquement',
      private: 'Privé',
    };
    return labels[value] || value;
  };

  const getMessagingLabel = value => {
    const labels = {
      everyone: 'Tout le monde',
      friends: 'Amis uniquement',
      nobody: 'Personne',
    };
    return labels[value] || value;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
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
          <Icon name="shield" size={24} color="#FFF" />
          <Text style={styles.headerTitle}>Confidentialité</Text>
        </View>

        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Visibilité */}
        <Section title="Visibilité du profil" icon="eye">
          <SelectItem
            icon="users"
            label="Qui peut voir mon profil"
            value={getVisibilityLabel(privacy.profileVisibility)}
            onPress={handleChangeVisibility}
            gradient={['#8B5CF6', '#7C3AED']}
          />

          <SwitchItem
            icon="mail"
            label="Afficher mon email"
            description="Visible sur votre profil public"
            value={privacy.showEmail}
            onValueChange={() => togglePrivacy('showEmail')}
            gradient={['#3B82F6', '#2563EB']}
          />

          <SwitchItem
            icon="phone"
            label="Afficher mon téléphone"
            description="Visible sur votre profil public"
            value={privacy.showPhone}
            onValueChange={() => togglePrivacy('showPhone')}
            gradient={['#22C55E', '#16A34A']}
          />

          <SwitchItem
            icon="map-pin"
            label="Afficher ma localisation"
            description="Ville visible sur votre profil"
            value={privacy.showLocation}
            onValueChange={() => togglePrivacy('showLocation')}
            gradient={['#F59E0B', '#D97706']}
          />

          <SwitchItem
            icon="bar-chart-2"
            label="Afficher mes statistiques"
            description="Matchs, buts, passes décisives"
            value={privacy.showStats}
            onValueChange={() => togglePrivacy('showStats')}
            gradient={['#EC4899', '#DB2777']}
          />
        </Section>

        {/* Invitations */}
        <Section title="Invitations" icon="send">
          <SwitchItem
            icon="calendar"
            label="Invitations de matchs"
            description="Autoriser les invitations"
            value={privacy.allowMatchInvites}
            onValueChange={() => togglePrivacy('allowMatchInvites')}
            gradient={['#22C55E', '#16A34A']}
          />

          <SwitchItem
            icon="users"
            label="Invitations d'équipes"
            description="Autoriser à rejoindre des équipes"
            value={privacy.allowTeamInvites}
            onValueChange={() => togglePrivacy('allowTeamInvites')}
            gradient={['#F59E0B', '#D97706']}
          />
        </Section>

        {/* Communication */}
        <Section title="Communication" icon="message-circle">
          <SelectItem
            icon="message-square"
            label="Qui peut m'envoyer des messages"
            value={getMessagingLabel(privacy.allowMessages)}
            onPress={handleChangeMessaging}
            gradient={['#3B82F6', '#2563EB']}
          />

          <SwitchItem
            icon="activity"
            label="Afficher mon statut en ligne"
            description="Les autres voient quand vous êtes connecté"
            value={privacy.showOnlineStatus}
            onValueChange={() => togglePrivacy('showOnlineStatus')}
            gradient={['#22C55E', '#16A34A']}
          />

          <SwitchItem
            icon="clock"
            label="Afficher ma dernière connexion"
            description="Visible par les autres utilisateurs"
            value={privacy.showLastSeen}
            onValueChange={() => togglePrivacy('showLastSeen')}
            gradient={['#8B5CF6', '#7C3AED']}
          />
        </Section>

        {/* Données */}
        <Section title="Mes données" icon="database">
          <ActionButton
            icon="download"
            label="Exporter mes données"
            description="Recevez une copie de vos données"
            onPress={handleExportData}
            gradient={['#3B82F6', '#2563EB']}
          />

          <ActionButton
            icon="trash-2"
            label="Supprimer mon compte"
            description="Action irréversible"
            onPress={handleDeleteAccount}
            gradient={['#EF4444', '#DC2626']}
            danger
          />
        </Section>

        {/* Avertissement */}
        <View style={styles.warningBox}>
          <LinearGradient
            colors={['#F59E0B15', '#F59E0B05']}
            style={styles.warningGradient}
          >
            <Icon name="info" size={20} color="#F59E0B" />
            <Text style={styles.warningText}>
              Les paramètres de confidentialité peuvent affecter votre
              visibilité et les invitations reçues
            </Text>
          </LinearGradient>
        </View>

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
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.SMALL,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionButton: {
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
  selectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
  },
  value: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
  },
  warningBox: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  warningGradient: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 20,
  },
});
