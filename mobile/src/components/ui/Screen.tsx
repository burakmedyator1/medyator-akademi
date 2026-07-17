import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
};

/** Güvenli alan + tema arka planı olan ekran sarmalayıcısı. */
export function Screen({ children, scroll = true, contentStyle, edges = ['top', 'bottom'] }: Props) {
  const { colors } = useTheme();
  const Inner = scroll ? ScrollView : View;
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bgCream }]} edges={edges}>
      <Inner
        style={styles.flex}
        contentContainerStyle={scroll ? [styles.content, contentStyle] : undefined}
      >
        {scroll ? children : <View style={[styles.content, styles.flex, contentStyle]}>{children}</View>}
      </Inner>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 20, gap: 16 },
});
