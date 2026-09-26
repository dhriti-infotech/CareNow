import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';

export default function IndexScreen() {
  const { isLoading, isAuthenticated, user, restoreSession } = useAuth();
  useEffect(() => { void restoreSession(); }, [restoreSession]);
  if (isLoading) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>;
  if (!isAuthenticated || !user) return <Redirect href="/login" />;
  if (user.role === 'USER') return <Redirect href="/(tabs)" />;
  if (user.verificationStatus === 'APPROVED') return <Redirect href="/professional-home" />;
  return <Redirect href={{ pathname: '/professional-verification', params: { status: user.verificationStatus ?? 'PENDING' } }} />;
}
