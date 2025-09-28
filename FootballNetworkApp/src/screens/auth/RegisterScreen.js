import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useAuthImproved } from '../../utils/hooks/useAuthImproved';

// Constantes
const COLORS = {
  PRIMARY: '#22C55E',
  BACKGROUND: '#F8FAFC',
  TEXT_PRIMARY: '#1F2937',
  TEXT_SECONDARY: '#6B7280',
  TEXT_MUTED: '#9CA3AF',
  TEXT_WHITE: '#FFFFFF',
  CARD_BACKGROUND: '#FFFFFF',
  BORDER: '#E5E7EB',
  ERROR: '#EF4444',
};

const DIMENSIONS = {
  CONTAINER_PADDING: 16,
  SPACING_XL: 32,
  SPACING_LG: 24,
  SPACING_MD: 16,
  SPACING_SM: 8,
  INPUT_HEIGHT: 48,
  BUTTON_HEIGHT: 48,
  BORDER_RADIUS_MD: 8,
};

const FONTS = {
  SIZE: {
    SM: 14,
    MD: 16,
    LG: 18,
    XL: 20,
  },
};

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Débutant' },
  { value: 'amateur', label: 'Amateur' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Avancé' },
  { value: 'expert', label: 'Expert' },
];

const POSITIONS = [
  { value: 'goalkeeper', label: 'Gardien' },
  { value: 'defender', label: 'Défenseur' },
  { value: 'midfielder', label: 'Milieu' },
  { value: 'forward', label: 'Attaquant' },
  { value: 'any', label: 'Polyvalent' },
];

export const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
    position: 'any',
    skillLevel: 'amateur',
    locationCity: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { signup, isLoading } = useAuthImproved();

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email
    if (!formData.email) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }

    // Mot de passe
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Minimum 6 caractères';
    }

    // Confirmation mot de passe
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmation requise';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    // Prénom et nom
    if (!formData.firstName) {
      newErrors.firstName = 'Le prénom est requis';
    }
    if (!formData.lastName) {
      newErrors.lastName = 'Le nom est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    try {
      const result = await signup(formData);

      if (result.success) {
        Alert.alert(
          'Inscription réussie !',
          `Bienvenue ${result.user.firstName} !`,
          [{ text: 'OK' }],
        );
      } else {
        Alert.alert("Erreur d'inscription", result.error);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur inattendue est survenue');
    }
  };

  const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    error,
    ...props
  }) => (
    <View style={{ marginBottom: DIMENSIONS.SPACING_MD }}>
      <Text
        style={{
          fontSize: FONTS.SIZE.SM,
          fontWeight: '500',
          color: COLORS.TEXT_PRIMARY,
          marginBottom: DIMENSIONS.SPACING_SM,
        }}
      >
        {label}
      </Text>
      <TextInput
        style={{
          height: DIMENSIONS.INPUT_HEIGHT,
          borderWidth: 1,
          borderColor: error ? COLORS.ERROR : COLORS.BORDER,
          borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
          paddingHorizontal: DIMENSIONS.SPACING_MD,
          backgroundColor: COLORS.CARD_BACKGROUND,
          fontSize: FONTS.SIZE.MD,
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.TEXT_MUTED}
        {...props}
      />
      {error && (
        <Text
          style={{
            fontSize: FONTS.SIZE.SM,
            color: COLORS.ERROR,
            marginTop: DIMENSIONS.SPACING_SM,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            flex: 1,
            paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
            paddingVertical: DIMENSIONS.SPACING_LG,
          }}
        >
          {/* Header */}
          <View
            style={{
              alignItems: 'center',
              marginBottom: DIMENSIONS.SPACING_XL,
            }}
          >
            <Text
              style={{
                fontSize: FONTS.SIZE.XL,
                fontWeight: 'bold',
                color: COLORS.TEXT_PRIMARY,
                marginBottom: DIMENSIONS.SPACING_SM,
              }}
            >
              Créer un compte
            </Text>
            <Text
              style={{
                fontSize: FONTS.SIZE.MD,
                color: COLORS.TEXT_SECONDARY,
                textAlign: 'center',
              }}
            >
              Rejoignez la communauté Football Network
            </Text>
          </View>

          {/* Formulaire */}
          <View style={{ marginBottom: DIMENSIONS.SPACING_LG }}>
            {/* Informations personnelles */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, marginRight: DIMENSIONS.SPACING_SM }}>
                <InputField
                  label="Prénom *"
                  value={formData.firstName}
                  onChangeText={value => updateField('firstName', value)}
                  placeholder="Jean"
                  error={errors.firstName}
                  autoCapitalize="words"
                />
              </View>
              <View style={{ flex: 1, marginLeft: DIMENSIONS.SPACING_SM }}>
                <InputField
                  label="Nom *"
                  value={formData.lastName}
                  onChangeText={value => updateField('lastName', value)}
                  placeholder="Dupont"
                  error={errors.lastName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <InputField
              label="Email *"
              value={formData.email}
              onChangeText={value => updateField('email', value)}
              placeholder="jean.dupont@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <InputField
              label="Téléphone"
              value={formData.phone}
              onChangeText={value => updateField('phone', value)}
              placeholder="+33 6 12 34 56 78"
              keyboardType="phone-pad"
              error={errors.phone}
            />

            <InputField
              label="Ville"
              value={formData.locationCity}
              onChangeText={value => updateField('locationCity', value)}
              placeholder="Paris"
              error={errors.locationCity}
            />

            <InputField
              label="Mot de passe *"
              value={formData.password}
              onChangeText={value => updateField('password', value)}
              placeholder="Minimum 6 caractères"
              secureTextEntry={!showPassword}
              error={errors.password}
            />

            <InputField
              label="Confirmer le mot de passe *"
              value={formData.confirmPassword}
              onChangeText={value => updateField('confirmPassword', value)}
              placeholder="Confirmer votre mot de passe"
              secureTextEntry={!showConfirmPassword}
              error={errors.confirmPassword}
            />

            {/* TODO: Ajouter des sélecteurs pour position et niveau */}
          </View>

          {/* Bouton d'inscription */}
          <TouchableOpacity
            onPress={handleSignup}
            disabled={isLoading}
            style={{
              height: DIMENSIONS.BUTTON_HEIGHT,
              backgroundColor: isLoading ? COLORS.TEXT_MUTED : COLORS.PRIMARY,
              borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: DIMENSIONS.SPACING_MD,
            }}
          >
            <Text
              style={{
                fontSize: FONTS.SIZE.MD,
                fontWeight: 'bold',
                color: COLORS.TEXT_WHITE,
              }}
            >
              {isLoading ? 'Inscription...' : "S'inscrire"}
            </Text>
          </TouchableOpacity>

          {/* Lien vers connexion */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: FONTS.SIZE.MD,
                color: COLORS.TEXT_SECONDARY,
              }}
            >
              Déjà un compte ?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text
                style={{
                  fontSize: FONTS.SIZE.MD,
                  fontWeight: 'bold',
                  color: COLORS.PRIMARY,
                }}
              >
                Se connecter
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
