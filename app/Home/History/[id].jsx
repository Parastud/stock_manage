import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import axiosInstance from '../../../src/utils/axios';

export default function OrderHistory() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Toast.show({ type: 'error', text1: 'User token missing' });
        setLoading(false);
        return;
      }
      const res = await axiosInstance.get(`/orders/${id}?view=true`, {
        headers: { Authorization: token },
      });
      setOrder(res?.data?.data || null);
    } catch (error) {
      const errMsg =
        error?.response?.data?.errors?.[0]?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch order';
      Toast.show({ type: 'error', text1: errMsg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const getDateTime = (iso) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      if (isNaN(d)) return '-';
      return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    } catch {
      return '-';
    }
  };

  const customerName = order?.customerId?.name || 'N/A';
  const orderDate = getDateTime(order?.date);
  const createdAt = getDateTime(order?.createdAt);

  const items = useMemo(() => Array.isArray(order?.items) ? order.items : [], [order]);

  // Compute today total, oldpending, etc. - with null checks
  const todayTotal = items.reduce((sum, it) => sum + Number(it?.amount ?? 0), 0);
  const oldpending = Number(order?.oldPending ?? order?.oldpending ?? 0);
  const totalAmountForReceipt = todayTotal + oldpending;
  const cash = Number(order?.payment?.cash || 0);
  const online = Number(order?.payment?.online || 0);
  const totalPayment = cash + online;
  const totalPending = totalAmountForReceipt - totalPayment;

  // FIXED: Added null check for order before using 'in' operator
  const hasDetailedOrder = order && 'oldPending' in order;
  const simpleOrderTotal = Number(order?.totalAmount || todayTotal);
  const onOpenReceipt = () => {
    const paramsToSend = {
      source: 'order',
      _id: order?._id || '',
      date: order?.date || new Date().toISOString(),
      customername: customerName,
      cart: JSON.stringify(items),
      payment: JSON.stringify({ cash, online }),
    };

    if (hasDetailedOrder) {
      paramsToSend.todayTotal = todayTotal;
      paramsToSend.oldpending = oldpending;
      paramsToSend.totalAmount = totalAmountForReceipt;
      paramsToSend.totalPending = totalPending;
    } else {
      paramsToSend.totalAmount = simpleOrderTotal;
    }

    router.push({
      pathname: '/Home/Receipt',
      params: paramsToSend,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#07363C', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="white" />
        <Toast />
      </SafeAreaView>
    );
  }

  return (
    <>
      <LinearGradient colors={['#13545c', '#07363C']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
            <Text style={styles.headerTitle}>Order Details</Text>
            <Text style={styles.headerSubtitle}>Order ID: {order?._id || '-'}</Text>
          </View>

          <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.label}>Customer Name</Text>
                <Text style={styles.valueStrong}>{customerName}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.rowBetween}>
                <Text style={styles.label}>Order Date</Text>
                <Text style={styles.value}>{orderDate}</Text>
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.label}>Created At</Text>
                <Text style={styles.value}>{createdAt}</Text>
              </View>
            </View>
          </View>

          <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Payment Info</Text>
              <View style={{ height: 8 }} />
              <View style={styles.pillsWrap}>
                {hasDetailedOrder ? (
                  <>
                    <View style={styles.pillTotal}>
                      <Ionicons name="receipt-outline" size={14} color="#0f172a" />
                      <Text style={styles.pillTextDark}>Today Total: ₹{todayTotal.toFixed(2)}</Text>
                    </View>
                    <View style={styles.pillTotal}>
                      <Ionicons name="archive-outline" size={14} color="#0f172a" />
                      <Text style={styles.pillTextDark}>Old Balance: ₹{oldpending.toFixed(2)}</Text>
                    </View>
                    <View style={[styles.pillTotal, { backgroundColor: '#dbeafe' }]}>
                      <Ionicons name="calculator-outline" size={14} color="#1e3a8a" />
                      <Text style={[styles.pillTextDark, { color: '#1e3a8a' }]}>Total Amount: ₹{totalAmountForReceipt.toFixed(2)}</Text>
                    </View>
                    <View style={styles.pillCash}>
                      <Ionicons name="cash-outline" size={14} color="#065f46" />
                      <Text style={styles.pillTextCash}>Cash: ₹{cash.toFixed(2)}</Text>
                    </View>
                    <View style={styles.pillOnline}>
                      <Ionicons name="card-outline" size={14} color="#1e3a8a" />
                      <Text style={styles.pillTextOnline}>Online: ₹{online.toFixed(2)}</Text>
                    </View>
                    <View style={styles.pillPending}>
                      <Ionicons name="alert-circle-outline" size={14} color="#7c2d12" />
                      <Text style={styles.pillTextPending}>Pending: ₹{totalPending.toFixed(2)}</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.pillTotal}>
                      <Ionicons name="calculator-outline" size={14} color="#0f172a" />
                      <Text style={styles.pillTextDark}>Order Total: ₹{simpleOrderTotal.toFixed(2)}</Text>
                    </View>
                    <View style={styles.pillCash}>
                      <Ionicons name="cash-outline" size={14} color="#065f46" />
                      <Text style={styles.pillTextCash}>Cash: ₹{cash.toFixed(2)}</Text>
                    </View>
                    <View style={styles.pillOnline}>
                      <Ionicons name="card-outline" size={14} color="#1e3a8a" />
                      <Text style={styles.pillTextOnline}>Online: ₹{online.toFixed(2)}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>

          <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Items</Text>
              {items.length === 0 ? (
                <View style={{ paddingVertical: 12 }}>
                  <Text style={{ color: '#6b7280' }}>No items found</Text>
                </View>
              ) : (
                <View style={{ marginTop: 8 }}>
                  <View style={[styles.itemRow, styles.itemHeader]}>
                    <Text style={[styles.itemCellSno, styles.itemHeaderText]}>S.No</Text>
                    <Text style={[styles.itemCellName, styles.itemHeaderText]}>Item Name</Text>
                    <Text style={[styles.itemCellQty, styles.itemHeaderText]}>Qty</Text>
                    <Text style={[styles.itemCellAmt, styles.itemHeaderText]}>Amount</Text>
                  </View>
                  {items.map((it, idx) => {
                    const name = it?.itemId?.name || it?.name || 'N/A';
                    const qty = Number(it?.quantity || it?.qty || 0);
                    const amount = Number(
                      it?.amount ?? (it?.price && qty ? it.price * qty : 0)
                    );

                    return (
                      <View key={it?._id || `${idx}`} style={styles.itemRow}>
                        <Text style={styles.itemCellSno}>{idx + 1}</Text>
                        <Text style={styles.itemCellName} numberOfLines={1}>{name}</Text>
                        <Text style={styles.itemCellQty}>{qty}</Text>
                        <Text style={styles.itemCellAmt}>₹{amount.toFixed(2)}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.receiptBtn} onPress={onOpenReceipt}>
            <Ionicons name="document-text-outline" size={18} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.receiptBtnText}>Open Receipt</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <Toast />
    </>
  );
}

// ... rest of the styles remain the same
const styles = StyleSheet.create({
  headerTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 20,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#e2e8f0',
    textAlign: 'center',
    marginTop: 6,
  },
  card: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 14,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  label: { color: '#6b7280', fontSize: 13, fontWeight: '600' },
  value: { color: '#111827', fontSize: 13 },
  valueStrong: { color: '#0f172a', fontSize: 14, fontWeight: '700' },
  sectionTitle: { color: '#374151', fontWeight: '700', fontSize: 14 },
  pillsWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 4 },
  pillTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  pillCash: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  pillOnline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  pillPending: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  pillTextDark: { color: '#0f172a', fontSize: 12, fontWeight: '700' },
  pillTextCash: { color: '#065f46', fontSize: 12, fontWeight: '700' },
  pillTextOnline: { color: '#1e3a8a', fontSize: 12, fontWeight: '700' },
  pillTextPending: { color: '#7c2d12', fontSize: 12, fontWeight: '700' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
  },
  itemHeader: {
    backgroundColor: '#f9fafb',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  itemHeaderText: { color: '#374151', fontWeight: '700' },
  itemCellSno: { width: 50, color: '#111827', fontSize: 12, fontWeight: '600' },
  itemCellName: { flex: 1, color: '#111827', fontSize: 12, paddingRight: 8 },
  itemCellQty: { width: 60, textAlign: 'right', color: '#111827', fontSize: 12 },
  itemCellAmt: { width: 90, textAlign: 'right', color: '#111827', fontSize: 12, fontWeight: '700' },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 24 : 16,
    paddingHorizontal: 24,
  },
  receiptBtn: {
    backgroundColor: '#0f766e',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  receiptBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
});
