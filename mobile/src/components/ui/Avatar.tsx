import { Image, StyleSheet, Text, View } from 'react-native';
import { mediaUrl } from '@/api/client';

/** Fotoğraf varsa gösterir, yoksa renkli daire + baş harf. */
export function Avatar({
  name,
  photoUrl,
  color,
  size = 56,
}: {
  name?: string;
  photoUrl?: string | null;
  color?: string;
  size?: number;
}) {
  const uri = mediaUrl(photoUrl);
  const bg = color || '#c9b7e4';
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{name?.charAt(0)?.toUpperCase() || '?'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  initial: { fontWeight: '800', color: 'rgba(255,255,255,0.95)' },
});
