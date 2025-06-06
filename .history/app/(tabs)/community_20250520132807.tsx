import {
  CommunityService,
  type Post,
  type Trainer,
} from '@/services/community';
import { useAuth } from '@/src/context/AuthContext';
import { useGym } from '@/src/context/GymContext';
import {
  Award,
  Heart,
  MessageCircle,
  Share2,
  Star,
  Users as UsersIcon,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CommunityScreen() {
  const { user } = useAuth();
  const { currentGym } = useGym();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentGym) {
      loadCommunityData();
    }
  }, [user, currentGym]);

  const loadCommunityData = async () => {
    if (!currentGym) {
      setError('Por favor, selecione uma academia nas configurações do perfil');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [trainersData, postsData] = await Promise.all([
        CommunityService.getFeaturedTrainers(user, currentGym.id),
        CommunityService.getCommunityPosts(user, currentGym.id),
      ]);
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
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: post.isLiked ? post.likes - 1 : post.likes + 1,
                isLiked: !post.isLiked,
              }
            : post
        )
      );
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
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId ? { ...post, comments: post.comments + 1 } : post
        )
      );
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
      Alert.alert('Sucesso', 'Publicação compartilhada com sucesso!');
    } catch (err) {
      Alert.alert('Erro', 'Falha ao compartilhar publicação');
    }
  };

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
      setTrainers((currentTrainers) =>
        currentTrainers.map((trainer) =>
          trainer.id === trainerId
            ? {
                ...trainer,
                followers: trainer.isFollowing
                  ? trainer.followers - 1
                  : trainer.followers + 1,
                isFollowing: !trainer.isFollowing,
              }
            : trainer
        )
      );
    } catch (err) {
      Alert.alert('Erro', 'Falha ao seguir treinador');
    }
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
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Comunidade</Text>
          <Text style={styles.subtitle}>
            Conecte-se com sua comunidade fitness
          </Text>
        </View>

        <View style={styles.content}>
          <GymSelector />

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
                  <View style={styles.trainerInfo}>
                    <Text style={styles.trainerName}>{trainer.name}</Text>
                    <Text style={styles.trainerSpecialty}>
                      {trainer.specialty}
                    </Text>
                    <View style={styles.trainerStats}>
                      <View style={styles.statItem}>
                        <Star size={16} color="#FFD700" />
                        <Text style={styles.statText}>{trainer.rating}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <UsersIcon size={16} color="#666" />
                        <Text style={styles.statText}>{trainer.followers}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.followButton,
                        trainer.isFollowing && styles.followingButton,
                      ]}
                      onPress={() => handleFollow(trainer.id)}
                    >
                      <Text
                        style={[
                          styles.followButtonText,
                          trainer.isFollowing && styles.followingButtonText,
                        ]}
                      >
                        {trainer.isFollowing ? 'Seguindo' : 'Seguir'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Community Posts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Feed da Comunidade</Text>
            {posts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <Image
                    source={{ uri: post.user.image }}
                    style={styles.userAvatar}
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{post.user.name}</Text>
                    <View style={styles.badgeContainer}>
                      <Award size={12} color="#00E6C3" />
                      <Text style={styles.badgeText}>{post.user.badge}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.postContent}>{post.content}</Text>
                <Image source={{ uri: post.image }} style={styles.postImage} />

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
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
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
    width: 200,
    marginRight: 15,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  trainerImage: {
    width: '100%',
    height: 150,
  },
  trainerInfo: {
    padding: 15,
  },
  trainerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  trainerSpecialty: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  trainerStats: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#666',
    fontSize: 14,
  },
  followButton: {
    backgroundColor: '#00E6C3',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#333',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  followingButtonText: {
    color: '#666',
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
});
