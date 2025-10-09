// ====== src/screens/auth/RegisterSteps.js ======
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { ModernInput } from '../../components/common';
import { COLORS, DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';

// ========== ÉTAPE 1 : Informations personnelles ==========
export const PersonalInfoStep = ({ formData, updateField, errors }) => {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <View style={styles.iconContainer}>
          <Icon name="user" size={24} color={COLORS.PRIMARY} />
        </View>
        <Text style={styles.stepTitle}>Informations personnelles</Text>
        <Text style={styles.stepDescription}>
          Commençons par faire connaissance
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <ModernInput
            label="Prénom *"
            value={formData.firstName || ''}
            onChangeText={value => updateField('firstName', value)}
            placeholder="Jean"
            error={errors.firstName}
            leftIconName="user"
            autoCapitalize="words"
          />
        </View>
        <View style={styles.halfInput}>
          <ModernInput
            label="Nom *"
            value={formData.lastName || ''}
            onChangeText={value => updateField('lastName', value)}
            placeholder="Dupont"
            error={errors.lastName}
            leftIconName="user"
            autoCapitalize="words"
          />
        </View>
      </View>

      <ModernInput
        label="Email *"
        value={formData.email || ''}
        onChangeText={value => updateField('email', value)}
        placeholder="jean.dupont@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email}
        leftIconName="mail"
      />

      <ModernInput
        label="Téléphone"
        value={formData.phone || ''}
        onChangeText={value => updateField('phone', value)}
        placeholder="+33 6 12 34 56 78"
        keyboardType="phone-pad"
        error={errors.phone}
        leftIconName="phone"
      />
    </View>
  );
};

// ========== ÉTAPE 2 : Sécurité ==========
export const SecurityStep = ({ formData, updateField, errors }) => {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <View style={styles.iconContainer}>
          <Icon name="shield" size={24} color={COLORS.PRIMARY} />
        </View>
        <Text style={styles.stepTitle}>Sécurité</Text>
        <Text style={styles.stepDescription}>
          Créez un mot de passe sécurisé
        </Text>
      </View>

      <ModernInput
        label="Mot de passe *"
        value={formData.password || ''}
        onChangeText={value => updateField('password', value)}
        placeholder="Minimum 6 caractères"
        secureTextEntry
        error={errors.password}
        leftIconName="lock"
      />

      <ModernInput
        label="Confirmer le mot de passe *"
        value={formData.confirmPassword || ''}
        onChangeText={value => updateField('confirmPassword', value)}
        placeholder="Confirmez votre mot de passe"
        secureTextEntry
        error={errors.confirmPassword}
        leftIconName="lock"
      />

      <View style={styles.passwordHints}>
        <View style={styles.hintRow}>
          <Icon
            name={formData.password?.length >= 6 ? 'check-circle' : 'circle'}
            size={14}
            color={
              formData.password?.length >= 6
                ? COLORS.SUCCESS
                : COLORS.TEXT_MUTED
            }
          />
          <Text
            style={[
              styles.hintText,
              formData.password?.length >= 6 && styles.hintTextMet,
            ]}
          >
            6 caractères minimum
          </Text>
        </View>
        <View style={styles.hintRow}>
          <Icon
            name={/[A-Z]/.test(formData.password) ? 'check-circle' : 'circle'}
            size={14}
            color={
              /[A-Z]/.test(formData.password)
                ? COLORS.SUCCESS
                : COLORS.TEXT_MUTED
            }
          />
          <Text
            style={[
              styles.hintText,
              /[A-Z]/.test(formData.password) && styles.hintTextMet,
            ]}
          >
            Une majuscule
          </Text>
        </View>
        <View style={styles.hintRow}>
          <Icon
            name={/[0-9]/.test(formData.password) ? 'check-circle' : 'circle'}
            size={14}
            color={
              /[0-9]/.test(formData.password)
                ? COLORS.SUCCESS
                : COLORS.TEXT_MUTED
            }
          />
          <Text
            style={[
              styles.hintText,
              /[0-9]/.test(formData.password) && styles.hintTextMet,
            ]}
          >
            Un chiffre
          </Text>
        </View>
      </View>
    </View>
  );
};

// ========== ÉTAPE 3 : Profil Football ==========
const POSITIONS = [
  { value: 'goalkeeper', label: 'Gardien', icon: 'shield' },
  { value: 'defender', label: 'Défenseur', icon: 'shield-off' },
  { value: 'midfielder', label: 'Milieu', icon: 'target' },
  { value: 'forward', label: 'Attaquant', icon: 'arrow-up' },
  { value: 'any', label: 'Polyvalent', icon: 'grid' },
];

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Débutant', icon: 'user' },
  { value: 'amateur', label: 'Amateur', icon: 'award' },
  { value: 'intermediate', label: 'Intermédiaire', icon: 'star' },
  { value: 'advanced', label: 'Avancé', icon: 'zap' },
  { value: 'expert', label: 'Expert', icon: 'trending-up' },
];

export const FootballProfileStep = ({ formData, updateField, errors }) => {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <View style={styles.iconContainer}>
          <Icon name="dribbble" size={24} color={COLORS.PRIMARY} />
        </View>
        <Text style={styles.stepTitle}>Profil football</Text>
        <Text style={styles.stepDescription}>Parlez-nous de votre jeu</Text>
      </View>

      <ModernInput
        label="Ville"
        value={formData.locationCity || ''}
        onChangeText={value => updateField('locationCity', value)}
        placeholder="Paris"
        error={errors.locationCity}
        leftIconName="map-pin"
      />

      <View style={styles.selectorContainer}>
        <Text style={styles.selectorLabel}>Position préférée</Text>
        <View style={styles.optionsGrid}>
          {POSITIONS.map(position => (
            <TouchableOpacity
              key={position.value}
              style={[
                styles.option,
                formData.position === position.value && styles.optionSelected,
              ]}
              onPress={() => updateField('position', position.value)}
            >
              <Icon
                name={position.icon}
                size={16}
                color={
                  formData.position === position.value
                    ? COLORS.PRIMARY
                    : COLORS.TEXT_MUTED
                }
              />
              <Text
                style={[
                  styles.optionText,
                  formData.position === position.value &&
                    styles.optionTextSelected,
                ]}
              >
                {position.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.selectorContainer}>
        <Text style={styles.selectorLabel}>Niveau</Text>
        <View style={styles.optionsGrid}>
          {SKILL_LEVELS.map(level => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.option,
                formData.skillLevel === level.value && styles.optionSelected,
              ]}
              onPress={() => updateField('skillLevel', level.value)}
            >
              <Icon
                name={level.icon}
                size={16}
                color={
                  formData.skillLevel === level.value
                    ? COLORS.PRIMARY
                    : COLORS.TEXT_MUTED
                }
              />
              <Text
                style={[
                  styles.optionText,
                  formData.skillLevel === level.value &&
                    styles.optionTextSelected,
                ]}
              >
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

// ========== ÉTAPE 4 : Récapitulatif ==========
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

  const getPositionLabel = () => {
    const position = POSITIONS.find(p => p.value === formData.position);
    return position?.label || 'Non renseigné';
  };

  const getSkillLevelLabel = () => {
    const level = SKILL_LEVELS.find(l => l.value === formData.skillLevel);
    return level?.label || 'Non renseigné';
  };

  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <View style={styles.iconContainer}>
          <Icon name="check-circle" size={24} color={COLORS.PRIMARY} />
        </View>
        <Text style={styles.stepTitle}>Récapitulatif</Text>
        <Text style={styles.stepDescription}>Vérifiez vos informations</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summarySection}>Informations personnelles</Text>
        <SummaryItem
          icon="user"
          label="Nom complet"
          value={`${formData.firstName || ''} ${formData.lastName || ''}`}
        />
        <SummaryItem icon="mail" label="Email" value={formData.email} />
        {formData.phone && (
          <SummaryItem icon="phone" label="Téléphone" value={formData.phone} />
        )}

        <Text style={styles.summarySection}>Profil football</Text>
        {formData.locationCity && (
          <SummaryItem
            icon="map-pin"
            label="Ville"
            value={formData.locationCity}
          />
        )}
        <SummaryItem
          icon="target"
          label="Position"
          value={getPositionLabel()}
        />
        <SummaryItem icon="star" label="Niveau" value={getSkillLevelLabel()} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stepContainer: {
    flex: 1,
    paddingTop: DIMENSIONS.SPACING_MD,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_LG,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_SM,
  },
  stepTitle: {
    fontSize: FONTS.SIZE.XL,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: DIMENSIONS.SPACING_XXS,
  },
  stepDescription: {
    fontSize: FONTS.SIZE.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -DIMENSIONS.SPACING_XS,
  },
  halfInput: {
    flex: 1,
    paddingHorizontal: DIMENSIONS.SPACING_XS,
  },
  passwordHints: {
    backgroundColor: COLORS.INFO_LIGHT,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    padding: DIMENSIONS.SPACING_SM,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.INFO,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_XXS,
  },
  hintText: {
    fontSize: FONTS.SIZE.XS,
    color: COLORS.TEXT_MUTED,
    marginLeft: DIMENSIONS.SPACING_XS,
  },
  hintTextMet: {
    color: COLORS.SUCCESS,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  selectorContainer: {
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  selectorLabel: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: DIMENSIONS.SPACING_SM,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -DIMENSIONS.SPACING_XXS,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderWidth: DIMENSIONS.BORDER_WIDTH_MEDIUM,
    borderColor: COLORS.BORDER,
    borderRadius: DIMENSIONS.BORDER_RADIUS_SM,
    paddingHorizontal: DIMENSIONS.SPACING_SM,
    paddingVertical: DIMENSIONS.SPACING_XS,
    margin: DIMENSIONS.SPACING_XXS,
  },
  optionSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT,
  },
  optionText: {
    fontSize: FONTS.SIZE.XS,
    fontWeight: FONTS.WEIGHT.MEDIUM,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: DIMENSIONS.SPACING_XS,
  },
  optionTextSelected: {
    color: COLORS.PRIMARY,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  summaryCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    padding: DIMENSIONS.SPACING_MD,
    ...SHADOWS.SMALL,
  },
  summarySection: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginTop: DIMENSIONS.SPACING_SM,
    marginBottom: DIMENSIONS.SPACING_SM,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DIMENSIONS.SPACING_XS,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  summaryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.SPACING_SM,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: FONTS.SIZE.XS,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
});
