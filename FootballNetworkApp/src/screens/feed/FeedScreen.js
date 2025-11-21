// ====== src/screens/feed/FeedScreen.js ======
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
  StatusBar,
  Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { API_CONFIG } from '../../utils/constants/api';

// Thème "Night Mode"
const THEME = {
  BG: '#0F172A', // Slate 900
  SURFACE: '#1E293B', // Slate 800
  SURFACE_LIGHT: '#334155', // Slate 700
  TEXT: '#F8FAFC', // Slate 50
  TEXT_SEC: '#94A3B8', // Slate 400
  ACCENT: '#22C55E', // Green 500
  BORDER: '#334155', // Slate 700
  ERROR: '#EF4444', // Red 500
  LIKE: '#F43F5E', // Rose 500
};

const POST_TYPES = {
  match_announcement: { icon: 'calendar', color: '#3B82F6', label: 'Match' },
  match_result: { icon: 'trophy', color: '#EAB308', label: 'Résultat' },
  team_search: { icon: 'shield', color: '#8B5CF6', label: 'Recrutement' },
  player_search: { icon: 'user-plus', color: '#EC4899', label: 'Mercato' },
  media: { icon: 'image', color: '#10B981', label: 'Média' },
  general: {
    icon: 'message-square',
    color: THEME.TEXT_SEC,
    label: 'Discussion',
  },
};

const FeedScreen = ({ navigation }) => {
  const { token, user } = useSelector(state => state.auth);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Filtres & Modal
  const [selectedType, setSelectedType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Création
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState('general');
  const [creating, setCreating] = useState(false);

  // --- LOGIQUE API (Identique, juste nettoyage des logs) ---
  const loadPosts = useCallback(
    async (isRefresh = false) => {
      try {
        const currentOffset = isRefresh ? 0 : offset;
        const url = `${
          API_CONFIG.BASE_URL
        }/feed?limit=20&offset=${currentOffset}${
          selectedType !== 'all' ? `&type=${selectedType}` : ''
        }`;

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
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
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [token, offset, selectedType],
  );

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

  const handleLike = async (postId, isLiked) => {
    // Optimistic UI update
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
          : post,
      ),
    );

    try {
      await fetch(`${API_CONFIG.BASE_URL}/feed/${postId}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
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
        setPosts(prev => [data.post, ...prev]);
        setNewPostContent('');
        setShowCreateModal(false);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de publier le post');
    } finally {
      setCreating(false);
    }
  };

  // --- COMPOSANTS UI ---

  const FilterChip = ({ type, label, icon }) => {
    const isActive = selectedType === type;
    return (
      <TouchableOpacity
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={() => {
          setSelectedType(type);
          setOffset(0);
          setLoading(true);
        }}
      >
        <Icon
          name={icon}
          size={14}
          color={isActive ? '#000' : THEME.TEXT_SEC}
        />
        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const PostItem = ({ post }) => {
    // Sécurité données
    if (!post || !post.author) return null;

    const postType = POST_TYPES[post.type] || POST_TYPES.general;
    const isMatch =
      post.type === 'match_announcement' || post.type === 'match_result';

    return (
      <View style={styles.postCard}>
        {/* En-tête Post */}
        <View style={styles.postHeader}>
          <View style={styles.authorRow}>
            <Image
              source={{
                uri:
                  post.author.profilePicture ||
                  'https://via.placeholder.com/40',
              }}
              style={styles.avatar}
            />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>
                {post.author.firstName} {post.author.lastName}
              </Text>
              <Text style={styles.postTime}>
                {formatTime(post.createdAt)} •{' '}
                {post.author.position || 'Joueur'}
              </Text>
            </View>
          </View>

          {/* Badge Type */}
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: `${postType.color}20` },
            ]}
          >
            <Icon name={postType.icon} size={12} color={postType.color} />
            <Text style={[styles.typeText, { color: postType.color }]}>
              {postType.label}
            </Text>
          </View>
        </View>

        {/* Contenu */}
        <Text style={styles.postContent}>{post.content}</Text>

        {/* Média / Match Info */}
        {post.media && (
          <Image source={{ uri: post.media.url }} style={styles.postMedia} />
        )}

        {/* Stats Bar */}
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>{post.stats.likes} J'aime</Text>
          <View style={styles.dotSeparator} />
          <Text style={styles.statsText}>
            {post.stats.comments} Commentaires
          </Text>
        </View>

        {/* Actions Bar */}
        <View style={styles.actionsBar}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleLike(post.id, post.userLiked)}
          >
            <Icon
              name="heart"
              size={20}
              color={post.userLiked ? THEME.LIKE : THEME.TEXT_SEC}
              fill={post.userLiked ? THEME.LIKE : 'none'}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <Icon name="message-circle" size={20} color={THEME.TEXT_SEC} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <Icon name="share-2" size={20} color={THEME.TEXT_SEC} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.BG} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Le Terrain</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.iconButton, showFilters && styles.iconButtonActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Icon
              name="filter"
              size={22}
              color={showFilters ? THEME.ACCENT : THEME.TEXT}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, styles.createButton]}
            onPress={() => setShowCreateModal(true)}
          >
            <Icon name="plus" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtres Horizontal */}
      {showFilters && (
        <View style={styles.filtersWrapper}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[
              { type: 'all', label: 'Tout', icon: 'grid' },
              ...Object.entries(POST_TYPES).map(([k, v]) => ({
                type: k,
                ...v,
              })),
            ]}
            keyExtractor={item => item.type}
            renderItem={({ item }) => <FilterChip {...item} />}
            contentContainerStyle={styles.filtersContent}
          />
        </View>
      )}

      {/* Liste des Posts */}
      {loading && !refreshing ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={THEME.ACCENT} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <PostItem post={item} />}
          contentContainerStyle={styles.feedContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={THEME.ACCENT}
              colors={[THEME.ACCENT]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore && (
              <ActivityIndicator color={THEME.ACCENT} style={{ margin: 20 }} />
            )
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="wind" size={48} color={THEME.TEXT_SEC} />
              <Text style={styles.emptyText}>Le terrain est vide...</Text>
              <Text style={styles.emptySub}>Lancez la discussion !</Text>
            </View>
          }
        />
      )}

      {/* Modal Création */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.modalCancel}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouveau Post</Text>
            <TouchableOpacity
              onPress={handleCreatePost}
              disabled={!newPostContent.trim() || creating}
              style={[
                styles.modalPublish,
                (!newPostContent.trim() || creating) && { opacity: 0.5 },
              ]}
            >
              {creating ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.modalPublishText}>Publier</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {/* Sélecteur Type */}
            <View style={styles.typeSelector}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={Object.entries(POST_TYPES)}
                keyExtractor={([k]) => k}
                renderItem={({ item: [key, val] }) => (
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      newPostType === key && {
                        backgroundColor: val.color,
                        borderColor: val.color,
                      },
                    ]}
                    onPress={() => setNewPostType(key)}
                  >
                    <Icon
                      name={val.icon}
                      size={16}
                      color={newPostType === key ? '#FFF' : THEME.TEXT_SEC}
                    />
                    <Text
                      style={[
                        styles.typeOptionText,
                        newPostType === key && { color: '#FFF' },
                      ]}
                    >
                      {val.label}
                    </Text>
                  </TouchableOpacity>
                )}
                style={{ flexGrow: 0, marginBottom: 16 }}
              />
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Exprimez-vous..."
              placeholderTextColor={THEME.TEXT_SEC}
              multiline
              autoFocus
              value={newPostContent}
              onChangeText={setNewPostContent}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Utils
const formatTime = dateString => {
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = Math.floor((now - date) / (1000 * 60 * 60));

  if (diffHours < 1) return "À l'instant";
  if (diffHours < 24) return `${diffHours}h`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.BG,
  },
  // HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 16,
    backgroundColor: THEME.BG,
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: THEME.TEXT,
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  iconButtonActive: {
    borderColor: THEME.ACCENT,
    backgroundColor: `${THEME.ACCENT}10`,
  },
  createButton: {
    backgroundColor: THEME.ACCENT,
    borderColor: THEME.ACCENT,
  },
  // FILTERS
  filtersWrapper: {
    backgroundColor: THEME.BG,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: THEME.SURFACE,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  filterChipActive: {
    backgroundColor: THEME.ACCENT,
    borderColor: THEME.ACCENT,
  },
  filterText: {
    fontSize: 13,
    color: THEME.TEXT_SEC,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#000',
  },
  // POST CARD
  feedContent: {
    padding: 16,
  },
  postCard: {
    backgroundColor: THEME.SURFACE,
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.SURFACE_LIGHT,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  authorInfo: {
    marginLeft: 12,
  },
  authorName: {
    color: THEME.TEXT,
    fontSize: 15,
    fontWeight: '700',
  },
  postTime: {
    color: THEME.TEXT_SEC,
    fontSize: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  postContent: {
    color: THEME.TEXT,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  postMedia: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: THEME.BG,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER,
    marginBottom: 12,
  },
  statsText: {
    color: THEME.TEXT_SEC,
    fontSize: 12,
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: THEME.TEXT_SEC,
    marginHorizontal: 6,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Space around cleaner look
    paddingHorizontal: 12,
  },
  actionBtn: {
    padding: 8,
  },
  // EMPTY STATE
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: THEME.TEXT,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySub: {
    color: THEME.TEXT_SEC,
    marginTop: 8,
  },
  // MODAL
  modalContainer: {
    flex: 1,
    backgroundColor: THEME.BG,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER,
  },
  modalTitle: {
    color: THEME.TEXT,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCancel: {
    color: THEME.TEXT_SEC,
    fontSize: 16,
  },
  modalPublish: {
    backgroundColor: THEME.ACCENT,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  modalPublishText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalContent: {
    padding: 16,
  },
  typeSelector: {
    marginBottom: 16,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.BORDER,
    marginRight: 8,
  },
  typeOptionText: {
    color: THEME.TEXT_SEC,
    fontSize: 13,
    fontWeight: '600',
  },
  modalInput: {
    color: THEME.TEXT,
    fontSize: 16,
    minHeight: 150,
    textAlignVertical: 'top',
  },
});

export default FeedScreen;
