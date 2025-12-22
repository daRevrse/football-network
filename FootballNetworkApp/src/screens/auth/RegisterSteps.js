// ====== src/screens/auth/RegisterSteps.js ======
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { ModernInput } from '../../components/common';
import { COLORS, DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';

// On réutilise le thème défini plus haut ou on le passe en props
const THEME = {
  SURFACE: '#1E293B',
  TEXT: '#F8FAFC',
  TEXT_SEC: '#94A3B8',
  ACCENT: '#22C55E',
  BORDER: '#334155',
  ERROR: '#EF4444',
};

// Styles partagés pour les inputs dark
const inputProps = {
  inputStyle: {
    backgroundColor: THEME.SURFACE,
    borderColor: THEME.BORDER,
    color: THEME.TEXT,
    borderWidth: 1,
  },
  labelStyle: {
    color: THEME.TEXT_SEC,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  placeholderTextColor: THEME.TEXT_SEC,
};

const StepTitle = ({ title, subtitle }) => (
  <View style={{ marginBottom: 32 }}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.subtitle}>{subtitle}</Text>
  </View>
);

// === ÉTAPE 1 : CHOIX DU RÔLE (NOUVEAU) ===
export const UserTypeStep = ({ formData, updateField }) => {
  const TypeCard = ({ type, title, subtitle, icon }) => {
    const isSelected = formData.userType === type;
    return (
      <TouchableOpacity
        style={[styles.typeCard, isSelected && styles.typeCardSelected]}
        onPress={() => updateField('userType', type)}
        activeOpacity={0.8}
      >
        <View
          style={[styles.iconCircle, isSelected && styles.iconCircleSelected]}
        >
          <Icon
            name={icon}
            size={28}
            color={isSelected ? COLORS.WHITE : COLORS.PRIMARY}
          />
        </View>
        <Text style={[styles.typeTitle, isSelected && styles.textSelected]}>
          {title}
        </Text>
        <Text style={[styles.typeDesc, isSelected && styles.textSelectedLight]}>
          {subtitle}
        </Text>
        {isSelected && (
          <View style={styles.checkBadge}>
            <Icon name="check" size={14} color={COLORS.WHITE} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Qui êtes-vous ?</Text>
      <Text style={styles.stepDescription}>
        Choisissez comment vous souhaitez utiliser l'application
      </Text>

      <TypeCard
        type="player"
        title="Joueur"
        icon="user"
        subtitle="Je veux rejoindre une équipe, trouver des matchs et jouer."
      />

      <TypeCard
        type="manager"
        title="Manager"
        icon="briefcase"
        subtitle="Je veux créer et gérer mon équipe, recruter des joueurs et organiser des matchs."
      />
    </View>
  );
};

// === ÉTAPE : INFO ÉQUIPE (NOUVEAU POUR MANAGER) ===
export const TeamInfoStep = ({ formData, updateField, errors }) => {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <View style={styles.iconContainer}>
          <Icon name="shield" size={24} color={COLORS.PRIMARY} />
        </View>
        <Text style={styles.stepTitle}>Votre Équipe</Text>
        <Text style={styles.stepDescription}>
          En tant que manager, vous devez créer votre équipe
        </Text>
      </View>

      <ModernInput
        label="Nom de l'équipe *"
        value={formData.teamName || ''}
        onChangeText={value => updateField('teamName', value)}
        placeholder="ex: FC Paris Saint-Blaise"
        error={errors.teamName}
        leftIconName="shield"
        autoCapitalize="words"
      />

      <View style={styles.infoBox}>
        <Icon
          name="info"
          size={20}
          color={COLORS.PRIMARY}
          style={{ marginRight: 10 }}
        />
        <Text style={styles.infoText}>
          Vous serez automatiquement désigné comme manager de cette équipe.
          Vous pourrez inviter des joueurs plus tard.
        </Text>
      </View>
    </View>
  );
};

export const PersonalInfoStep = ({ formData, updateField, errors }) => (
  <View>
    <StepTitle title="Identité" subtitle="Commençons par les présentations." />

    <ModernInput
      label="Prénom"
      placeholder="Jean"
      value={formData.firstName}
      onChangeText={v => updateField('firstName', v)}
      leftIcon="user"
      error={errors.firstName}
      {...inputProps}
    />
    <ModernInput
      label="Nom"
      placeholder="Dupont"
      value={formData.lastName}
      onChangeText={v => updateField('lastName', v)}
      leftIcon="user"
      error={errors.lastName}
      {...inputProps}
    />
    <ModernInput
      label="Email"
      value={formData.email}
      placeholder="email@example.com"
      onChangeText={v => updateField('email', v)}
      leftIcon="mail"
      error={errors.email}
      {...inputProps}
    />
  </View>
);

export const SecurityStep = ({ formData, updateField, errors }) => (
  <View>
    <StepTitle title="Sécurité" subtitle="Protégez votre compte joueur." />

    <ModernInput
      label="Mot de passe"
      value={formData.password}
      placeholder="••••••••"
      onChangeText={v => updateField('password', v)}
      secureTextEntry
      leftIcon="lock"
      error={errors.password}
      {...inputProps}
    />
    <ModernInput
      label="Confirmation"
      value={formData.confirmPassword}
      placeholder="••••••••"
      onChangeText={v => updateField('confirmPassword', v)}
      secureTextEntry
      leftIcon="lock"
      error={errors.confirmPassword}
      {...inputProps}
    />
  </View>
);

// Composant personnalisé pour les sélections Dark Mode
const DarkOption = ({ label, icon, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.optionCard, selected && styles.optionCardSelected]}
    onPress={onPress}
  >
    <View
      style={[styles.iconBox, selected && { backgroundColor: THEME.ACCENT }]}
    >
      <Icon name={icon} size={20} color={selected ? '#000' : THEME.TEXT} />
    </View>
    <Text
      style={[
        styles.optionText,
        selected && { color: THEME.ACCENT, fontWeight: 'bold' },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export const FootballProfileStep = ({ formData, updateField, errors }) => {
  const POSITIONS = [
    { id: 'goalkeeper', label: 'Gardien', icon: 'shield' },
    { id: 'defender', label: 'Défenseur', icon: 'anchor' }, // anchor exists in feather
    { id: 'midfielder', label: 'Milieu', icon: 'activity' },
    { id: 'forward', label: 'Attaquant', icon: 'target' },
  ];

  return (
    <View>
      <StepTitle
        title="Profil Sportif"
        subtitle="Quel est votre style de jeu ?"
      />

      <ModernInput
        label="Ville"
        value={formData.locationCity}
        placeholder="Paris"
        onChangeText={v => updateField('locationCity', v)}
        leftIcon="map-pin"
        error={errors.locationCity}
        {...inputProps}
      />

      <Text style={inputProps.labelStyle}>Votre Poste</Text>
      <View style={styles.grid}>
        {POSITIONS.map(p => (
          <DarkOption
            key={p.id}
            label={p.label}
            icon={p.icon}
            selected={formData.position === p.id}
            onPress={() => updateField('position', p.id)}
          />
        ))}
      </View>
      {errors.position && <Text style={styles.error}>{errors.position}</Text>}
    </View>
  );
};

export const SummaryStep = ({ formData }) => {
  const SummaryItem = ({ icon, label, value }) => (
    <View style={styles.summaryItem}>
      <View style={styles.summaryIconContainer}>
        <Icon name={icon} size={16} color={COLORS.PRIMARY} />
      </View>
      <View style={styles.summaryContent}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryValue}>{value || 'Non renseigné'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Récapitulatif</Text>
      <Text style={styles.stepDescription}>Vérifiez avant de valider</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summarySection}>Compte</Text>
        <SummaryItem
          icon={formData.userType === 'manager' ? 'briefcase' : 'user'}
          label="Type de compte"
          value={formData.userType === 'manager' ? 'Manager' : 'Joueur'}
        />
        <SummaryItem
          icon="user"
          label="Nom"
          value={`${formData.firstName} ${formData.lastName}`}
        />
        <SummaryItem icon="mail" label="Email" value={formData.email} />

        <Text style={styles.summarySection}>
          {formData.userType === 'manager' ? 'Votre Équipe' : 'Profil Football'}
        </Text>

        {formData.userType === 'manager' ? (
          <SummaryItem
            icon="shield"
            label="Nom de l'équipe"
            value={formData.teamName}
          />
        ) : (
          <>
            <SummaryItem
              icon="target"
              label="Position"
              value={formData.position}
            />
            <SummaryItem
              icon="star"
              label="Niveau"
              value={formData.skillLevel}
            />
          </>
        )}

        <SummaryItem
          icon="map-pin"
          label="Ville"
          value={formData.locationCity}
        />
      </View>
    </View>
  );
};

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: THEME.TEXT,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: THEME.TEXT_SEC,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
    marginBottom: 24,
  },
  optionCard: {
    width: '48%',
    backgroundColor: THEME.SURFACE,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  optionCardSelected: {
    borderColor: THEME.ACCENT,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionText: {
    color: THEME.TEXT,
    fontSize: 14,
  },
  error: {
    color: THEME.ERROR,
    marginTop: -16,
    marginBottom: 16,
  },
  summaryBox: {
    backgroundColor: THEME.SURFACE,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoLabel: {
    color: THEME.TEXT_SEC,
    fontSize: 14,
  },
  infoValue: {
    color: THEME.TEXT,
    fontWeight: '600',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.BORDER,
    marginVertical: 16,
  },

  stepContainer: { flex: 1, paddingTop: 10 },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    color: COLORS.TEXT_PRIMARY,
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 20,
  },
  stepHeader: { alignItems: 'center', marginBottom: 20 },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  // Styles pour les cartes de type
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: COLORS.BORDER_LIGHT,
    ...SHADOWS.SMALL,
  },
  typeCardSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY_LIGHT + '20',
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconCircleSelected: { backgroundColor: COLORS.PRIMARY },
  typeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  typeDesc: { fontSize: 13, color: COLORS.TEXT_SECONDARY, flex: 1 },
  textSelected: { color: COLORS.PRIMARY },
  textSelectedLight: { color: COLORS.PRIMARY },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Styles Info Box
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.INFO_LIGHT,
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  infoText: { flex: 1, color: COLORS.INFO_DARK, fontSize: 13, lineHeight: 18 },

  // Styles Summary
  summaryCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 15,
    ...SHADOWS.SMALL,
  },
  summarySection: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: COLORS.PRIMARY,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  summaryIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryContent: { flex: 1 },
  summaryLabel: { fontSize: 12, color: COLORS.TEXT_MUTED },
  summaryValue: { fontSize: 15, color: COLORS.TEXT_PRIMARY, fontWeight: '500' },
});
