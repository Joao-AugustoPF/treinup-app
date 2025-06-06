import { useAuth } from '@/src/context/AuthContext';
import { useGym } from '@/src/context/GymContext';
import { useProfile } from '@/src/context/ProfileContext';
import {
  CommunityService,
  type Post,
  type Trainer,
} from '@/src/services/community';
import * as ImagePicker from 'expo-image-picker';
import {
  Award,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  MoreVertical,
  Share2,
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
      await CommunityService.likePost(user, postId, currentGym.id);
      // This will be implemented in a future update
    } catch (err) {
      Alert.alert('Erro', 'Falha ao curtir a publicação');
    }
  };

  const handleComment = async (postId: string) => {
    if (!currentGym) {
      Alert.alert(
        'Erro',
        'Por favor, selecione uma academia nas configurações do perfil'
      );
      return;
    }

    try {
      await CommunityService.commentOnPost(user, postId, '', currentGym.id);
      // This will be implemented in a future update
    } catch (err) {
      Alert.alert('Erro', 'Falha ao adicionar comentário');
    }
  };

  const handleShare = async (postId: string) => {
    if (!currentGym) {
      Alert.alert(
        'Erro',
        'Por favor, selecione uma academia nas configurações do perfil'
      );
      return;
    }

    try {
      await CommunityService.sharePost(user, postId, currentGym.id);
      // This will be implemented in a future update
    } catch (err) {
      Alert.alert('Erro', 'Falha ao compartilhar publicação');
    }
  };

  console.log(posts);

  const handleFollow = async (trainerId: string) => {
    if (!currentGym) {
      Alert.alert(
        'Erro',
        'Por favor, selecione uma academia nas configurações do perfil'
      );
      return;
    }

    try {
      await CommunityService.followTrainer(user, trainerId, currentGym.id);
      // This will be implemented in a future update
    } catch (err) {
      Alert.alert('Erro', 'Falha ao seguir treinador');
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
        imageUrl
      );
      setPosts((currentPosts) => [post, ...currentPosts]);
      setNewPostContent('');
      setSelectedImage(null);
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
        style={styles.postInput}
        placeholder="Compartilhe algo com a comunidade..."
        placeholderTextColor="#666"
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
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSelectImage}
        >
          <ImageIcon size={24} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.postButton,
            !newPostContent.trim() &&
              !selectedImage &&
              styles.postButtonDisabled,
          ]}
          onPress={handleCreatePost}
          disabled={isPosting || (!newPostContent.trim() && !selectedImage)}
        >
          {isPosting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>Publicar</Text>
          )}
        </TouchableOpacity>
      </View>
    ),
    [newPostContent, selectedImage, isPosting]
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

  // Update the post card rendering to include edit/delete buttons
  const renderPostCard = (post: Post) => {
    const canEdit = post.authorId === profile?.id || profile?.role === 'OWNER';
    const canDelete = canEdit;
    const isEditable =
      canEdit &&
      new Date().getTime() - new Date(post.createdAt).getTime() <=
        5 * 60 * 1000;

    return (
      <View key={post.id} style={styles.postCard}>
        <View style={styles.postHeader}>
          <Image
            source={{ uri: post.author.image }}
            style={styles.userAvatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{post.author.name}</Text>
            <View style={styles.badgeContainer}>
              <Award size={12} color="#00E6C3" />
              <Text style={styles.badgeText}>{post.author.role}</Text>
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
              <MoreVertical size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.postContent}>{post.content}</Text>
        {post.mediaUrl && (
          <Image source={{ uri: post.mediaUrl }} style={styles.postImage} />
        )}

        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(post.id)}
          >
            <Heart
              size={20}
              color={post.isLiked ? '#FF4444' : '#666'}
              fill={post.isLiked ? '#FF4444' : 'none'}
            />
            <Text style={styles.actionText}>{post.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleComment(post.id)}
          >
            <MessageCircle size={20} color="#666" />
            <Text style={styles.actionText}>{post.comments}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShare(post.id)}
          >
            <Share2 size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#00E6C3" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadCommunityData}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00E6C3']}
            tintColor="#00E6C3"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Comunidade</Text>
          <Text style={styles.subtitle}>
            Conecte-se com sua comunidade fitness
          </Text>
        </View>

        <View style={styles.content}>
          {/* Create Post Section */}
          {canCreatePost && (
            <View style={styles.createPostSection}>
              {PostInput}
              {SelectedImage}
              {PostActions}
            </View>
          )}

          {/* Featured Trainers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Treinadores em Destaque</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.trainersScroll}
            >
              {trainers.map((trainer) => (
                <View key={trainer.id} style={styles.trainerCard}>
                  <Image
                    source={{ uri: trainer.image }}
                    style={styles.trainerImage}
                  />
                  <Text style={styles.trainerName}>{trainer.name}</Text>
                  <Text style={styles.trainerSpecialty}>Personal Trainer</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Community Posts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Feed da Comunidade</Text>
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
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Editar Publicação</Text>
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setEditingPost(null);
                    setEditContent('');
                    setEditImage(null);
                  }}
                >
                  <Text style={styles.modalCloseButton}>×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollContent}>
                <TextInput
                  style={styles.editInput}
                  placeholder="Edite sua publicação..."
                  placeholderTextColor="#666"
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
                      style={styles.removeImageButton}
                      onPress={() => setEditImage(null)}
                    >
                      <Text style={styles.removeImageText}>×</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalActionButton}
                  onPress={handleSelectEditImage}
                >
                  <ImageIcon size={24} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalActionButton, styles.saveButton]}
                  onPress={() => {
                    Keyboard.dismiss();
                    handleSaveEdit();
                  }}
                >
                  <Text style={styles.saveButtonText}>Salvar</Text>
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
    backgroundColor: '#121212',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#00E6C3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
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
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  createPostSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    margin: 20,
    padding: 15,
  },
  postInput: {
    color: '#fff',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  createPostActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  postButton: {
    backgroundColor: '#00E6C3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
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
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  trainerSpecialty: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  postCard: {
    backgroundColor: '#1a1a1a',
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
    color: '#fff',
    marginBottom: 2,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    color: '#00E6C3',
    marginLeft: 4,
  },
  postContent: {
    color: '#fff',
    fontSize: 14,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  postImage: {
    width: '100%',
    height: 300,
  },
  postActions: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    color: '#666',
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
    backgroundColor: '#1a1a1a',
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
    color: '#fff',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#666',
    padding: 5,
  },
  editInput: {
    color: '#fff',
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
    borderTopColor: '#333',
  },
  modalActionButton: {
    padding: 10,
  },
  saveButton: {
    backgroundColor: '#00E6C3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
