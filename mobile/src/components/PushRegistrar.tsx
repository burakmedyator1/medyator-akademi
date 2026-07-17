import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { registerForPush } from '@/lib/push';
import { api } from '@/api/client';

/** Giriş yapmış kullanıcı için push token alıp backend'e kaydeder. */
export function PushRegistrar() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    registerForPush().then((token) => {
      if (token) api.registerPushToken(token).catch(() => {});
    });
  }, [user]);
  return null;
}
