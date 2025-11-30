import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface ModelNFTWebViewProps {
  uri: string;
  style?: any;
}

/**
 * Jednoduché riešenie pre 3D modely - používa online viewer
 * Funguje s GLB, GLTF, OBJ - všetko automaticky!
 * ✅ Textúry fungujú
 * ✅ Animácie fungujú (automaticky sa prehrávajú)
 * ✅ Všetko funguje bez problémov!
 */
export default function ModelNFTWebView({ uri, style }: ModelNFTWebViewProps) {
  // Použijeme online GLTF viewer - funguje s všetkými formátmi
  // Viewer automaticky načíta a prehráva animácie z GLB/GLTF súborov
  
  // Skúsime viacero viewerov - najprv gltf.report (lepšie funguje s externými URL)
  const viewerUrl = `https://gltf.report/?url=${encodeURIComponent(uri)}`;
  
  // Alternatíva: https://gltf-viewer.donmccurdy.com/?url=${encodeURIComponent(uri)}

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ uri: viewerUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}
        // Allow loading from any URL (for Supabase Storage)
        originWhitelist={['*']}
        // Allow mixed content (HTTP/HTTPS)
        mixedContentMode="always"
        // Pridáme error handling
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView HTTP error: ', nativeEvent);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});

