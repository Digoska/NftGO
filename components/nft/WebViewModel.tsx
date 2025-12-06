import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';

interface WebViewModelProps {
  uri: string;
  poster?: string;
  autoRotate?: boolean;
}

export default function WebViewModel({ uri, poster, autoRotate = true }: WebViewModelProps) {
  const [loading, setLoading] = useState(true);

  // Google <model-viewer> HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js"></script>
        <style>
          body { margin: 0; background-color: transparent; overflow: hidden; }
          model-viewer {
            width: 100vw;
            height: 100vh;
            background-color: transparent;
            --poster-color: transparent;
          }
        </style>
      </head>
      <body>
        <model-viewer
          src="${uri}"
          camera-controls
          auto-rotate="${autoRotate}"
          autoplay
          shadow-intensity="1"
          camera-orbit="45deg 55deg 2.5m"
          disable-zoom
          interaction-prompt="none"
        >
        </model-viewer>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#6C5CE7" />
          <Text style={styles.loadingText}>Loading 3D Model...</Text>
        </View>
      )}

      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={true}
        scrollEnabled={false}
        androidLayerType="hardware"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    borderRadius: 16,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  }
});

