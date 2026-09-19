import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getNurseRequest,
  updateNurseLocation,
  updateNurseServiceStatus,
  type NurseServiceRequest,
  type NurseServiceStatus,
} from '../api/professionalRequests';

const toNumber = (value: number | string | null | undefined) => {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const statusLabel = (status: NurseServiceRequest['status']) => {
  switch (status) {
    case 'ACCEPTED': return 'Getting ready';
    case 'EN_ROUTE': return 'On the way';
    case 'ARRIVED': return 'Reached location';
    case 'IN_SERVICE': return 'Service started';
    case 'COMPLETED': return 'Service completed';
    case 'CANCELLED': return 'Request cancelled';
    case 'EXPIRED': return 'Request expired';
    default: return 'Request';
  }
};

const nextAction = (status: NurseServiceRequest['status']): { label: string; status: NurseServiceStatus } | null => {
  switch (status) {
    case 'ACCEPTED': return { label: 'Start journey', status: 'EN_ROUTE' };
    case 'EN_ROUTE': return { label: "I've arrived", status: 'ARRIVED' };
    case 'ARRIVED': return { label: 'Start service', status: 'IN_SERVICE' };
    case 'IN_SERVICE': return { label: 'Complete service', status: 'COMPLETED' };
    default: return null;
  }
};

export default function NurseServiceMapScreen() {
  const { requestId } = useLocalSearchParams<{ requestId?: string }>();
  const mapRef = useRef<MapView | null>(null);
  const [request, setRequest] = useState<NurseServiceRequest | null>(null);
  const [nurseLocation, setNurseLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);

  const loadRequest = useCallback(async () => {
    if (!requestId) return;
    try {
      const current = await getNurseRequest(requestId);
      setRequest(current);
    } catch (error: any) {
      console.warn('Unable to load nurse service request', error);
      if (!request) {
        Alert.alert('Unable to load request', error?.message ?? 'Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [requestId, request]);

  useFocusEffect(
    useCallback(() => {
      void loadRequest();
    }, [loadRequest]),
  );

  useEffect(() => {
    if (!requestId) return;
    const interval = setInterval(() => void loadRequest(), 5000);
    return () => clearInterval(interval);
  }, [requestId, loadRequest]);

  useEffect(() => {
    if (!request || !['ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'IN_SERVICE'].includes(request.status)) {
      return;
    }

    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== Location.PermissionStatus.GRANTED || cancelled) return;

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (position) => {
            if (cancelled) return;
            const next = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setNurseLocation(next);
            void updateNurseLocation(next).catch((error) =>
              console.warn('Unable to publish nurse location', error),
            );
          },
        );
      } catch (error) {
        console.warn('Unable to start nurse location tracking', error);
      }
    };

    void startTracking();
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [request?.status]);

  const patientLatitude = toNumber(request?.latitude);
  const patientLongitude = toNumber(request?.longitude);

  const initialRegion = useMemo<Region>(() => ({
    latitude: patientLatitude ?? 17.3850,
    longitude: patientLongitude ?? 78.4867,
    latitudeDelta: 0.035,
    longitudeDelta: 0.035,
  }), [patientLatitude, patientLongitude]);

  useEffect(() => {
    if (!mapRef.current || patientLatitude == null || patientLongitude == null) return;
    const coordinates = [{ latitude: patientLatitude, longitude: patientLongitude }];
    if (nurseLocation) coordinates.push(nurseLocation);
    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 90, right: 45, bottom: 300, left: 45 },
      animated: true,
    });
  }, [patientLatitude, patientLongitude, nurseLocation]);

  const performNextAction = async () => {
    if (!requestId || !request) return;
    const action = nextAction(request.status);
    if (!action || actionBusy) return;

    setActionBusy(true);
    try {
      const updated = await updateNurseServiceStatus(requestId, action.status);
      setRequest(updated);
      if (action.status === 'EN_ROUTE') {
        Alert.alert('Journey started', 'The patient can now see that you are on the way.');
      } else if (action.status === 'ARRIVED') {
        Alert.alert('Arrived', 'You have reached the patient location.');
      } else if (action.status === 'IN_SERVICE') {
        Alert.alert('Service started', 'The patient can now see that the service has started.');
      } else if (action.status === 'COMPLETED') {
        Alert.alert('Service completed', 'The service has been marked completed.', [
          { text: 'Done', onPress: () => router.replace('/professional-home') },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Unable to update status', error?.message ?? 'Please try again.');
    } finally {
      setActionBusy(false);
    }
  };

  if (loading || !request) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A9FB5" />
          <Text style={styles.loadingText}>Loading service location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const destinationAvailable = patientLatitude != null && patientLongitude != null;
  const action = nextAction(request.status);
  const routeVisible = destinationAvailable && nurseLocation != null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Patient location</Text>
            <Text style={styles.headerSubtitle}>{statusLabel(request.status)}</Text>
          </View>
          <TouchableOpacity style={styles.headerButton} onPress={() => void loadRequest()}>
            <Ionicons name="refresh" size={22} color="#0EA5B7" />
          </TouchableOpacity>
        </View>

        {destinationAvailable ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={initialRegion}
            showsCompass
            showsScale
            showsMyLocationButton
          >
            <Marker
              coordinate={{ latitude: patientLatitude!, longitude: patientLongitude! }}
              title={request.patientName}
              description="Patient destination"
            >
              <View style={styles.destinationMarker}>
                <Ionicons name="home" size={20} color="#FFFFFF" />
              </View>
            </Marker>

            {nurseLocation && (
              <Marker coordinate={nurseLocation} title="Your location" anchor={{ x: 0.5, y: 0.5 }}>
                <View style={styles.nurseMarker}>
                  <Ionicons name="navigate" size={24} color="#FFFFFF" />
                </View>
              </Marker>
            )}

            {routeVisible && (
              <Polyline
                coordinates={[nurseLocation!, { latitude: patientLatitude!, longitude: patientLongitude! }]}
                strokeColor="#0EA5B7"
                strokeWidth={4}
                lineDashPattern={[8, 6]}
              />
            )}
          </MapView>
        ) : (
          <View style={styles.mapFallback}>
            <Ionicons name="location-outline" size={44} color="#94A3B8" />
            <Text style={styles.mapFallbackText}>Patient destination coordinates are unavailable.</Text>
          </View>
        )}

        <View style={styles.bottomSheet}>
          <View style={styles.handle} />
          <View style={styles.patientRow}>
            <View style={styles.patientIcon}>
              <Ionicons name="person" size={28} color="#0EA5B7" />
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{request.patientName}</Text>
              <Text style={styles.serviceType}>{request.serviceType}</Text>
              <Text style={styles.address} numberOfLines={2}>{request.locationAddress}</Text>
            </View>
          </View>

          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{statusLabel(request.status)}</Text>
          </View>

          {action && (
            <TouchableOpacity
              style={styles.primaryButton}
              disabled={actionBusy}
              onPress={() => void performNextAction()}
              activeOpacity={0.85}
            >
              {actionBusy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name={action.status === 'EN_ROUTE' ? 'navigate-outline' : action.status === 'ARRIVED' ? 'location-outline' : action.status === 'IN_SERVICE' ? 'medkit-outline' : 'checkmark-circle-outline'}
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.primaryButtonText}>{action.label}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1 },
  header: {
    height: 68,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 5,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EAF8FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 19, fontWeight: '800', color: '#102A43' },
  headerSubtitle: { marginTop: 2, fontSize: 12, color: '#0EA5B7', fontWeight: '700' },
  map: { flex: 1 },
  mapFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF8FA', paddingHorizontal: 30 },
  mapFallbackText: { marginTop: 10, color: '#64748B', textAlign: 'center', fontSize: 13 },
  destinationMarker: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#0EA5B7', borderWidth: 3,
    borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  nurseMarker: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#2563EB', borderWidth: 3,
    borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 5,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 20, paddingTop: 9, paddingBottom: 20, shadowColor: '#000',
    shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: -4 }, elevation: 12,
  },
  handle: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', marginBottom: 14 },
  patientRow: { flexDirection: 'row', alignItems: 'center' },
  patientIcon: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#EAF8FA', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C9EEF2' },
  patientInfo: { flex: 1, marginLeft: 14 },
  patientName: { fontSize: 20, fontWeight: '800', color: '#102A43' },
  serviceType: { marginTop: 2, fontSize: 13, color: '#64748B' },
  address: { marginTop: 4, fontSize: 11, lineHeight: 16, color: '#64748B' },
  statusPill: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECFDF5', borderRadius: 18, paddingVertical: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A', marginRight: 7 },
  statusText: { fontSize: 12, fontWeight: '800', color: '#15803D' },
  primaryButton: { marginTop: 12, height: 52, borderRadius: 14, backgroundColor: '#0EA5B7', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, color: '#64748B', fontSize: 13 },
});
