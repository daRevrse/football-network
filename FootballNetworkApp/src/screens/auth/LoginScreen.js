import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  loginSuccess,
  setLoading,
  setError,
} from '../../store/slices/authSlice';

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
  SUCCESS: '#10B981',
  SECONDARY: '#3B82F6',
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
    XXXL: 28,
  },
};

// Composant Input simple et stable
const SimpleInput = React.memo(
  ({ label, value, onChangeText, placeholder, error, ...props }) => (
    <View style={{ marginBottom: DIMENSIONS.SPACING_MD }}>
      {label && (
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
      )}
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
  ),
);

// Composant Button simple
const SimpleButton = React.memo(
  ({ title, onPress, disabled = false, variant = 'primary' }) => {
    const buttonStyle = {
      height: DIMENSIONS.BUTTON_HEIGHT,
      borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: DIMENSIONS.SPACING_MD,
      backgroundColor:
        variant === 'primary'
          ? disabled
            ? COLORS.TEXT_MUTED
            : COLORS.PRIMARY
          : 'transparent',
      borderWidth: variant === 'secondary' ? 1 : 0,
      borderColor:
        variant === 'secondary'
          ? disabled
            ? COLORS.TEXT_MUTED
            : COLORS.SECONDARY
          : 'transparent',
    };

    const textStyle = {
      fontSize: FONTS.SIZE.MD,
      fontWeight: 'bold',
      color:
        variant === 'primary'
          ? COLORS.TEXT_WHITE
          : disabled
          ? COLORS.TEXT_MUTED
          : COLORS.SECONDARY,
    };

    return (
      <TouchableOpacity
        style={buttonStyle}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={textStyle}>{title}</Text>
      </TouchableOpacity>
    );
  },
);

export const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState(__DEV__ ? 'test@example.com' : '');
  const [password, setPassword] = useState(__DEV__ ? 'password123' : '');
  const [errors, setErrors] = useState({});

  const dispatch = useDispatch();

  // Sélecteur sécurisé avec valeurs par défaut
  const authState = useSelector(state => {
    if (!state || !state.auth) {
      console.warn('Auth state not found, using defaults');
      return { isLoading: false, error: null };
    }
    return state.auth;
  });

  const { isLoading, error } = authState;

  // Gestion sécurisée des changements de champs
  const handleEmailChange = useCallback(
    value => {
      setEmail(value);
      if (errors.email) {
        setErrors(prev => ({ ...prev, email: null }));
      }
    },
    [errors.email],
  );

  const handlePasswordChange = useCallback(
    value => {
      setPassword(value);
      if (errors.password) {
        setErrors(prev => ({ ...prev, password: null }));
      }
    },
    [errors.password],
  );

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!email) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Format d'email invalide";
    }

    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (password.length < 6) {
      newErrors.password = 'Minimum 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  // Connexion avec vraie API
  const handleRealLogin = useCallback(async () => {
    if (!validateForm()) return;

    try {
      dispatch(setLoading(true));

      const response = await fetch('http://192.168.1.70:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        dispatch(loginSuccess(data));
        Alert.alert('Succès', `Bienvenue ${data.user.firstName} !`);
      } else {
        dispatch(setError(data.error || 'Erreur de connexion'));
        Alert.alert('Erreur', data.error || 'Erreur de connexion');
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      dispatch(setError('Erreur réseau'));
      Alert.alert(
        'Erreur de connexion',
        'Impossible de se connecter au serveur.\nVoulez-vous essayer le mode démo ?',
        [
          { text: 'Réessayer', onPress: handleRealLogin },
          { text: 'Mode démo', onPress: handleSimulatedLogin },
          { text: 'Annuler', style: 'cancel' },
        ],
      );
    }
  }, [email, password, validateForm, dispatch]);

  // Mode simulation
  const handleSimulatedLogin = useCallback(async () => {
    if (!validateForm()) return;

    try {
      dispatch(setLoading(true));

      await new Promise(resolve => setTimeout(resolve, 1500));

      if (email.includes('error')) {
        dispatch(setError('Email ou mot de passe incorrect'));
        Alert.alert('Erreur', 'Email ou mot de passe incorrect');
        return;
      }

      const mockUserData = {
        user: {
          id: 1,
          firstName: 'Jean',
          lastName: 'Dupont',
          email: email,
          phone: '+33 6 12 34 56 78',
          position: 'midfielder',
          skillLevel: 'intermediate',
          locationCity: 'Paris',
        },
        token: 'mock_jwt_token_' + Date.now(),
        refreshToken: 'mock_refresh_token_' + Date.now(),
      };

      dispatch(loginSuccess(mockUserData));
      Alert.alert(
        'Succès',
        `Bienvenue ${mockUserData.user.firstName} ! (Mode démo)`,
      );
    } catch (error) {
      console.error('Erreur simulation:', error);
      dispatch(setError('Erreur de simulation'));
      Alert.alert('Erreur', 'Erreur de simulation');
    }
  }, [email, password, validateForm, dispatch]);

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
            justifyContent: 'center',
          }}
        >
          {/* Logo et titre */}
          <View
            style={{
              alignItems: 'center',
              marginBottom: DIMENSIONS.SPACING_XL * 2,
            }}
          >
            <View
              style={{
                width: 100,
                height: 100,
                backgroundColor: COLORS.PRIMARY,
                borderRadius: 50,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: DIMENSIONS.SPACING_LG,
              }}
            >
              <Text
                style={{
                  fontSize: 40,
                  color: COLORS.TEXT_WHITE,
                }}
              >
                ⚽
              </Text>
            </View>

            <Text
              style={{
                fontSize: FONTS.SIZE.XXXL,
                fontWeight: 'bold',
                color: COLORS.TEXT_PRIMARY,
                textAlign: 'center',
                marginBottom: DIMENSIONS.SPACING_SM,
              }}
            >
              Football Network
            </Text>

            <Text
              style={{
                fontSize: FONTS.SIZE.MD,
                color: COLORS.TEXT_SECONDARY,
                textAlign: 'center',
              }}
            >
              Trouvez des équipes, organisez des matchs
            </Text>
          </View>

          {/* Mode debug info */}
          {__DEV__ && (
            <View
              style={{
                backgroundColor: '#FEF3C7',
                borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
                padding: DIMENSIONS.SPACING_MD,
                marginBottom: DIMENSIONS.SPACING_LG,
                borderLeftWidth: 4,
                borderLeftColor: '#F59E0B',
              }}
            >
              <Text
                style={{
                  fontSize: FONTS.SIZE.SM,
                  color: '#92400E',
                  fontWeight: 'bold',
                  marginBottom: 4,
                }}
              >
                Mode développement
              </Text>
              <Text
                style={{
                  fontSize: FONTS.SIZE.SM,
                  color: '#92400E',
                }}
              >
                Email et mot de passe pré-remplis pour les tests
              </Text>
            </View>
          )}

          {/* Erreur globale */}
          {error && (
            <View
              style={{
                backgroundColor: '#FEE2E2',
                borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
                padding: DIMENSIONS.SPACING_MD,
                marginBottom: DIMENSIONS.SPACING_LG,
                borderLeftWidth: 4,
                borderLeftColor: COLORS.ERROR,
              }}
            >
              <Text
                style={{
                  fontSize: FONTS.SIZE.SM,
                  color: '#991B1B',
                  fontWeight: 'bold',
                  marginBottom: 4,
                }}
              >
                Erreur de connexion
              </Text>
              <Text
                style={{
                  fontSize: FONTS.SIZE.SM,
                  color: '#991B1B',
                }}
              >
                {error}
              </Text>
            </View>
          )}

          {/* Formulaire */}
          <View style={{ marginBottom: DIMENSIONS.SPACING_XL }}>
            <SimpleInput
              label="Email"
              value={email}
              onChangeText={handleEmailChange}
              placeholder="votre@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />

            <SimpleInput
              label="Mot de passe"
              value={password}
              onChangeText={handlePasswordChange}
              placeholder="Votre mot de passe"
              secureTextEntry
              error={errors.password}
              color={COLORS.TEXT_PRIMARY}
            />

            <SimpleButton
              title={isLoading ? 'Connexion...' : 'Se connecter'}
              onPress={handleRealLogin}
              disabled={isLoading}
              variant="primary"
            />

            <SimpleButton
              title="Mode démo"
              onPress={handleSimulatedLogin}
              disabled={isLoading}
              variant="secondary"
            />

            {/* Mot de passe oublié */}
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={{ alignSelf: 'center', marginTop: DIMENSIONS.SPACING_MD }}
            >
              <Text
                style={{
                  fontSize: FONTS.SIZE.SM,
                  color: COLORS.PRIMARY,
                  textDecorationLine: 'underline',
                }}
              >
                Mot de passe oublié ?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Inscription */}
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
              Pas encore de compte ?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text
                style={{
                  fontSize: FONTS.SIZE.MD,
                  fontWeight: 'bold',
                  color: COLORS.PRIMARY,
                }}
              >
                S'inscrire
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
