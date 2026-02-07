/**
 * RoleSelectionScreen - Sélection du rôle utilisateur
 * Design grille 2x2 avec cartes premium
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather as Icon } from '@expo/vector-icons';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../../theme/colors';
import { RoleCard } from '../../components/premium';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

const ROLES = [
  {
    id: 'player',
    title: 'Joueur',
    description: 'Je cherche une équipe',
    icon: 'user',
  },
  {
    id: 'manager',
    title: 'Manager',
    description: 'Je gère mon équipe',
    icon: 'clipboard',
  },
  {
    id: 'referee',
    title: 'Arbitre',
    description: 'J\'arbitre les matchs',
    icon: 'flag',
  },
  {
    id: 'venue_owner',
    title: 'Propriétaire',
    description: 'Je loue mon terrain',
    icon: 'home',
  },
];

export const RoleSelectionScreen = ({ navigation }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    // Petit feedback visuel
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 1.02,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleContinue = () => {
    if (selectedRole) {
      navigation.navigate('Register', { userType: selectedRole });
    }
  };

  const handlePressIn = () => {
    if (selectedRole) {
      Animated.spring(buttonScale, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 50,
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background gradient */}
      <LinearGradient
        colors={GRADIENTS.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="arrow-left" size={22} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Title section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Qui es-tu ?</Text>
          <Text style={styles.subtitle}>
            Choisis ton profil pour une expérience personnalisée
          </Text>
        </View>

        {/* Role cards grid */}
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            {ROLES.slice(0, 2).map((role) => (
              <View key={role.id} style={styles.cardWrapper}>
                <RoleCard
                  role={role.id}
                  title={role.title}
                  description={role.description}
                  icon={role.icon}
                  selected={selectedRole === role.id}
                  onPress={() => handleRoleSelect(role.id)}
                />
              </View>
            ))}
          </View>
          <View style={styles.gridRow}>
            {ROLES.slice(2, 4).map((role) => (
              <View key={role.id} style={styles.cardWrapper}>
                <RoleCard
                  role={role.id}
                  title={role.title}
                  description={role.description}
                  icon={role.icon}
                  selected={selectedRole === role.id}
                  onPress={() => handleRoleSelect(role.id)}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Info text */}
        <View style={styles.infoContainer}>
          <Icon name="info" size={14} color={COLORS.TEXT_MUTED} />
          <Text style={styles.infoText}>
            Tu pourras modifier ton rôle plus tard dans les paramètres
          </Text>
        </View>
      </ScrollView>

      {/* Bottom section */}
      <View style={styles.bottomContainer}>
        <Animated.View
          style={[
            styles.buttonWrapper,
            { transform: [{ scale: buttonScale }] },
            selectedRole && SHADOWS.glow,
          ]}
        >
          <TouchableOpacity
            onPress={handleContinue}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={!selectedRole}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={selectedRole ? GRADIENTS.button : [COLORS.BORDER, COLORS.BORDER]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.continueButton}
            >
              <Text
                style={[
                  styles.continueButtonText,
                  !selectedRole && styles.continueButtonTextDisabled,
                ]}
              >
                Continuer
              </Text>
              <Icon
                name="arrow-right"
                size={20}
                color={selectedRole ? COLORS.WHITE : COLORS.TEXT_MUTED}
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
          hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
        >
          <Text style={styles.loginLinkText}>
            Déjà un compte ?{' '}
            <Text style={styles.loginLinkTextBold}>Se connecter</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.DARK,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.GLASS,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  titleSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.WHITE,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 22,
  },
  gridContainer: {
    marginBottom: 24,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.GLASS_LIGHT,
    borderRadius: RADIUS.md,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.TEXT_MUTED,
    marginLeft: 8,
    textAlign: 'center',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: COLORS.DARK_SURFACE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  buttonWrapper: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: RADIUS.md,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginRight: 8,
    letterSpacing: 0.5,
  },
  continueButtonTextDisabled: {
    color: COLORS.TEXT_MUTED,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 15,
    color: COLORS.TEXT_SECONDARY,
  },
  loginLinkTextBold: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
});

export default RoleSelectionScreen;
