/**
 * SplashScreen - Premium animated splash avec logo FC
 * Animation fluide de 2.5s avant transition
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, GRADIENTS, SHADOWS } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

const ONBOARDING_COMPLETE_KEY = '@foot_connect_onboarding_complete';

export const SplashScreen = ({ navigation }) => {
  // Animations
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    startSplashSequence();
  }, []);

  const startSplashSequence = async () => {
    try {
      const hasCompletedOnboarding = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);

      // Lancer l'animation
      await runAnimation();

      // Navigation selon le statut
      if (hasCompletedOnboarding === 'true') {
        navigation.replace('Login');
      } else {
        navigation.replace('Welcome');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      navigation.replace('Welcome');
    }
  };

  const runAnimation = () => {
    return new Promise((resolve) => {
      // Démarrer la pulsation en boucle
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      Animated.sequence([
        // Phase 1: Logo apparaît avec scale et légère rotation (0-600ms)
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(logoScale, {
            toValue: 1,
            friction: 5,
            tension: 50,
            useNativeDriver: true,
          }),
          Animated.timing(logoRotate, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),

        // Phase 2: Texte "FOOT CONNECT" apparaît (600-1000ms)
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(textTranslateY, {
            toValue: 0,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),

        // Phase 3: Tagline apparaît (1000-1200ms)
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),

        // Phase 4: Hold (1200-2200ms)
        Animated.delay(1000),

        // Phase 5: Fade out (2200-2500ms)
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        pulseLoop.stop();
        resolve();
      });
    });
  };

  const logoRotation = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '0deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient
        colors={GRADIENTS.splash}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      >
        {/* Cercles décoratifs en arrière-plan */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />

        {/* Logo FC animé */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [
                { scale: Animated.multiply(logoScale, pulseAnim) },
                { rotate: logoRotation },
              ],
            },
          ]}
        >
          <View style={styles.logoGlow}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Nom de l'app */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <Text style={styles.appName}>FOOT CONNECT</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          La communauté du football amateur
        </Animated.Text>

        {/* Loading indicator subtil */}
        <View style={styles.footer}>
          <LoadingDots />
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// Composant dots de chargement animés
const LoadingDots = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDots = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot1, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot1, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    animateDots();
  }, []);

  return (
    <View style={styles.loadingDots}>
      <Animated.View style={[styles.dot, { opacity: dot1 }]} />
      <Animated.View style={[styles.dot, { opacity: dot2 }]} />
      <Animated.View style={[styles.dot, { opacity: dot3 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -height * 0.2,
    right: -width * 0.3,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(0, 123, 64, 0.15)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -height * 0.15,
    left: -width * 0.25,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(0, 123, 64, 0.1)',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    ...SHADOWS.glowStrong,
    borderRadius: 40,
    padding: 10,
    backgroundColor: 'rgba(0, 123, 64, 0.1)',
  },
  logoImage: {
    width: 140,
    height: 140,
  },
  textContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.WHITE,
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 6,
  },
});

export default SplashScreen;
