import { ResizeMode, Video } from 'expo-av';
import { useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

type VideoPlayerProps = {
  uri: string;
  style?: any;
};

export default function VideoPlayer({ uri, style }: VideoPlayerProps) {
  const [status, setStatus] = useState({});

  if (Platform.OS === 'web') {
    // Create a style object specifically for web video
    const webVideoStyle = {
      width: '100%',
      height: style?.height || 300,
      backgroundColor: '#000',
      objectFit: 'contain',
    };

    return <video style={webVideoStyle} controls playsInline src={uri} />;
  }

  // For YouTube videos
  if (uri.includes('youtube.com') || uri.includes('youtu.be')) {
    const videoId = uri.split('v=')[1] || uri.split('/').pop();
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;

    return (
      <WebView
        style={[styles.video, style]}
        source={{ uri: embedUrl }}
        allowsFullscreenVideo
      />
    );
  }

  // For direct video files
  return (
    <Video
      style={[styles.video, style]}
      source={{ uri }}
      useNativeControls
      resizeMode={ResizeMode.CONTAIN}
      isLooping={false}
      onPlaybackStatusUpdate={(status) => setStatus(status)}
    />
  );
}

const styles = StyleSheet.create({
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
});
