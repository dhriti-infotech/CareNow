import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import MapTilerLiveMap from '@/components/MapTilerLiveMap';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  Modal,
  TextInput,
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
} from '@/api/professionalRequests';

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
  const [completionCodeModalVisible, setCompletionCodeModalVisible] = useState(false);
  const [completionCode, setCompletionCode] = useState("");
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const sheetHeight = useRef(new Animated.Value(245)).current;
  const sheetStartHeight = useRef(245);

  const animateSheet = useCallback((expanded: boolean) => {
    setSheetExpanded(expanded);
    Animated.spring(sheetHeight, {
      toValue: expanded ? 470 : 245,
      useNativeDriver: false,
      tension: 55,
      friction: 9,
    }).start();
  }, [sheetHeight]);

  const sheetPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) =>
      Math.abs(gestureState.dy) > 4 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
    onPanResponderGrant: () => {
      sheetStartHeight.current = sheetExpanded ? 470 : 245;
    },
    onPanResponderMove: (_, gestureState) => {
      const nextHeight = Math.max(225, Math.min(560, sheetStartHeight.current - gestureState.dy));
      sheetHeight.setValue(nextHeight);
    },
    onPanResponderRelease: (_, gestureState) => {
      if (Math.abs(gestureState.dy) < 18) {
        animateSheet(!sheetExpanded);
      } else if (gestureState.dy < -45) {
        animateSheet(true);
      } else if (gestureState.dy > 45) {
        animateSheet(false);
      } else {
        animateSheet(sheetStartHeight.current > 350);
      }
    },
    onPanResponderTerminate: () => animateSheet(sheetStartHeight.current > 350),
  }), [animateSheet, sheetExpanded, sheetHeight]);

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

    if (action.status === "COMPLETED") {
      setCompletionCode("");
      setCompletionCodeModalVisible(true);
      return;
    }

    setActionBusy(true);
    try {
      const updated = await updateNurseServiceStatus(requestId, action.status);
      setRequest(updated);
      if (action.status === 'EN_ROUTE') {
        Alert.alert('Journey started', 'The patient can now see that you are on the way.');
      } else if (action.status === 'ARRIVED') {
        Alert.alert('Arrived', 'You have reached the patient location.');
      } else if (action.status === 'IN_SERVICE') {
        Alert.alert('Service started', 'The patient can now see that the service has started and will receive a completion passcode.');
      }
    } catch (error: any) {
      Alert.alert('Unable to update status', error?.message ?? 'Please try again.');
    } finally {
      setActionBusy(false);
    }
  };

  const submitCompletionCode = async () => {
    if (!requestId || !completionCode.trim() || completionCode.trim().length !== 6 || actionBusy) return;
    setActionBusy(true);
    try {
      const updated = await updateNurseServiceStatus(requestId, 'COMPLETED', completionCode.trim());
      setRequest(updated);
      setCompletionCodeModalVisible(false);
      Alert.alert('Service completed', 'The patient passcode was verified and the service is now completed.', [
        { text: 'Done', onPress: () => router.replace('/professional-home') },
      ]);
    } catch (error: any) {
      Alert.alert('Invalid passcode', error?.message ?? 'The completion passcode is incorrect. Please enter the code shown on the patient app.');
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
          Platform.OS === 'android' ? (
            <MapTilerLiveMap
              patient={{ latitude: patientLatitude!, longitude: patientLongitude! }}
              nurse={nurseLocation}
            />
          ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
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
          )
        ) : (
          <View style={styles.mapFallback}>
            <Ionicons name="location-outline" size={44} color="#94A3B8" />
            <Text style={styles.mapFallbackText}>Patient destination coordinates are unavailable.</Text>
          </View>
        )}

        <Animated.View style={[styles.bottomSheet, { height: sheetHeight }]}>
          <View style={styles.handleHitArea} {...sheetPanResponder.panHandlers}>
            <View style={styles.handle} />
          </View>
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

          {sheetExpanded && (
            <View style={styles.expandedInfo}>
              <View style={styles.expandedRow}>
                <Ionicons name="person-outline" size={20} color="#0EA5B7" />
                <View style={styles.expandedTextWrap}>
                  <Text style={styles.expandedLabel}>Patient</Text>
                  <Text style={styles.expandedValue}>{request.patientName}</Text>
                </View>
              </View>
              <View style={styles.expandedRow}>
                <Ionicons name="location-outline" size={20} color="#0EA5B7" />
                <View style={styles.expandedTextWrap}>
                  <Text style={styles.expandedLabel}>Service location</Text>
                  <Text style={styles.expandedValue} numberOfLines={3}>{request.locationAddress || 'Patient service location'}</Text>
                </View>
              </View>
            </View>
          )}

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
        </Animated.View>
      </View>

      <Modal
        visible={completionCodeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !actionBusy && setCompletionCodeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.completionModal}>
            <View style={styles.completionIcon}>
              <Ionicons name="keypad-outline" size={26} color="#2563EB" />
            </View>
            <Text style={styles.completionTitle}>Verify service completion</Text>
            <Text style={styles.completionSubtitle}>Enter the 6-digit passcode shown on the patient's CareNow screen.</Text>
            <TextInput
              value={completionCode}
              onChangeText={(value) => setCompletionCode(value.replace(/\D/g, "").slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="000000"
              placeholderTextColor="#94A3B8"
              style={styles.completionInput}
              autoFocus
            />
            <View style={styles.completionActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setCompletionCodeModalVisible(false)}
                disabled={actionBusy}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.verifyButton, (completionCode.length !== 6 || actionBusy) && styles.verifyButtonDisabled]}
                onPress={() => void submitCompletionCode()}
                disabled={completionCode.length !== 6 || actionBusy}
              >
                {actionBusy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.verifyButtonText}>Verify & Complete</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  handleHitArea: { height: 44, alignItems: 'center', justifyContent: 'center' },
  handle: { width: 48, height: 5, borderRadius: 3, backgroundColor: '#CBD5E1' },
  patientRow: { flexDirection: 'row', alignItems: 'center' },
  patientIcon: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#EAF8FA', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C9EEF2' },
  patientInfo: { flex: 1, marginLeft: 14 },
  patientName: { fontSize: 20, fontWeight: '800', color: '#102A43' },
  serviceType: { marginTop: 2, fontSize: 13, color: '#64748B' },
  address: { marginTop: 4, fontSize: 11, lineHeight: 16, color: '#64748B' },
  statusPill: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECFDF5', borderRadius: 18, paddingVertical: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A', marginRight: 7 },
  statusText: { fontSize: 12, fontWeight: '800', color: '#15803D' },
  expandedInfo: { marginTop: 12, gap: 12 },
  expandedRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  expandedTextWrap: { flex: 1 },
  expandedLabel: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  expandedValue: { marginTop: 2, fontSize: 13, lineHeight: 18, fontWeight: '700', color: '#102A43' },
  primaryButton: { marginTop: 12, height: 52, borderRadius: 14, backgroundColor: '#0EA5B7', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  completionModal: { width: '100%', maxWidth: 390, backgroundColor: '#FFFFFF', borderRadius: 22, padding: 22 },
  completionIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  completionTitle: { marginTop: 13, fontSize: 19, fontWeight: '900', color: '#0F172A', textAlign: 'center' },
  completionSubtitle: { marginTop: 7, fontSize: 12, lineHeight: 18, color: '#64748B', textAlign: 'center' },
  completionInput: { marginTop: 16, height: 56, borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 13, backgroundColor: '#F8FBFF', textAlign: 'center', fontSize: 24, fontWeight: '900', letterSpacing: 7, color: '#1D4ED8' },
  completionActions: { flexDirection: 'row', gap: 9, marginTop: 14 },
  cancelButton: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { fontSize: 13, fontWeight: '800', color: '#475569' },
  verifyButton: { flex: 1.4, height: 48, borderRadius: 12, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' },
  verifyButtonDisabled: { opacity: 0.5 },
  verifyButtonText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, color: '#64748B', fontSize: 13 },
});
