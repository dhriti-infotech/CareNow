import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  acceptNurseRequest,
  declineNurseRequest,
  getNurseRequests,
  getNurseProfile,
  updateNurseLocation,
  type NurseServiceRequest,
} from '../api/professionalRequests';

export default function ProfessionalRequestsScreen() {
  const params = useLocalSearchParams<{ requestId?: string }>();
  const [requests, setRequests] = useState<NurseServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [trackingActive, setTrackingActive] = useState(false);

  const loadRequests = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      const data = await getNurseRequests();
      setRequests(data);
    } catch (error: any) {
      Alert.alert('Unable to load requests', error?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRequests();
    }, [loadRequests])
  );

  useEffect(() => {
    const interval = setInterval(() => void loadRequests(true), 5000);
    return () => clearInterval(interval);
  }, [loadRequests]);

  useEffect(() => {
    let active = true;
    void getNurseProfile()
      .then((profile) => {
        if (active) setTrackingActive(profile.availabilityStatus === 'BUSY');
      })
      .catch((error) => console.warn('Unable to check nurse tracking status', error));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!trackingActive) return;
    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== Location.PermissionStatus.GRANTED) return;
        if (cancelled) return;

        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
          (position) => {
            if (cancelled) return;
            void updateNurseLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }).catch((error) => console.warn('Unable to update nurse live location', error));
          },
        );
      } catch (error) {
        console.warn('Unable to start nurse tracking', error);
      }
    };

    void startTracking();
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [trackingActive]);

  const handleAccept = async (requestId: string) => {
    if (busyRequestId) return;
    setBusyRequestId(requestId);
    try {
      await acceptNurseRequest(requestId);
      setTrackingActive(true);
      setRequests((current) => current.filter((item) => item.requestId !== requestId));
      router.push({ pathname: '/nurse-service-map', params: { requestId } });
    } catch (error: any) {
      Alert.alert('Unable to accept request', error?.message ?? 'This request may no longer be available.');
      await loadRequests(true);
    } finally {
      setBusyRequestId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    if (busyRequestId) return;
    setBusyRequestId(requestId);
    try {
      await declineNurseRequest(requestId);
      setRequests((current) => current.filter((item) => item.requestId !== requestId));
      Alert.alert('Request declined', 'The request has been declined and will be offered to another eligible nurse when available.');
    } catch (error: any) {
      Alert.alert('Unable to decline request', error?.message ?? 'Please try again.');
    } finally {
      setBusyRequestId(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A9FB5" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#173B46" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Requests</Text>
          <Text style={styles.headerSubtitle}>{requests.length} new service request{requests.length === 1 ? '' : 's'}</Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadRequests(true)} tintColor="#0A9FB5" />}
        showsVerticalScrollIndicator={false}
      >
        {requests.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="clipboard-outline" size={34} color="#0A9FB5" />
            </View>
            <Text style={styles.emptyTitle}>No new requests</Text>
            <Text style={styles.emptyText}>New requests matched to your availability will appear here.</Text>
          </View>
        ) : (
          requests.map((request) => (
            <RequestCard
              key={request.requestId}
              request={request}
              highlighted={params.requestId === request.requestId}
              busy={busyRequestId === request.requestId}
              onAccept={() => void handleAccept(request.requestId)}
              onDecline={() => void handleDecline(request.requestId)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function RequestCard({
  request,
  highlighted,
  busy,
  onAccept,
  onDecline,
}: {
  request: NurseServiceRequest;
  highlighted: boolean;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const urgent = request.priority === 'URGENT';
  return (
    <View style={[styles.requestCard, highlighted && styles.highlightedCard]}>
      <View style={styles.requestHeader}>
        <View style={styles.requestIcon}>
          <Ionicons name="medical-outline" size={22} color="#0A9FB5" />
        </View>
        <View style={styles.requestHeaderContent}>
          <Text style={styles.requestType} numberOfLines={1}>{request.serviceType}</Text>
          <Text style={styles.requestId} numberOfLines={1}>
            {request.requestId} • {formatRequestTime(request.requestedAt)}
          </Text>
        </View>
        {urgent && <View style={styles.urgentBadge}><Text style={styles.urgentText}>URGENT</Text></View>}
      </View>

      <View style={styles.requestDetails}>
        <RequestDetail icon="person-outline" text={request.patientName} />
        <RequestDetail icon="location-outline" text={request.distanceKm == null ? 'Distance unavailable' : `${request.distanceKm.toFixed(1)} km`} />
        <RequestDetail icon="cash-outline" text={`₹${request.offeredPrice.toFixed(0)}`} />
      </View>

      <View style={styles.requestBottom}>
        <TouchableOpacity style={styles.declineButton} disabled={busy} onPress={onDecline}>
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptButton} disabled={busy} onPress={onAccept}>
          {busy ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.acceptButtonText}>Accept Request</Text>}
          {!busy && <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RequestDetail({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={17} color="#6F8D99" />
      <Text style={styles.detailText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

function formatRequestTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return value;
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} day ago`;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7FCFD' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#6F8D99', fontSize: 13 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingTop: 10, paddingBottom: 12 },
  headerButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerTextWrap: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 23, fontWeight: '800', color: '#173B46' },
  headerSubtitle: { marginTop: 2, fontSize: 12, color: '#6F8D99' },
  content: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 32 },
  requestCard: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#DDECEF', padding: 16, marginBottom: 14, shadowColor: '#173B46', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  highlightedCard: { borderColor: '#0A9FB5', borderWidth: 2 },
  requestHeader: { flexDirection: 'row', alignItems: 'center' },
  requestIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: '#E7F8F8', alignItems: 'center', justifyContent: 'center' },
  requestHeaderContent: { flex: 1, marginLeft: 12 },
  requestType: { fontSize: 16, fontWeight: '800', color: '#173B46' },
  requestId: { marginTop: 4, fontSize: 11, color: '#7A9199' },
  urgentBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: '#FFF1DF' },
  urgentText: { fontSize: 10, fontWeight: '800', color: '#C7791C' },
  requestDetails: { marginTop: 15, gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailText: { marginLeft: 8, flex: 1, fontSize: 13, color: '#526973' },
  requestBottom: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 16, gap: 10 },
  declineButton: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: '#D7E4E7' },
  declineButtonText: { fontSize: 13, fontWeight: '700', color: '#526973' },
  acceptButton: { minWidth: 145, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, backgroundColor: '#0A9FB5', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  acceptButtonText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 35, paddingTop: 110 },
  emptyIcon: { width: 78, height: 78, borderRadius: 39, backgroundColor: '#E7F8F8', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#173B46' },
  emptyText: { marginTop: 8, fontSize: 13, color: '#6F8D99', textAlign: 'center', lineHeight: 20 },
});
