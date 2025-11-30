import React, { useState, useEffect } from 'react';
import { Image, ImageProps, View, ActivityIndicator, StyleSheet } from 'react-native';
import { getOrCacheFile } from '../../lib/nftCache';
import { colors } from '../../constants/colors';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  fallbackUri?: string;
}

export default function CachedImage({ uri, fallbackUri, style, ...props }: CachedImageProps) {
  const [cachedUri, setCachedUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadCachedImage = async () => {
      try {
        setLoading(true);
        setError(false);
        
        // Get or cache the image
        const cached = await getOrCacheFile(uri);
        
        if (mounted) {
          setCachedUri(cached);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading cached image:', err);
        if (mounted) {
          setError(true);
          setLoading(false);
          // Fallback to original URI
          setCachedUri(fallbackUri || uri);
        }
      }
    };

    loadCachedImage();

    return () => {
      mounted = false;
    };
  }, [uri, fallbackUri]);

  if (loading && !cachedUri) {
    return (
      <View style={[style, styles.loadingContainer]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <Image
      {...props}
      source={{ uri: cachedUri || uri }}
      style={style}
      onError={() => {
        if (!error) {
          setError(true);
          setCachedUri(fallbackUri || uri);
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
  },
});

