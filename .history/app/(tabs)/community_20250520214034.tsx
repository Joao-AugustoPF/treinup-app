import { useAuth } from '@/src/context/AuthContext';
import { useGym } from '@/src/context/GymContext';
import { useProfile } from '@/src/context/ProfileContext';
import { useTheme } from '@/src/context/ThemeContext';
import {
  CommunityService,
  type Post,
  type Trainer,
} from '@/src/services/community';
import * as ImagePicker from 'expo-image-picker';
import {
  Award,
  Clock,
  Heart,
  Image as ImageIcon,
  MoreVertical,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AlertButton,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

export default function CommunityScreen() {
  const { user } = useAuth();
  const { currentGym } = useGym();
  const { profile } = useProfile();
  const { paperTheme } = useTheme();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<{
    uri: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editImage, setEditImage] = useState<{
    uri: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);
  const [notifyUsers, setNotifyUsers] = useState(false);

  useEffect(() => {
    if (currentGym) {
      loadCommunityData();
    }
  }, [user, currentGym]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadCommunityData();
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadCommunityData = async () => {
    if (!currentGym) {
      setError('Por favor, selecione uma academia nas configurações do perfil');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [trainersData, postsData] = await Promise.all([
        CommunityService.getFeaturedTrainers(user, currentGym.tenantId),
        CommunityService.getCommunityPosts(user, currentGym.id),
      ]);
      console.log(trainersData);
      setTrainers(trainersData);
      setPosts(postsData);
    } catch (err) {
      setError('Falha ao carregar dados da comunidade');
      console.error('Error loading community data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentGym) {
      Alert.alert(
        'Erro',
        'Por favor, selecione uma academia nas configurações do perfil'
      );
      return;
    }

    try {
      const updatedPost = await CommunityService.likePost(
        user,
        postId,
        currentGym.id
      );
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === updatedPost.id ? updatedPost : post
        )
      );
    } catch (err) {
      Alert.alert('Erro', 'Falha ao curtir a publicação');
    }
  };

  const handleSelectImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // Check file size (10MB limit)
        if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
          Alert.alert(
            'Erro',
            'A imagem selecionada é muito grande. Por favor, escolha uma imagem menor que 10MB.'
          );
          return;
        }

        // Store the local image info for preview
        setSelectedImage({
          uri: asset.uri,
          name: `post-${new Date().getTime()}-${asset.fileName}`,
          type: asset.mimeType || 'image/jpeg',
          size: asset.fileSize || 0,
        });
      }
    } catch (err) {
      console.error('Error selecting image:', err);
      Alert.alert('Erro', 'Falha ao selecionar imagem');
    }
  };

  const handleCreatePost = async () => {
    if (!currentGym) {
      Alert.alert(
        'Erro',
        'Por favor, selecione uma academia nas configurações do perfil'
      );
      return;
    }

    if (!newPostContent.trim() && !selectedImage) {
      Alert.alert('Erro', 'A publicação deve conter texto ou imagem');
      return;
    }

    try {
      setIsPosting(true);

      // Upload image if there is one
      let imageUrl: string | undefined;
      if (selectedImage) {
        imageUrl = await CommunityService.uploadPostImage(selectedImage);
      }

      const post = await CommunityService.createPost(
        user,
        newPostContent.trim(),
        currentGym.id,
        imageUrl,
        notifyUsers
      );
      setPosts((currentPosts) => [post, ...currentPosts]);
      setNewPostContent('');
      setSelectedImage(null);
      setNotifyUsers(false);
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao criar publicação');
    } finally {
      setIsPosting(false);
    }
  };

  const canCreatePost = useMemo(
    () => profile?.role === 'TRAINER' || profile?.role === 'OWNER',
    [profile?.role]
  );

  // Memoize the post input component
  const PostInput = useMemo(
    () => (
      <TextInput
        style={[styles.postInput, { color: paperTheme.colors.onSurface }]}
        placeholder="Compartilhe algo com a comunidade..."
        placeholderTextColor={paperTheme.colors.onSurfaceVariant}
        multiline
        value={newPostContent}
        onChangeText={setNewPostContent}
        onFocus={() => setIsInputFocused(true)}
        onBlur={() => setIsInputFocused(false)}
      />
    ),
    [newPostContent]
  );

  // Memoize the selected image component
  const SelectedImage = useMemo(() => {
    if (!selectedImage) return null;
    return (
      <View style={styles.selectedImageContainer}>
        <Image
          source={{ uri: selectedImage.uri }}
          style={styles.selectedImage}
        />
        <TouchableOpacity
          style={styles.removeImageButton}
          onPress={() => setSelectedImage(null)}
        >
          <Text style={styles.removeImageText}>×</Text>
        </TouchableOpacity>
      </View>
    );
  }, [selectedImage]);

  // Memoize the post actions component
  const PostActions = useMemo(
    () => (
      <View style={styles.createPostActions}>
        <View style={styles.postActionsTop}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSelectImage}
          >
            <ImageIcon size={24} color={paperTheme.colors.onSurfaceVariant} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.postButton,
              { backgroundColor: paperTheme.colors.primary },
              !newPostContent.trim() &&
                !selectedImage &&
                styles.postButtonDisabled,
            ]}
            onPress={handleCreatePost}
            disabled={isPosting || (!newPostContent.trim() && !selectedImage)}
          >
            {isPosting ? (
              <ActivityIndicator size="small" color={paperTheme.colors.onPrimary} />
            ) : (
              <Text style={[styles.postButtonText, { color: paperTheme.colors.onPrimary }]}>Publicar</Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={[styles.notifyToggle, { borderTopColor: paperTheme.colors.surfaceVariant }]}>
          <Text style={[styles.notifyText, { color: paperTheme.colors.onSurfaceVariant }]}>Notificar usuários</Text>
          <Switch
            value={notifyUsers}
            onValueChange={setNotifyUsers}
            trackColor={{ false: paperTheme.colors.surfaceVariant, true: paperTheme.colors.primary }}
            thumbColor={paperTheme.colors.onPrimary}
          />
        </View>
      </View>
    ),
    [newPostContent, selectedImage, isPosting, notifyUsers]
  );

  const handleEditPost = async (post: Post) => {
    setEditingPost(post);
    setEditContent(post.content);
    if (post.mediaUrl) {
      setEditImage({
        uri: post.mediaUrl,
        name: `post-${post.id}`,
        type: 'image/jpeg',
        size: 0,
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir esta publicação?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await CommunityService.deletePost(user, postId);
              setPosts((currentPosts) =>
                currentPosts.filter((post) => post.id !== postId)
              );
            } catch (err: any) {
              Alert.alert('Erro', err.message || 'Falha ao excluir publicação');
            }
          },
        },
      ]
    );
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;

    try {
      let imageUrl: string | undefined;
      if (editImage && editImage.uri !== editingPost.mediaUrl) {
        imageUrl = await CommunityService.uploadPostImage(editImage);
      }

      const updatedPost = await CommunityService.editPost(
        user,
        editingPost.id,
        editContent,
        imageUrl
      );

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === updatedPost.id ? updatedPost : post
        )
      );

      setEditingPost(null);
      setEditContent('');
      setEditImage(null);
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao editar publicação');
    }
  };

  const handleSelectEditImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
          Alert.alert(
            'Erro',
            'A imagem selecionada é muito grande. Por favor, escolha uma imagem menor que 10MB.'
          );
          return;
        }

        setEditImage({
          uri: asset.uri,
          name: `post-${new Date().getTime()}-${asset.fileName}`,
          type: asset.mimeType || 'image/jpeg',
          size: asset.fileSize || 0,
        });
      }
    } catch (err) {
      console.error('Error selecting image:', err);
      Alert.alert('Erro', 'Falha ao selecionar imagem');
    }
  };

  const formatPostDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'agora mesmo';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${
        diffInMinutes === 1 ? 'minuto' : 'minutos'
      } atrás`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'} atrás`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'} atrás`;
    }

    // Se for mais antigo que 7 dias, mostra a data completa
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderPostCard = (post: Post) => {
    const canEdit = post.authorId === profile?.id || profile?.role === 'OWNER';
    const canDelete = canEdit;
    const isEditable =
      canEdit &&
      new Date().getTime() - new Date(post.createdAt).getTime() <=
        5 * 60 * 1000;

    console.log('Post permissions:', {
      postAuthorId: post.authorId,
      userProfileId: profile?.id,
      userRole: profile?.role,
      canEdit,
      isEditable,
    });

    return (
      <View key={post.id} style={[styles.postCard, { backgroundColor: paperTheme.colors.surface }]}>
        <View style={styles.postHeader}>
          <Image
            source={{ uri: post.author.image }}
            style={styles.userAvatar}
          />
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: paperTheme.colors.onSurface }]}>{post.author.name}</Text>
            <View style={styles.badgeContainer}>
              <Award size={12} color={paperTheme.colors.primary} />
              <Text style={[styles.badgeText, { color: paperTheme.colors.primary }]}>{post.author.role}</Text>
            </View>
          </View>
          {(canEdit || canDelete) && (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => {
                const buttons = [
                  isEditable && {
                    text: 'Editar',
                    onPress: () => handleEditPost(post),
                  },
                  canDelete && {
                    text: 'Excluir',
                    style: 'destructive' as const,
                    onPress: () => handleDeletePost(post.id),
                  },
                  {
                    text: 'Cancelar',
                    style: 'cancel' as const,
                  },
                ].filter(Boolean) as AlertButton[];

                Alert.alert('Opções', '', buttons);
              }}
            >
              <MoreVertical size={20} color={paperTheme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.postContent, { color: paperTheme.colors.onSurface }]}>{post.content}</Text>
        {post.mediaUrl && (
          <Image source={{ uri: post.mediaUrl }} style={styles.postImage} />
        )}

        <View style={[styles.postFooter, { borderTopColor: paperTheme.colors.surfaceVariant }]}>
          <View style={styles.postTimestamp}>
            <Clock size={14} color={paperTheme.colors.onSurfaceVariant} />
            <Text style={[styles.timestampText, { color: paperTheme.colors.onSurfaceVariant }]}>
              {formatPostDate(post.createdAt)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(post.id)}
          >
            <Heart
              size={20}
              color={post.isLiked ? paperTheme.colors.error : paperTheme.colors.onSurfaceVariant}
              fill={post.isLiked ? paperTheme.colors.error : 'none'}
            />
            <Text style={[
              styles.actionText,
              { color: post.isLiked ? paperTheme.colors.error : paperTheme.colors.onSurfaceVariant }
            ]}>
              {post.likes}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: paperTheme.colors.background }]}>
        <ActivityIndicator size="large" color={paperTheme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: paperTheme.colors.background }]}>
        <Text style={[styles.errorText, { color: paperTheme.colors.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: paperTheme.colors.primary }]}
          onPress={loadCommunityData}
        >
          <Text style={[styles.retryButtonText, { color: paperTheme.colors.onPrimary }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: paperTheme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[paperTheme.colors.primary]}
            tintColor={paperTheme.colors.primary}
          />
        }
      >
        <View style={[styles.header, { backgroundColor: paperTheme.colors.surface }]}>
          <Text style={[styles.title, { color: paperTheme.colors.onSurface }]}>Comunidade</Text>
          <Text style={[styles.subtitle, { color: paperTheme.colors.onSurfaceVariant }]}>
            Conecte-se com sua comunidade fitness
          </Text>
        </View>

        <View style={styles.content}>
          {/* Create Post Section */}
          {canCreatePost && (
            <View style={[styles.createPostSection, { backgroundColor: paperTheme.colors.surface }]}>
              <TextInput
                style={[styles.postInput, { color: paperTheme.colors.onSurface }]}
                placeholder="Compartilhe algo com a comunidade..."
                placeholderTextColor={paperTheme.colors.onSurfaceVariant}
                multiline
                value={newPostContent}
                onChangeText={setNewPostContent}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />
              {SelectedImage}
              <View style={styles.createPostActions}>
                <View style={styles.postActionsTop}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleSelectImage}
                  >
                    <ImageIcon size={24} color={paperTheme.colors.onSurfaceVariant} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.postButton,
                      { backgroundColor: paperTheme.colors.primary },
                      !newPostContent.trim() && !selectedImage && styles.postButtonDisabled,
                    ]}
                    onPress={handleCreatePost}
                    disabled={isPosting || (!newPostContent.trim() && !selectedImage)}
                  >
                    {isPosting ? (
                      <ActivityIndicator size="small" color={paperTheme.colors.onPrimary} />
                    ) : (
                      <Text style={[styles.postButtonText, { color: paperTheme.colors.onPrimary }]}>Publicar</Text>
                    )}
                  </TouchableOpacity>
                </View>
                <View style={[styles.notifyToggle, { borderTopColor: paperTheme.colors.surfaceVariant }]}>
                  <Text style={[styles.notifyText, { color: paperTheme.colors.onSurfaceVariant }]}>Notificar usuários</Text>
                  <Switch
                    value={notifyUsers}
                    onValueChange={setNotifyUsers}
                    trackColor={{ false: paperTheme.colors.surfaceVariant, true: paperTheme.colors.primary }}
                    thumbColor={paperTheme.colors.onPrimary}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Featured Trainers */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>Treinadores em Destaque</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.trainersScroll}
            >
              {trainers.map((trainer) => (
                <View key={trainer.id} style={[styles.trainerCard, { backgroundColor: paperTheme.colors.surface }]}>
                  <Image
                    source={{ uri: trainer.image }}
                    style={styles.trainerImage}
                  />
                  <Text style={[styles.trainerName, { color: paperTheme.colors.onSurface }]}>{trainer.name}</Text>
                  <Text style={[styles.trainerSpecialty, { color: paperTheme.colors.onSurfaceVariant }]}>Personal Trainer</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Community Posts */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>Feed da Comunidade</Text>
            {posts.map(renderPostCard)}
          </View>
        </View>
      </ScrollView>

      {/* Edit Post Modal */}
      <Modal
        visible={editingPost !== null}
        animationType="slide"
        transparent={true}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.modalContent, { backgroundColor: paperTheme.colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: paperTheme.colors.onSurface }]}>Editar Publicação</Text>
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setEditingPost(null);
                    setEditContent('');
                    setEditImage(null);
                  }}
                >
                  <Text style={[styles.modalCloseButton, { color: paperTheme.colors.onSurfaceVariant }]}>×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollContent}>
                <TextInput
                  style={[styles.editInput, { color: paperTheme.colors.onSurface }]}
                  placeholder="Edite sua publicação..."
                  placeholderTextColor={paperTheme.colors.onSurfaceVariant}
                  multiline
                  value={editContent}
                  onChangeText={setEditContent}
                />

                {editImage && (
                  <View style={styles.selectedImageContainer}>
                    <Image
                      source={{ uri: editImage.uri }}
                      style={styles.selectedImage}
                    />
                    <TouchableOpacity
                      style={[styles.removeImageButton, { backgroundColor: paperTheme.colors.error }]}
                      onPress={() => setEditImage(null)}
                    >
                      <Text style={[styles.removeImageText, { color: paperTheme.colors.onError }]}>×</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>

              <View style={[styles.modalActions, { borderTopColor: paperTheme.colors.surfaceVariant }]}>
                <TouchableOpacity
                  style={styles.modalActionButton}
                  onPress={handleSelectEditImage}
                >
                  <ImageIcon size={24} color={paperTheme.colors.onSurfaceVariant} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalActionButton, styles.saveButton, { backgroundColor: paperTheme.colors.primary }]}
                  onPress={() => {
                    Keyboard.dismiss();
                    handleSaveEdit();
                  }}
                >
                  <Text style={[styles.saveButtonText, { color: paperTheme.colors.onPrimary }]}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    padding: 20,
    paddingBottom: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  createPostSection: {
    borderRadius: 15,
    margin: 20,
    padding: 15,
  },
  postInput: {
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selectedImageContainer: {
    marginTop: 10,
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  createPostActions: {
    marginTop: 10,
  },
  postActionsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  notifyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  notifyText: {
    fontSize: 14,
    marginRight: 8,
  },
  postButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  trainersScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  trainerCard: {
    width: 100,
    marginRight: 15,
    alignItems: 'center',
    borderRadius: 10,
    padding: 10,
  },
  trainerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  trainerName: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  trainerSpecialty: {
    fontSize: 11,
    textAlign: 'center',
  },
  postCard: {
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  postContent: {
    fontSize: 14,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  postImage: {
    width: '100%',
    height: 300,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
  },
  postTimestamp: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestampText: {
    fontSize: 12,
    marginLeft: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    fontSize: 14,
    marginLeft: 5,
  },
  moreButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalScrollContent: {
    flexGrow: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    fontSize: 24,
    padding: 5,
  },
  editInput: {
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
  },
  modalActionButton: {
    padding: 10,
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
