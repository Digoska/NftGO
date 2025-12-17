import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';
// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';

interface WebViewModelProps {
  uri: string;
  poster?: string;
  autoRotate?: boolean;
  isStatic?: boolean;
  onLoad?: () => void;
}

export default function WebViewModel({ uri, poster, autoRotate = true, isStatic = false, onLoad }: WebViewModelProps) {
  const [loading, setLoading] = useState(true);
  const [modelSrc, setModelSrc] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('Initializing...');

  useEffect(() => {
    let isMounted = true;

    const loadModel = async () => {
      try {
        if (!uri) return;

        // Create a unique filename based on the URI
        const hash = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          uri
        );
        const modelsDir = `${FileSystem.documentDirectory}models/`;
        const fileUri = `${modelsDir}${hash}.glb`;

        // Ensure directory exists
        const dirInfo = await FileSystem.getInfoAsync(modelsDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(modelsDir, { intermediates: true });
        }

        // Check if file exists
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        
        if (fileInfo.exists) {
          if (isMounted) setStatusText('Loading from cache...');
          // Read cached file
          const base64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          if (isMounted) setModelSrc(`data:model/gltf-binary;base64,${base64}`);
        } else {
          if (isMounted) setStatusText('Downloading model...');
          // Download file
          await FileSystem.downloadAsync(uri, fileUri);
          
          if (isMounted) setStatusText('Processing...');
          // Read downloaded file
          const base64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          if (isMounted) setModelSrc(`data:model/gltf-binary;base64,${base64}`);
        }
      } catch (error) {
        // Fallback to online URI if caching fails
        if (isMounted) setModelSrc(uri);
      }
    };

    loadModel();

    return () => {
      isMounted = false;
    };
  }, [uri]);

  // Google <model-viewer> HTML content
  // Note: camera-controls removed and pointer-events: none added to disable interaction
  // Optimized for grid display when isStatic is true
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
            pointer-events: none; /* Disable user interaction */
          }
        </style>
      </head>
      <body>
        <model-viewer
          src="${modelSrc || ''}"
          auto-rotate="${isStatic ? 'false' : autoRotate}"
          autoplay="${!isStatic}"
          shadow-intensity="${isStatic ? '0' : '1'}"
          camera-orbit="${isStatic ? '45deg 55deg 150%' : 'auto'}"
          disable-zoom
          interaction-prompt="none"
          environment-image="neutral"
          loading="eager"
          reveal="auto"
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
          <Text style={styles.loadingText}>{statusText}</Text>
        </View>
      )}

      {modelSrc && (
        <WebView
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={[styles.webview, { opacity: loading ? 0 : 1 }]}
          onLoadEnd={() => {
            setLoading(false);
            onLoad?.();
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          scalesPageToFit={true}
          scrollEnabled={false}
          androidLayerType="hardware"
        />
      )}
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
