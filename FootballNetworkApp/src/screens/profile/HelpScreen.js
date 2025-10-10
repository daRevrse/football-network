// ====== src/screens/profile/HelpScreen.js ======
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  StatusBar,
  Linking,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';
import { SectionCard } from '../../components/common/SectionCard';

export const HelpScreen = ({ navigation }) => {
  const isDark = useSelector(state => state.theme?.isDark || false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Catégories d'aide
  const helpCategories = [
    {
      id: 'getting-started',
      title: 'Premiers pas',
      icon: 'play-circle',
      color: '#3B82F6',
      description: "Découvrez comment utiliser l'application",
    },
    {
      id: 'teams',
      title: 'Équipes',
      icon: 'users',
      color: '#10B981',
      description: 'Créer et gérer vos équipes',
    },
    {
      id: 'matches',
      title: 'Matchs',
      icon: 'calendar',
      color: '#F59E0B',
      description: 'Organiser et participer aux matchs',
    },
    {
      id: 'account',
      title: 'Mon compte',
      icon: 'user',
      color: '#8B5CF6',
      description: 'Gérer votre profil et paramètres',
    },
  ];

  // FAQ
  const faqData = [
    {
      id: '1',
      category: 'getting-started',
      question: 'Comment créer mon premier match ?',
      answer:
        'Pour créer un match, allez dans l\'onglet "Matchs" et cliquez sur le bouton "+". Remplissez les informations du match (date, lieu, équipes) et envoyez les invitations. C\'est aussi simple que ça !',
    },
    {
      id: '2',
      category: 'getting-started',
      question: 'Comment inviter des joueurs dans mon équipe ?',
      answer:
        'Depuis la page de votre équipe, cliquez sur "Membres" puis sur le bouton "+". Entrez l\'adresse email du joueur à inviter. Il recevra une notification et pourra accepter ou refuser l\'invitation.',
    },
    {
      id: '3',
      category: 'teams',
      question: "Combien d'équipes puis-je créer ?",
      answer:
        "Avec un compte gratuit, vous pouvez créer jusqu'à 3 équipes. Les membres premium peuvent créer un nombre illimité d'équipes.",
    },
    {
      id: '4',
      category: 'teams',
      question: 'Comment changer le logo de mon équipe ?',
      answer:
        "Allez dans les paramètres de votre équipe, cliquez sur le logo actuel, puis sélectionnez une nouvelle image depuis votre galerie. L'image sera automatiquement redimensionnée.",
    },
    {
      id: '5',
      category: 'teams',
      question: "Puis-je transférer la gestion d'une équipe ?",
      answer:
        "Oui, en tant qu'administrateur, vous pouvez promouvoir un membre en administrateur ou lui transférer complètement la gestion de l'équipe depuis la page des membres.",
    },
    {
      id: '6',
      category: 'matches',
      question: 'Comment annuler un match ?',
      answer:
        'Depuis la page du match, cliquez sur les options (⋮) et sélectionnez "Annuler le match". Tous les participants recevront une notification d\'annulation.',
    },
    {
      id: '7',
      category: 'matches',
      question: "Que se passe-t-il si personne n'accepte mon invitation ?",
      answer:
        "Les invitations de match expirent après 7 jours. Si personne n'accepte dans ce délai, le match sera automatiquement annulé. Vous pouvez aussi relancer les invitations depuis la page du match.",
    },
    {
      id: '8',
      category: 'matches',
      question: "Comment noter un match après qu'il soit terminé ?",
      answer:
        "Après un match, vous recevrez une notification pour noter l'expérience. Vous pouvez noter le fair-play, l'organisation et laisser un commentaire. Ces notes aident les autres équipes à trouver de bons adversaires.",
    },
    {
      id: '9',
      category: 'account',
      question: 'Comment changer mon mot de passe ?',
      answer:
        'Allez dans Paramètres > Compte > Changer le mot de passe. Vous devrez entrer votre mot de passe actuel puis le nouveau mot de passe deux fois pour confirmer.',
    },
    {
      id: '10',
      category: 'account',
      question: 'Comment supprimer mon compte ?',
      answer:
        'Allez dans Paramètres > Compte > Supprimer mon compte. Attention : cette action est irréversible et supprimera toutes vos données (profil, équipes, matchs, messages).',
    },
    {
      id: '11',
      category: 'account',
      question: 'Mes données sont-elles sécurisées ?',
      answer:
        'Absolument ! Nous utilisons le chiffrement SSL/TLS pour toutes les communications et stockons vos mots de passe de manière sécurisée. Vos données personnelles ne sont jamais partagées sans votre consentement.',
    },
  ];

  // Filtrer les FAQ
  const filteredFaq = faqData.filter(
    faq =>
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Toggle FAQ
  const toggleFaq = useCallback(id => {
    setExpandedFaq(prev => (prev === id ? null : id));
  }, []);

  // Ouvrir une catégorie
  const handleCategoryPress = useCallback(category => {
    setSearchQuery('');
    // Scroll to category section
    Alert.alert('Info', `Section "${category.title}" bientôt disponible`);
  }, []);

  // Contacter le support
  const handleContactSupport = useCallback(() => {
    const email = 'support@footballnetwork.com';
    const subject = 'Demande de support';
    const body = "Bonjour,\n\nJ'ai besoin d'aide concernant...\n\n";

    Linking.openURL(
      `mailto:${email}?subject=${encodeURIComponent(
        subject,
      )}&body=${encodeURIComponent(body)}`,
    );
  }, []);

  // Ouvrir la documentation
  const handleOpenDocumentation = useCallback(() => {
    Linking.openURL('https://footballnetwork.com/docs');
  }, []);

  // Ouvrir les tutoriels vidéo
  const handleOpenTutorials = useCallback(() => {
    Linking.openURL('https://youtube.com/@footballnetwork');
  }, []);

  // Rejoindre la communauté
  const handleJoinCommunity = useCallback(() => {
    Alert.alert(
      'Rejoindre la communauté',
      'Où souhaitez-vous nous rejoindre ?',
      [
        {
          text: 'Discord',
          onPress: () => Linking.openURL('https://discord.gg/footballnetwork'),
        },
        {
          text: 'Facebook',
          onPress: () =>
            Linking.openURL('https://facebook.com/footballnetwork'),
        },
        {
          text: 'Twitter',
          onPress: () => Linking.openURL('https://twitter.com/footballnetwork'),
        },
        { text: 'Annuler', style: 'cancel' },
      ],
    );
  }, []);

  // Signaler un bug
  const handleReportBug = useCallback(() => {
    Alert.alert(
      'Signaler un bug',
      "Merci de nous aider à améliorer l'application ! Décrivez le problème rencontré.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          onPress: () => {
            // TODO: Ouvrir un formulaire de bug report
            Alert.alert(
              'Merci !',
              "Votre signalement a été envoyé. Nous allons l'examiner rapidement.",
            );
          },
        },
      ],
    );
  }, []);

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
          <Icon name="help-circle" size={24} color={COLORS.WHITE} />
          <Text style={styles.headerTitle}>Centre d'aide</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Barre de recherche */}
        <View
          style={[styles.searchContainer, { backgroundColor: COLORS.WHITE }]}
        >
          <Icon name="search" size={20} color={COLORS.TEXT_MUTED} />
          <TextInput
            style={[styles.searchInput, { color: COLORS.TEXT_PRIMARY }]}
            placeholder="Rechercher dans l'aide..."
            placeholderTextColor={COLORS.TEXT_MUTED}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="x" size={20} color={COLORS.TEXT_MUTED} />
            </TouchableOpacity>
          )}
        </View>

        {/* Catégories (visibles seulement si pas de recherche) */}
        {searchQuery === '' && (
          <View style={styles.categoriesGrid}>
            {helpCategories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryCard, { backgroundColor: COLORS.WHITE }]}
                onPress={() => handleCategoryPress(category)}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: `${category.color}20` },
                  ]}
                >
                  <Icon name={category.icon} size={24} color={category.color} />
                </View>
                <Text
                  style={[styles.categoryTitle, { color: COLORS.TEXT_PRIMARY }]}
                >
                  {category.title}
                </Text>
                <Text
                  style={[
                    styles.categoryDescription,
                    { color: COLORS.TEXT_MUTED },
                  ]}
                >
                  {category.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* FAQ */}
        <SectionCard
          title="Questions fréquentes"
          description={`${filteredFaq.length} question${
            filteredFaq.length > 1 ? 's' : ''
          }`}
          icon="message-circle"
        >
          {filteredFaq.length > 0 ? (
            filteredFaq.map((faq, index) => (
              <TouchableOpacity
                key={faq.id}
                style={[
                  styles.faqItem,
                  {
                    borderBottomWidth: index < filteredFaq.length - 1 ? 1 : 0,
                    borderBottomColor: COLORS.BORDER_LIGHT,
                  },
                ]}
                onPress={() => toggleFaq(faq.id)}
              >
                <View style={styles.faqHeader}>
                  <Text
                    style={[styles.faqQuestion, { color: COLORS.TEXT_PRIMARY }]}
                  >
                    {faq.question}
                  </Text>
                  <Icon
                    name={
                      expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'
                    }
                    size={20}
                    color={COLORS.TEXT_MUTED}
                  />
                </View>
                {expandedFaq === faq.id && (
                  <Text
                    style={[styles.faqAnswer, { color: COLORS.TEXT_SECONDARY }]}
                  >
                    {faq.answer}
                  </Text>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="search" size={48} color={COLORS.TEXT_MUTED} />
              <Text style={[styles.emptyText, { color: COLORS.TEXT_MUTED }]}>
                Aucune question trouvée pour "{searchQuery}"
              </Text>
            </View>
          )}
        </SectionCard>

        {/* Actions rapides */}
        <SectionCard title="Besoin de plus d'aide ?" icon="life-buoy">
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleContactSupport}
          >
            <View style={styles.actionLeft}>
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: COLORS.PRIMARY_LIGHT },
                ]}
              >
                <Icon name="mail" size={20} color={COLORS.PRIMARY} />
              </View>
              <View style={styles.actionContent}>
                <Text
                  style={[styles.actionTitle, { color: COLORS.TEXT_PRIMARY }]}
                >
                  Contacter le support
                </Text>
                <Text
                  style={[
                    styles.actionDescription,
                    { color: COLORS.TEXT_MUTED },
                  ]}
                >
                  Envoyez-nous un email
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={20} color={COLORS.TEXT_MUTED} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleOpenDocumentation}
          >
            <View style={styles.actionLeft}>
              <View
                style={[styles.actionIcon, { backgroundColor: '#3B82F620' }]}
              >
                <Icon name="book-open" size={20} color="#3B82F6" />
              </View>
              <View style={styles.actionContent}>
                <Text
                  style={[styles.actionTitle, { color: COLORS.TEXT_PRIMARY }]}
                >
                  Documentation complète
                </Text>
                <Text
                  style={[
                    styles.actionDescription,
                    { color: COLORS.TEXT_MUTED },
                  ]}
                >
                  Guides détaillés et tutoriels
                </Text>
              </View>
            </View>
            <Icon name="external-link" size={20} color={COLORS.TEXT_MUTED} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleOpenTutorials}
          >
            <View style={styles.actionLeft}>
              <View
                style={[styles.actionIcon, { backgroundColor: '#EF444420' }]}
              >
                <Icon name="video" size={20} color="#EF4444" />
              </View>
              <View style={styles.actionContent}>
                <Text
                  style={[styles.actionTitle, { color: COLORS.TEXT_PRIMARY }]}
                >
                  Tutoriels vidéo
                </Text>
                <Text
                  style={[
                    styles.actionDescription,
                    { color: COLORS.TEXT_MUTED },
                  ]}
                >
                  Apprenez en vidéo
                </Text>
              </View>
            </View>
            <Icon name="external-link" size={20} color={COLORS.TEXT_MUTED} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleJoinCommunity}
          >
            <View style={styles.actionLeft}>
              <View
                style={[styles.actionIcon, { backgroundColor: '#8B5CF620' }]}
              >
                <Icon name="users" size={20} color="#8B5CF6" />
              </View>
              <View style={styles.actionContent}>
                <Text
                  style={[styles.actionTitle, { color: COLORS.TEXT_PRIMARY }]}
                >
                  Rejoindre la communauté
                </Text>
                <Text
                  style={[
                    styles.actionDescription,
                    { color: COLORS.TEXT_MUTED },
                  ]}
                >
                  Discord, Facebook, Twitter
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={20} color={COLORS.TEXT_MUTED} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { borderBottomWidth: 0 }]}
            onPress={handleReportBug}
          >
            <View style={styles.actionLeft}>
              <View
                style={[styles.actionIcon, { backgroundColor: '#F59E0B20' }]}
              >
                <Icon name="alert-circle" size={20} color="#F59E0B" />
              </View>
              <View style={styles.actionContent}>
                <Text
                  style={[styles.actionTitle, { color: COLORS.TEXT_PRIMARY }]}
                >
                  Signaler un bug
                </Text>
                <Text
                  style={[
                    styles.actionDescription,
                    { color: COLORS.TEXT_MUTED },
                  ]}
                >
                  Aidez-nous à améliorer l'app
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={20} color={COLORS.TEXT_MUTED} />
          </TouchableOpacity>
        </SectionCard>

        {/* Info */}
        <View
          style={[styles.infoBox, { backgroundColor: COLORS.PRIMARY_LIGHT }]}
        >
          <Icon name="info" size={20} color={COLORS.PRIMARY} />
          <Text style={[styles.infoText, { color: COLORS.PRIMARY }]}>
            Temps de réponse moyen du support : 24h
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    marginBottom: DIMENSIONS.SPACING_LG,
    gap: DIMENSIONS.SPACING_SM,
    ...SHADOWS.SMALL,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.SIZE.MD,
    padding: 0,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DIMENSIONS.SPACING_SM,
    marginBottom: DIMENSIONS.SPACING_LG,
  },
  categoryCard: {
    width: '48%',
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    alignItems: 'center',
    ...SHADOWS.SMALL,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_SM,
  },
  categoryTitle: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.BOLD,
    marginBottom: DIMENSIONS.SPACING_XXS,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: FONTS.SIZE.XS,
    textAlign: 'center',
    lineHeight: FONTS.SIZE.XS * 1.4,
  },
  faqItem: {
    paddingVertical: DIMENSIONS.SPACING_MD,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    marginRight: DIMENSIONS.SPACING_SM,
  },
  faqAnswer: {
    fontSize: FONTS.SIZE.SM,
    lineHeight: FONTS.SIZE.SM * 1.6,
    marginTop: DIMENSIONS.SPACING_SM,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: DIMENSIONS.SPACING_XXL,
  },
  emptyText: {
    fontSize: FONTS.SIZE.SM,
    marginTop: DIMENSIONS.SPACING_SM,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DIMENSIONS.SPACING_MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.SPACING_MD,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.MEDIUM,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: FONTS.SIZE.SM,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_SM,
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    marginTop: DIMENSIONS.SPACING_LG,
  },
  infoText: {
    flex: 1,
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
});
