// ============================
// FeedScreen.js - Écran du Feed Public
// ============================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import { API_CONFIG } from '../../utils/constants/api';

const COLORS = {
  PRIMARY: '#22C55E',
  SECONDARY: '#3B82F6',
  BACKGROUND_LIGHT: '#F8FAFC',
  BACKGROUND_DARK: '#1E293B',
  TEXT_PRIMARY: '#1F2937',
  TEXT_SECONDARY: '#6B7280',
  TEXT_WHITE: '#FFFFFF',
  BORDER: '#E5E7EB',
  ERROR: '#EF4444',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
};

const POST_TYPES = {
  match_announcement: { icon: 'calendar', color: COLORS.PRIMARY, label: 'Match à venir' },
  match_result: { icon: 'award', color: COLORS.SUCCESS, label: 'Résultat' },
  team_search: { icon: 'search', color: COLORS.SECONDARY, label: 'Cherche équipe' },
  player_search: { icon: 'users', color: COLORS.WARNING, label: 'Cherche joueurs' },
  media: { icon: 'image', color: '#EC4899', label: 'Media' },
  general: { icon: 'message-circle', color: COLORS.TEXT_SECONDARY, label: 'Post' },
};

const FeedScreen = ({ navigation }) => {
  const { token, user } = useSelector(state => state.auth);
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  // Filtres
  const [selectedType, setSelectedType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal de création
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState('general');
  const [creating, setCreating] = useState(false);

  // Charger les posts
  const loadPosts = useCallback(async (isRefresh = false) => {
    try {
      const currentOffset = isRefresh ? 0 : offset;
      
      const url = `${API_CONFIG.BASE_URL}/feed?limit=20&offset=${currentOffset}${
        selectedType !== 'all' ? `&type=${selectedType}` : ''
      }`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        if (isRefresh) {
          setPosts(data.posts);
          setOffset(20);
        } else {
          setPosts(prev => [...prev, ...data.posts]);
          setOffset(prev => prev + 20);
        }
        setHasMore(data.pagination.hasMore);
      }
    } catch (error) {
      console.error('Load posts error:', error);
      Alert.alert('Erreur', 'Impossible de charger le feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [token, offset, selectedType]);

  useEffect(() => {
    loadPosts(true);
  }, [selectedType]);

  const handleRefresh = () => {
    setRefreshing(true);
    setOffset(0);
    loadPosts(true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      loadPosts(false);
    }
  };

  // Liker un post
  const handleLike = async (postId, isLiked) => {
    try {
      const url = `${API_CONFIG.BASE_URL}/feed/${postId}/like`;
      const response = await fetch(url, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setPosts(prev =>
          prev.map(post =>
            post.id === postId
              ? {
                  ...post,
                  userLiked: !isLiked,
                  stats: {
                    ...post.stats,
                    likes: post.stats.likes + (isLiked ? -1 : 1),
                  },
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  // Ouvrir les commentaires
  const handleOpenComments = (postId) => {
    console.log('💬 Opening comments for post:', postId);
    // TODO: Naviguer vers l'écran de commentaires
    // navigation.navigate('PostComments', { postId });
    Alert.alert('Commentaires', 'Fonctionnalité bientôt disponible');
  };

  // Ajouter un commentaire
  const handleAddComment = async (postId, content) => {
    if (!content.trim()) {
      Alert.alert('Erreur', 'Le commentaire ne peut pas être vide');
      return;
    }

    try {
      console.log('💬 Adding comment to post:', postId);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/feed/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Comment added:', data.comment);
        
        // Mettre à jour le compteur
        setPosts(prev =>
          prev.map(post =>
            post.id === postId
              ? {
                  ...post,
                  stats: {
                    ...post.stats,
                    comments: post.stats.comments + 1,
                  },
                }
              : post
          )
        );

        return data.comment;
      } else {
        Alert.alert('Erreur', 'Impossible d\'ajouter le commentaire');
      }
    } catch (error) {
      console.error('Add comment error:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le commentaire');
    }
  };

  // Partager un post
  const handleShare = async (postId) => {
    try {
      console.log('📤 Sharing post:', postId);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/feed/${postId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sharedTo: 'feed',
          message: null,
        }),
      });

      if (response.ok) {
        console.log('✅ Post shared');
        
        // Mettre à jour le compteur
        setPosts(prev =>
          prev.map(post =>
            post.id === postId
              ? {
                  ...post,
                  stats: {
                    ...post.stats,
                    shares: post.stats.shares + 1,
                  },
                }
              : post
          )
        );

        Alert.alert('Succès', 'Post partagé !');
      } else {
        Alert.alert('Erreur', 'Impossible de partager le post');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Erreur', 'Impossible de partager le post');
    }
  };

  // Supprimer un post
  const handleDeletePost = (postId) => {
    Alert.alert(
      'Supprimer le post',
      'Êtes-vous sûr de vouloir supprimer ce post ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Deleting post:', postId);
              
              const response = await fetch(`${API_CONFIG.BASE_URL}/feed/${postId}`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (response.ok) {
                console.log('✅ Post deleted');
                setPosts(prev => prev.filter(post => post.id !== postId));
                Alert.alert('Succès', 'Post supprimé');
              } else {
                const data = await response.json();
                if (response.status === 403) {
                  Alert.alert('Erreur', 'Vous n\'êtes pas autorisé à supprimer ce post');
                } else {
                  Alert.alert('Erreur', data.error || 'Impossible de supprimer le post');
                }
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le post');
            }
          },
        },
      ]
    );
  };

  // Signaler un post
  const handleReportPost = (postId) => {
    Alert.alert(
      'Signaler le post',
      'Choisissez une raison',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Spam', onPress: () => submitReport(postId, 'spam') },
        { text: 'Harcèlement', onPress: () => submitReport(postId, 'harassment') },
        { text: 'Contenu inapproprié', onPress: () => submitReport(postId, 'inappropriate') },
        { text: 'Fausses informations', onPress: () => submitReport(postId, 'false_info') },
        { text: 'Autre', onPress: () => submitReport(postId, 'other') },
      ]
    );
  };

  const submitReport = async (postId, reason) => {
    try {
      console.log('🚩 Reporting post:', postId, reason);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/feed/${postId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason, description: null }),
      });

      if (response.ok) {
        console.log('✅ Post reported');
        Alert.alert('Merci', 'Votre signalement a été envoyé');
      } else {
        Alert.alert('Erreur', 'Impossible d\'envoyer le signalement');
      }
    } catch (error) {
      console.error('Report error:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le signalement');
    }
  };

  // Créer un post
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      Alert.alert('Erreur', 'Le contenu ne peut pas être vide');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: newPostType,
          content: newPostContent,
          locationCity: user.locationCity,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newPost = data.post;
        
        // Ajouter le post au state
        setPosts(prev => [newPost, ...prev]);
        
        // Vérification du post ajouté
        console.log('✅ Post créé avec succès:', {
          id: newPost.id,
          type: newPost.post_type || newPost.type,
          content: newPost.content?.substring(0, 50),
          author: newPost.user_id || newPost.author,
          fullPost: newPost,
        });
        
        setNewPostContent('');
        setShowCreateModal(false);
        Alert.alert('Succès', 'Post publié !');
      } else {
        Alert.alert('Erreur', 'Impossible de publier le post');
      }
    } catch (error) {
      console.error('Create post error:', error);
      Alert.alert('Erreur', 'Impossible de publier le post');
    } finally {
      setCreating(false);
    }
  };

  // Composant d'un post
  const PostItem = ({ post }) => {
    // Contrôle de validation du post
    React.useEffect(() => {
      console.log('🔍 Rendering PostItem:', {
        id: post?.id,
        hasAuthor: !!post?.author,
        hasType: !!post?.type,
        hasStats: !!post?.stats,
        postData: JSON.stringify(post).substring(0, 200),
      });

      // Vérifications de sécurité
      if (!post) {
        console.error('❌ PostItem: post is undefined');
        return;
      }
      if (!post.author) {
        console.error('❌ PostItem: post.author is missing', post);
        return;
      }
      if (!post.type) {
        console.error('❌ PostItem: post.type is missing', post);
        return;
      }
    }, [post]);

    // Protection contre les données manquantes
    if (!post || !post.author || !post.type) {
      console.error('❌ PostItem: Invalid post data', post);
      return (
        <View style={[styles.postCard, { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5' }]}>
          <Text style={{ color: '#DC2626', padding: 16 }}>
            ⚠️ Erreur d'affichage du post
          </Text>
          <Text style={{ fontSize: 10, color: '#DC2626', padding: 16 }}>
            {JSON.stringify(post, null, 2)}
          </Text>
        </View>
      );
    }

    const postType = POST_TYPES[post.type];

    if (!postType) {
      console.error('❌ PostItem: Unknown post type', post.type);
      return (
        <View style={[styles.postCard, { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FCD34D' }]}>
          <Text style={{ color: '#D97706', padding: 16 }}>
            ⚠️ Type de post inconnu: {post.type}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.postCard}>
        {/* Header du post */}
        <View style={styles.postHeader}>
          <Image
            source={{
              uri: post.author.profilePicture || 'https://via.placeholder.com/40',
            }}
            style={styles.authorAvatar}
          />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>
              {post.author.firstName} {post.author.lastName}
            </Text>
            <View style={styles.postMeta}>
              <Icon name={postType.icon} size={12} color={postType.color} />
              <Text style={styles.postTypeLabel}>{postType.label}</Text>
              <Text style={styles.postTime}>
                • {formatTime(post.createdAt)}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={() => {
              Alert.alert(
                'Actions',
                'Que voulez-vous faire ?',
                [
                  { text: 'Annuler', style: 'cancel' },
                  ...(post.author.id === user?.id 
                    ? [{
                        text: 'Supprimer',
                        style: 'destructive',
                        onPress: () => handleDeletePost(post.id),
                      }]
                    : []
                  ),
                  {
                    text: 'Signaler',
                    onPress: () => handleReportPost(post.id),
                  },
                ]
              );
            }}
          >
            <Icon name="more-horizontal" size={20} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>

        {/* Contenu */}
        <Text style={styles.postContent}>{post.content}</Text>

        {/* Media */}
        {post.media && (
          <Image source={{ uri: post.media.url }} style={styles.postMedia} />
        )}

        {/* Infos du match si applicable */}
        {post.match && (
          <View style={styles.matchInfo}>
            <Icon name="calendar" size={16} color={COLORS.SECONDARY} />
            <Text style={styles.matchText}>
              Match {post.match.status === 'completed' ? 'terminé' : 'prévu'}
            </Text>
          </View>
        )}

        {/* Stats et actions */}
        <View style={styles.postStats}>
          <Text style={styles.statsText}>
            {post.stats.likes} j'aime • {post.stats.comments} commentaires
          </Text>
        </View>

        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(post.id, post.userLiked)}
          >
            <Icon
              name="heart"
              size={20}
              color={post.userLiked ? COLORS.ERROR : COLORS.TEXT_SECONDARY}
              fill={post.userLiked ? COLORS.ERROR : 'none'}
            />
            <Text
              style={[
                styles.actionText,
                post.userLiked && { color: COLORS.ERROR },
              ]}
            >
              J'aime
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleOpenComments(post.id)}
          >
            <Icon name="message-circle" size={20} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.actionText}>Commenter</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleShare(post.id)}
          >
            <Icon name="share-2" size={20} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.actionText}>Partager</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Filtres
  const FilterChip = ({ type, label, icon }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        selectedType === type && styles.filterChipActive,
      ]}
      onPress={() => {
        setSelectedType(type);
        setOffset(0);
        setLoading(true);
      }}
    >
      <Icon
        name={icon}
        size={16}
        color={selectedType === type ? COLORS.TEXT_WHITE : COLORS.TEXT_SECONDARY}
      />
      <Text
        style={[
          styles.filterChipText,
          selectedType === type && styles.filterChipTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading && posts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Chargement du feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Le Terrain</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Icon name="filter" size={24} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Icon name="plus-circle" size={24} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtres */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[
              { type: 'all', label: 'Tout', icon: 'grid' },
              { type: 'match_announcement', label: 'Matchs', icon: 'calendar' },
              { type: 'match_result', label: 'Résultats', icon: 'award' },
              { type: 'team_search', label: 'Équipes', icon: 'search' },
              { type: 'player_search', label: 'Joueurs', icon: 'users' },
            ]}
            keyExtractor={item => item.type}
            renderItem={({ item }) => (
              <FilterChip type={item.type} label={item.label} icon={item.icon} />
            )}
            contentContainerStyle={styles.filtersList}
          />
        </View>
      )}

      {/* Feed */}
      <FlatList
        data={posts}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => <PostItem post={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.PRIMARY}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              size="small"
              color={COLORS.PRIMARY}
              style={styles.footerLoader}
            />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="inbox" size={64} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.emptyText}>Aucun post pour le moment</Text>
            <Text style={styles.emptySubtext}>
              Soyez le premier à partager quelque chose !
            </Text>
          </View>
        }
      />

      {/* Modal de création */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouveau post</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Icon name="x" size={24} color={COLORS.TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>

            {/* Type de post */}
            <View style={styles.postTypeSelector}>
              {Object.entries(POST_TYPES).map(([key, value]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.postTypeOption,
                    newPostType === key && {
                      backgroundColor: value.color,
                    },
                  ]}
                  onPress={() => setNewPostType(key)}
                >
                  <Icon
                    name={value.icon}
                    size={16}
                    color={
                      newPostType === key ? COLORS.TEXT_WHITE : value.color
                    }
                  />
                  <Text
                    style={[
                      styles.postTypeOptionText,
                      newPostType === key && { color: COLORS.TEXT_WHITE },
                    ]}
                  >
                    {value.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Contenu */}
            <TextInput
              style={styles.postInput}
              placeholder="Quoi de neuf ?"
              placeholderTextColor={COLORS.TEXT_SECONDARY}
              multiline
              numberOfLines={6}
              value={newPostContent}
              onChangeText={setNewPostContent}
              textAlignVertical="top"
            />

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.publishButton,
                  (!newPostContent.trim() || creating) && styles.buttonDisabled,
                ]}
                onPress={handleCreatePost}
                disabled={!newPostContent.trim() || creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color={COLORS.TEXT_WHITE} />
                ) : (
                  <Text style={styles.publishButtonText}>Publier</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Fonction helper pour formater le temps
const formatTime = dateString => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.TEXT_WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  filtersContainer: {
    backgroundColor: COLORS.TEXT_WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    paddingVertical: 12,
  },
  filtersList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterChipText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.TEXT_WHITE,
  },
  postCard: {
    backgroundColor: COLORS.TEXT_WHITE,
    marginBottom: 8,
    paddingVertical: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.BORDER,
  },
  authorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postTypeLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  postTime: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  moreButton: {
    padding: 4,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.TEXT_PRIMARY,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  postMedia: {
    width: '100%',
    height: 300,
    backgroundColor: COLORS.BORDER,
    marginBottom: 12,
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  matchText: {
    fontSize: 14,
    color: COLORS.SECONDARY,
    fontWeight: '500',
  },
  postStats: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  statsText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND_LIGHT,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  footerLoader: {
    paddingVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.TEXT_WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  postTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  postTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  postTypeOptionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  postInput: {
    minHeight: 150,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.BACKGROUND_LIGHT,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  publishButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_WHITE,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default FeedScreen;
