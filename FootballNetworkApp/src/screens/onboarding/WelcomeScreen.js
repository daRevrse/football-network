/**
 * WelcomeScreen - Carousel immersif avec images football
 * 3 slides premium avant inscription
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather as Icon } from '@expo/vector-icons';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

// Images Unsplash haute qualité
const SLIDES = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
    title: 'REJOINS LE TERRAIN',
    subtitle: 'La communauté du football amateur',
    description: 'Des milliers de joueurs passionnés t\'attendent pour former des équipes et jouer ensemble.',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80',
    title: 'ORGANISE TES MATCHS',
    subtitle: 'Crée ton équipe, défie les autres',
    description: 'Planifie tes rencontres, réserve des terrains et gère ton équipe comme un pro.',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80',
    title: 'CONNECTE-TOI',
    subtitle: 'Trouve des joueurs près de chez toi',
    description: 'Rejoins une communauté active de footballeurs dans ta ville.',
  },
];

export const WelcomeScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const goToNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      navigation.navigate('RoleSelection');
    }
  };

  const goToRoleSelection = () => {
    navigation.navigate('RoleSelection');
  };

  const renderSlide = ({ item, index }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [30, 0, 30],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        <ImageBackground
          source={{ uri: item.image }}
          style={styles.imageBackground}
          resizeMode="cover"
        >
          {/* Overlay gradient */}
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.3)', 'rgba(10, 10, 10, 0.95)']}
            locations={[0, 0.4, 0.75]}
            style={styles.overlay}
          >
            {/* Contenu texte */}
            <Animated.View
              style={[
                styles.contentContainer,
                {
                  opacity,
                  transform: [{ translateY }],
                },
              ]}
            >
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </Animated.View>
          </LinearGradient>
        </ImageBackground>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {SLIDES.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 28, 8],
            extrapolate: 'clamp',
          });

          const backgroundColor = scrollX.interpolate({
            inputRange,
            outputRange: [COLORS.TEXT_MUTED, COLORS.PRIMARY, COLORS.TEXT_MUTED],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                { width: dotWidth, backgroundColor },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Skip button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={goToRoleSelection}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.skipText}>Passer</Text>
        <Icon name="chevron-right" size={16} color="rgba(255, 255, 255, 0.7)" />
      </TouchableOpacity>

      {/* Carousel */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
      />

      {/* Bottom section */}
      <View style={styles.bottomContainer}>
        {renderPagination()}

        {/* Boutons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={goToNext}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={GRADIENTS.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.nextButtonText}>
                {currentIndex === SLIDES.length - 1 ? 'Commencer' : 'Suivant'}
              </Text>
              <Icon
                name={currentIndex === SLIDES.length - 1 ? 'arrow-right' : 'chevron-right'}
                size={20}
                color={COLORS.WHITE}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Indicateur de page */}
        <Text style={styles.pageIndicator}>
          {currentIndex + 1} / {SLIDES.length}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.DARK,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: RADIUS.full,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  slide: {
    width,
    height,
  },
  imageBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: height * 0.28,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.WHITE,
    letterSpacing: 2,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 22,
    maxWidth: width * 0.85,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: 'rgba(10, 10, 10, 0.95)',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  buttonsContainer: {
    width: '100%',
    marginBottom: 16,
  },
  nextButton: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginRight: 8,
    letterSpacing: 0.5,
  },
  pageIndicator: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
    letterSpacing: 1,
  },
});

export default WelcomeScreen;
