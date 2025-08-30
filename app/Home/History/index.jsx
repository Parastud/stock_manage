// app/Home/History.jsx (adjust path as needed)
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useHealth } from '../../../src/Providers/Health';
import axiosInstance from '../../../src/utils/axios';

export default function History() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter()
        const { isConnected, checkConnection } = useHealth();
  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Toast.show({ type: 'error', text1: 'User token missing' });
        if (!silent) setLoading(false);
        return;
      }
      const res = await axiosInstance.get("/orders?lastDay=true", {
        headers: { Authorization: token }
      });

      const list = res?.data?.data?.items ?? [];
      await AsyncStorage.setItem('missedorderhistory', JSON.stringify(list));
      setOrders(list);
    } catch (error) {
      const savedorders = await AsyncStorage.getItem('missedorderhistory');
      if(savedorders){
        Toast.show({
        type: "error",
        text1: "Using Pre saved Data"
      });
        setOrders(JSON.parse(savedorders));
      }
      
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders(false);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders(true);
  };

  const Header = () => (
    <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
      <Text style={styles.headerTitle}>Orders</Text>
      <Text style={styles.headerSubtitle}>All orders at a glance</Text>
    </View>
  );

  const ContainerCard = ({ children }) => (
    <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 }}>
      <View style={styles.containerCard}>{children}</View>
    </View>
  );

  const EmptyState = () => (
    <ContainerCard>
      <View style={{ alignItems: 'center', paddingVertical: 32 }}>
        <Ionicons name="file-tray-outline" size={36} color="#94a3b8" />
        <Text style={{ color: '#64748b', marginTop: 8 }}>No orders found</Text>
      </View>
    </ContainerCard>
  );

  const OrderCard = ({ order, index }) => {
    const sNo = index + 1;

    const customerName =
      order?.customerId?.name ??
      order?.customerName ??
      (typeof order?.customerId === 'string' ? order.customerId : '') ??
      '-';

    const dateLabel = order?.date
      ? new Date(order.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
      : '-';

    const itemsLabel = useMemo(() => {
      if (!Array.isArray(order?.items) || order.items.length === 0) return '-';
      return order.items
        .map((it) => {
          const name = it?.itemId?.name ?? it?.name ?? '';
          const qty = it?.quantity ?? it?.qty ?? '';
          if (!name && !qty) return '';
          return `${name} - ${qty}`;
        })
        .filter(Boolean)
        .join(', ');
    }, [order]);

    const totalAmount = Number(order?.totalAmount ?? order?.total ?? 0);
    const cash = Number(order?.payment?.cash ?? 0);
    const online = Number(order?.payment?.online ?? 0);
    const pending = totalAmount - (cash + online);

    return (
      <TouchableOpacity onPress={async() => {await checkConnection() ? router.push(`Home/History/${order._id}`) : Toast.show({ type: "error", text1: "No Internet Connection" })}}>
        <View style={styles.card}>
          {/* Top: S.No + Customer + Date */}
          <View style={styles.rowTop}>
            <View style={styles.snoBadge}>
              <Text style={styles.snoText}>{sNo}</Text>
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.customer} numberOfLines={1}>
                {customerName}
              </Text>
              <View style={styles.inline}>
                <Ionicons name="calendar-outline" size={14} color="#64748b" />
                <Text style={styles.dateText}>{dateLabel}</Text>
              </View>
            </View>
          </View>


          {/* Items */}
          <View style={{ marginTop: 10 }}>
            <Text style={styles.sectionLabel}>Items</Text>
            <Text style={styles.itemsText} numberOfLines={3}>
              {itemsLabel}
            </Text>
          </View>

          {/* Amount pills */}
          <View style={[styles.inlineWrap, { marginTop: 12 }]}>
            <View style={styles.pillTotal}>
              <Ionicons name="receipt-outline" size={14} color="#0f172a" />
              <Text style={styles.pillTextDark}>Total: ₹{totalAmount.toFixed(2)}</Text>
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
              <Text style={styles.pillTextPending}>Pending: ₹{pending.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Toast />
      </SafeAreaView>
    );
  }

  return (
    <>
      <LinearGradient colors={['#13545c', '#07363C']} style={{ flex: 1 }}>
        <FlatList
          data={orders}
          keyExtractor={(item, idx) => String(item?._id || item?.id || idx)}
          renderItem={({ item, index }) => <OrderCard order={item} index={index} />}
          ListHeaderComponent={<Header />}
          ListEmptyComponent={<EmptyState />}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#13545c', '#07363C']}
              tintColor="#13545c"
              progressBackgroundColor="#ffffff"
            />
          }
        />
      </LinearGradient>
      <Toast />
      </>
  );
}

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
  containerCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
  },
  card: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 24,
    marginBottom: 12,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  snoBadge: {
    backgroundColor: '#e2e8f0',
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snoText: { color: '#0f172a', fontWeight: '700', fontSize: 12 },
  customer: { color: '#0f172a', fontWeight: '700', fontSize: 16 },
  inline: { flexDirection: 'row', alignItems: 'center' },
  inlineWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  dateText: { color: '#64748b', fontSize: 12, marginLeft: 6 },
  sectionLabel: { color: '#334155', fontWeight: '700', fontSize: 12, marginBottom: 4 },
  itemsText: { color: '#0f172a', fontSize: 13, lineHeight: 18 },

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
});
