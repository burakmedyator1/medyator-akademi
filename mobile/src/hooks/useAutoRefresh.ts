import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Bir ekran görünürken veriyi otomatik tazeler:
 *  - Ekrana her odaklanıldığında (açılış / geri dönüş) hemen yükler.
 *  - Ekran açık kaldığı sürece `intervalMs` aralıklarla sessizce yeniden yükler.
 *  - Ekrandan ayrılınca zamanlayıcıyı durdurur (pil/ağ tasarrufu).
 *
 * Web admin panelinden yapılan değişiklikler aynı backend'e yazıldığından,
 * bu sayede mobilde birkaç saniye içinde kendiliğinden yansır.
 */
export function useAutoRefresh(load: () => void | Promise<void>, intervalMs = 20000) {
  const saved = useRef(load);
  saved.current = load;

  useFocusEffect(
    useCallback(() => {
      saved.current();
      const id = setInterval(() => saved.current(), intervalMs);
      return () => clearInterval(id);
    }, [intervalMs])
  );
}
