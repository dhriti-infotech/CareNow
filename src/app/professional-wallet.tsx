import { Ionicons } from '@expo/vector-icons';
import RazorpayCheckout from 'react-native-razorpay';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  createNurseSecurityPaymentOrder,
  getNurseSecurityWallet,
  verifyNurseSecurityPayment,
  type NurseSecurityWallet,
} from '@/api/professionalRequests';

const COLORS = {
  background: '#F5FAFB',
  surface: '#FFFFFF',
  primary: '#0A9FB5',
  text: '#173B46',
  muted: '#607A83',
  border: '#DCE9EC',
  danger: '#C24141',
  success: '#15803D',
};

const QUICK_AMOUNTS = [500, 1000, 2000];

export default function ProfessionalWalletScreen() {
  const [wallet, setWallet] = useState<NurseSecurityWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState('');
  const [paying, setPaying] = useState(false);

  const loadWallet = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true); else setLoading(true);
      setWallet(await getNurseSecurityWallet());
    } catch (error: any) {
      Alert.alert('Unable to load wallet', error?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadWallet();
  }, [loadWallet]));

  const amount = customAmount.trim() ? Number(customAmount) : selectedAmount;
  const validAmount = Number.isFinite(amount) && amount >= (wallet?.requiredSecurityBalance ? 100 : 100);

  const handleAddFunds = async () => {
    if (!validAmount) {
      Alert.alert('Invalid amount', 'Please enter a valid amount of at least ₹100.');
      return;
    }
    if (!wallet?.onlinePaymentAvailable) {
      Alert.alert(
        'Payment setup required',
        'Online security-deposit payment is not configured on the CareNow backend yet. Add the Razorpay configuration before accepting live payments.',
      );
      return;
    }

    setPaying(true);
    try {
      const order = await createNurseSecurityPaymentOrder(amount);

      const result = await RazorpayCheckout.open({
        key: order.keyId,
        amount: Math.round(order.amount * 100).toString(),
        currency: order.currency,
        name: order.name,
        description: order.description,
        order_id: order.orderId,
        prefill: {
          name: order.prefillName ?? '',
          email: order.prefillEmail ?? '',
          contact: order.prefillContact ?? '',
        },
        theme: { color: COLORS.primary },
      });

      const verification = await verifyNurseSecurityPayment({
        orderId: order.orderId,
        paymentId: result.razorpay_payment_id,
        signature: result.razorpay_signature,
      });

      await loadWallet(true);

      if (!verification.success) {
        Alert.alert('Payment verification pending', verification.message);
        return;
      }

      Alert.alert('Payment successful', verification.message);
    } catch (error: any) {
      // Razorpay rejects/cancels the checkout through the same Promise path.
      // Do not credit the wallet from the client; only backend verification can do that.
      const message = error?.description || error?.message || 'Payment was cancelled or could not be completed.';
      Alert.alert('Payment not completed', message);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading security wallet...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const balance = wallet?.securityBalance ?? 0;
  const minimum = wallet?.requiredSecurityBalance ?? 0;
  const available = wallet?.availableBalance ?? 0;
  const progress = minimum > 0 ? Math.min(balance / minimum, 1) : 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security Wallet</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => void loadWallet(true)}>
          <Ionicons name="refresh-outline" size={21} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 140 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.statusCard, wallet?.depositRequired ? styles.statusCardWarning : styles.statusCardOk]}>
          <View style={styles.statusIcon}>
            <Ionicons
              name={wallet?.depositRequired ? 'warning-outline' : 'shield-checkmark-outline'}
              size={25}
              color={wallet?.depositRequired ? '#B45309' : COLORS.success}
            />
          </View>
          <View style={styles.statusCopy}>
            <Text style={styles.statusTitle}>
              {wallet?.depositRequired ? 'Security deposit required' : wallet?.lowBalance ? 'Security balance is low' : 'Security balance is sufficient'}
            </Text>
            <Text style={styles.statusText}>{wallet?.message}</Text>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <View>
              <Text style={styles.balanceLabel}>Security balance</Text>
              <Text style={styles.balanceAmount}>₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.walletIcon}>
              <Ionicons name="wallet-outline" size={26} color={COLORS.primary} />
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>Required minimum ₹{minimum.toFixed(2)}</Text>
            <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <Metric label="Available for allocation" value={`₹${available.toFixed(2)}`} icon="checkmark-circle-outline" />
          <Metric label="Reserved exposure" value={`₹${(wallet?.reservedRequestExposure ?? 0).toFixed(2)}`} icon="lock-closed-outline" />
        </View>

        <View style={styles.metricsRow}>
          <Metric label="Outstanding legacy fees" value={`₹${(wallet?.outstandingPlatformFees ?? 0).toFixed(2)}`} icon="receipt-outline" />
          <Metric label="Low-balance alert" value={`₹${(wallet?.lowBalanceThreshold ?? 0).toFixed(2)}`} icon="notifications-outline" />
        </View>

        <Text style={styles.sectionTitle}>Add security funds</Text>
        <Text style={styles.sectionSubtitle}>
          Funds are held as security coverage for CareNow platform-fee settlement obligations. New requests are restricted when the required coverage is not available.
        </Text>

        <View style={styles.quickGrid}>
          {QUICK_AMOUNTS.map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.quickButton, !customAmount && selectedAmount === value && styles.quickButtonSelected]}
              onPress={() => { setSelectedAmount(value); setCustomAmount(''); }}
            >
              <Text style={[styles.quickText, !customAmount && selectedAmount === value && styles.quickTextSelected]}>₹{value}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.customWrap}>
          <Text style={styles.inputLabel}>Custom amount</Text>
          <View style={styles.inputRow}>
            <Text style={styles.currency}>₹</Text>
            <TextInput
              value={customAmount}
              onChangeText={(value) => setCustomAmount(value.replace(/[^0-9.]/g, ''))}
              placeholder="Enter amount"
              placeholderTextColor="#9AAEB5"
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.payButton, (paying || !wallet?.onlinePaymentAvailable) && styles.payButtonDisabled]}
          activeOpacity={0.85}
          disabled={paying}
          onPress={() => void handleAddFunds()}
        >
          {paying ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="card-outline" size={20} color="#FFFFFF" />}
          <Text style={styles.payButtonText}>{paying ? 'Opening secure payment...' : 'Add Funds Securely'}</Text>
          {!paying && <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
        </TouchableOpacity>

        {!wallet?.onlinePaymentAvailable && (
          <Text style={styles.configText}>Online payment is disabled until Razorpay test credentials are configured on the CareNow backend.</Text>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={21} color={COLORS.primary} />
          <Text style={styles.infoText}>
            CareNow never accepts a client-side balance update. A successful payment is verified by the backend before the security balance is credited.
          </Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.metricCard}>
      <Ionicons name={icon} size={19} color={COLORS.primary} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: { height: 60, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  headerButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF9FA' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '900', color: COLORS.text },
  content: { padding: 18, paddingBottom: 40 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  statusCard: { borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  statusCardWarning: { backgroundColor: '#FFF8E8', borderColor: '#F4D89B' },
  statusCardOk: { backgroundColor: '#EEF9F1', borderColor: '#C9E8D1' },
  statusIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  statusCopy: { flex: 1, marginLeft: 11 },
  statusTitle: { fontSize: 13, fontWeight: '900', color: COLORS.text },
  statusText: { marginTop: 4, fontSize: 10.5, lineHeight: 16, color: COLORS.muted },
  balanceCard: { marginTop: 14, backgroundColor: COLORS.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: COLORS.border },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { fontSize: 11, color: COLORS.muted, fontWeight: '700' },
  balanceAmount: { marginTop: 5, fontSize: 30, fontWeight: '900', color: COLORS.text },
  walletIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#E8F7F8', alignItems: 'center', justifyContent: 'center' },
  progressTrack: { marginTop: 18, height: 9, backgroundColor: '#E5EEF0', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 6 },
  progressLabels: { marginTop: 7, flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 9.5, color: COLORS.muted, fontWeight: '700' },
  metricsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  metricCard: { flex: 1, minHeight: 94, backgroundColor: COLORS.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  metricValue: { marginTop: 7, fontSize: 15, fontWeight: '900', color: COLORS.text },
  metricLabel: { marginTop: 3, fontSize: 9.5, lineHeight: 14, color: COLORS.muted },
  sectionTitle: { marginTop: 22, fontSize: 18, fontWeight: '900', color: COLORS.text },
  sectionSubtitle: { marginTop: 6, fontSize: 10.5, lineHeight: 17, color: COLORS.muted },
  quickGrid: { flexDirection: 'row', gap: 10, marginTop: 14 },
  quickButton: { flex: 1, minHeight: 52, borderRadius: 13, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  quickButtonSelected: { borderColor: COLORS.primary, backgroundColor: '#EAF8F9' },
  quickText: { fontSize: 14, fontWeight: '900', color: COLORS.text },
  quickTextSelected: { color: COLORS.primary },
  customWrap: { marginTop: 13 },
  inputLabel: { fontSize: 10, color: COLORS.muted, fontWeight: '800', marginBottom: 5 },
  inputRow: { height: 52, borderRadius: 13, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13 },
  currency: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  input: { flex: 1, marginLeft: 8, fontSize: 15, color: COLORS.text, fontWeight: '700' },
  payButton: { marginTop: 15, minHeight: 54, borderRadius: 14, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  payButtonDisabled: { opacity: 0.65 },
  payButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  configText: { marginTop: 9, textAlign: 'center', fontSize: 9.5, lineHeight: 14, color: COLORS.muted },
  infoCard: { marginTop: 18, backgroundColor: '#EEF8FA', borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  infoText: { flex: 1, fontSize: 10, lineHeight: 16, color: COLORS.muted },
});
