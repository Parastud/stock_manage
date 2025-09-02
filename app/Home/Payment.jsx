import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import CustomDropdown from '../../src/Components/CustomDropdown';
import { useHealth } from '../../src/Providers/Health';
import axiosInstance from '../../src/utils/axios';

const getNestedValue = (obj, path) => {
    if (!obj || !path) return null;
    return path.split('.').reduce((current, key) => current?.[key], obj);
};

export default function Payment() {
    const [customers, setCustomers] = useState([]);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const { isConnected, checkConnection } = useHealth();

    const [form, setForm] = useState({
        customerId: '',
        cash: '',
        online: '',
    });

    const inputClass =
        'bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 w-full text-base';

    const validateNumericInput = (value) => {
        const numericValue = value.replace(/[^0-9.]/g, '');

        const parts = numericValue.split('.');
        if (parts.length > 2) {
            return parts[0] + '.' + parts.slice(1).join('');
        }

        const numberValue = parseFloat(numericValue);
        if (numberValue < 0 || numericValue.startsWith('-')) {
            return '';
        }

        return numericValue;
    };

    const handleChange = (key, value) => {
        if (key === 'cash' || key === 'online') {
            const validatedValue = validateNumericInput(value);
            setForm((prev) => ({
                ...prev,
                [key]: validatedValue,
            }));
        } else {
            setForm((prev) => ({
                ...prev,
                [key]: value,
            }));
        }
    };

    const getCustomerStatus = (customer) => {
        const amount = customer.totalPendingAmount || 0;
        if (amount > 0) {
            return { status: 'Pending', color: '#ef4444', bgColor: '#fef2f2' };
        } else if (amount < 0) {
            return { status: 'Credit', color: '#059669', bgColor: '#f0fdf4' };
        } else {
            return { status: 'Clear', color: '#6b7280', bgColor: '#f9fafb' };
        }
    };

    const fetchCustomers = async (isRefreshing = false) => {
        setForm({ ...form, customerId: '' });
        setSelectedCustomer(null);
        const token = await AsyncStorage.getItem('userToken');

        if (!isRefreshing) {
            setIsLoadingCustomers(true);
        }

        try {
            const res = await axiosInstance.get("/customers?view=true&resultsPerPage=1000", {
                headers: { Authorization: token }
            });
            const customersData = res?.data?.data?.items || [];

            const sortedCustomers = customersData.sort((a, b) => {
                const aAmount = a.totalPendingAmount || 0;
                const bAmount = b.totalPendingAmount || 0;

                if (aAmount > 0 && bAmount <= 0) return -1;
                if (bAmount > 0 && aAmount <= 0) return 1;

                if (aAmount < 0 && bAmount >= 0) return -1;
                if (bAmount < 0 && aAmount >= 0) return 1;

                if (aAmount > 0 && bAmount > 0) return bAmount - aAmount;
                if (aAmount < 0 && bAmount < 0) return aAmount - bAmount;

                return a.name.localeCompare(b.name);
            });

            setCustomers(sortedCustomers);

            const pendingCount = sortedCustomers.filter(c => c.totalPendingAmount > 0).length;
            const creditCount = sortedCustomers.filter(c => c.totalPendingAmount < 0).length;
            const clearCount = sortedCustomers.filter(c => (c.totalPendingAmount || 0) === 0).length;


        } catch (error) {
            const savedCustomers = await AsyncStorage.getItem('savedcustomers');
            if (savedCustomers) {
                const parsedCustomers = JSON.parse(savedCustomers);
                const sortedCustomers = parsedCustomers.sort((a, b) => {
                    const aAmount = a.totalPendingAmount || 0;
                    const bAmount = b.totalPendingAmount || 0;

                    if (aAmount > 0 && bAmount <= 0) return -1;
                    if (bAmount > 0 && aAmount <= 0) return 1;
                    if (aAmount < 0 && bAmount >= 0) return -1;
                    if (bAmount < 0 && aAmount >= 0) return 1;

                    return a.name.localeCompare(b.name);
                });
                setCustomers(sortedCustomers);
            }

            Toast.show({
                type: "error",
                text1: isRefreshing ? "Failed to refresh customers" : "Using saved data"
            });
        } finally {
            if (!isRefreshing) {
                setIsLoadingCustomers(false);
            }
        }
    };

    const onRefresh = async () => {
        Keyboard.dismiss();
        setRefreshing(true);

        try {
            await Promise.all([
                fetchCustomers(true),
                new Promise(resolve => setTimeout(resolve, 500))
            ]);
        } catch (error) {
        } finally {
            setRefreshing(false);
        }
    };

    const handleCustomerSelect = (customer) => {
        handleChange('customerId', customer._id);
        setSelectedCustomer(customer);

        const { status } = getCustomerStatus(customer);
        const amount = Math.abs(customer.totalPendingAmount || 0);
    };

    const handleSubmit = async () => {
        if (!form.customerId) {
            Toast.show({
                type: "error",
                text1: 'Please select a customer'
            });
            return;
        }

        const cashAmount = parseFloat(form.cash) || 0;
        const onlineAmount = parseFloat(form.online) || 0;

        if (cashAmount <= 0 && onlineAmount <= 0) {
            Toast.show({
                type: "error",
                text1: 'Please enter a valid payment amount'
            });
            return;
        }

        if (cashAmount < 0 || onlineAmount < 0) {
            Toast.show({
                type: "error",
                text1: 'Payment amounts cannot be negative'
            });
            return;
        }

        const totalPayment = cashAmount + onlineAmount;

        setIsSubmitting(true);
        const token = await AsyncStorage.getItem('userToken');

        if (!token) {
            Toast.show({
                type: "error",
                text1: 'User token missing'
            });
            setIsSubmitting(false);
            return;
        }

        const payload = {
            customerId: form.customerId,
            cash: cashAmount,
            online: onlineAmount,
        };

        try {
            if (await checkConnection()) {
                const res = await axiosInstance.post('/payment', payload, {
                    headers: { Authorization: token },
                });

                Toast.show({
                    type: 'success',
                    text1: 'Payment Added Successfully',
                    text2: `Amount: ₹${totalPayment.toFixed(2)}`
                });

                fetchCustomers();
                router.push({
                    pathname: "/Home/Receipt",
                    params: {
                        source: 'payment',
                        paymentId: res.data._id || res.data.data?._id || 'N/A',
                        date: new Date().toISOString(),
                        customername: selectedCustomer?.name || 'Unknown',
                        pendingAmount: res.data.data || 0,
                        payment: JSON.stringify({
                            cash: cashAmount,
                            online: onlineAmount,
                            total: totalPayment
                        }),
                        totalAmount: totalPayment,
                        previousBalance: selectedCustomer?.totalPendingAmount || 0
                    }
                });
                setForm({
                    customerId: '',
                    cash: '',
                    online: '',
                });
                setSelectedCustomer(null);
            } else {
                const oldData = await AsyncStorage.getItem("missedpayments");
                let data = [];
                if (oldData) {
                    data = JSON.parse(oldData);
                }
                data.push(payload);
                await AsyncStorage.setItem("missedpayments", JSON.stringify(data));
                Toast.show({
                    type: 'info',
                    text1: 'Payments are being added offline',
                });
                fetchCustomers();

                const newPendingAmount = getNewBalance();

                router.push({
                    pathname: "/Home/Receipt",
                    params: {
                        source: 'payment',
                        paymentId: 'Offline Mode',
                        date: new Date().toISOString(),
                        customername: selectedCustomer?.name || 'Unknown',
                        pendingAmount: newPendingAmount, // Use calculated value instead of res.data.data
                        payment: JSON.stringify({
                            cash: cashAmount,
                            online: onlineAmount,
                            total: totalPayment
                        }),
                        totalAmount: totalPayment,
                        previousBalance: selectedCustomer?.totalPendingAmount || 0
                    }
                });
                setForm({
                    customerId: '',
                    cash: '',
                    online: '',
                });
                setSelectedCustomer(null);
            }

        } catch (error) {
            const errMsg =
                error?.response?.data?.errors?.[0]?.message ||
                error?.response?.data?.message ||
                error.message ||
                'Something went wrong';
            Toast.show({
                type: "error",
                text1: "Payment Failed",
                text2: errMsg
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const isFormValid = () => {
        const cashAmount = parseFloat(form.cash) || 0;
        const onlineAmount = parseFloat(form.online) || 0;
        return form.customerId && (cashAmount > 0 || onlineAmount > 0);
    };

    const getTotalPayment = () => {
        return (parseFloat(form.cash) || 0) + (parseFloat(form.online) || 0);
    };

    const getNewBalance = () => {
        if (!selectedCustomer) return 0;
        const currentBalance = selectedCustomer.totalPendingAmount || 0;
        const totalPayment = getTotalPayment();
        return currentBalance - totalPayment;
    };

    const getBalanceDisplay = () => {
        const newBalance = getNewBalance();
        if (newBalance > 0) {
            return { text: `₹${newBalance.toFixed(2)} Pending`, color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' };
        } else if (newBalance < 0) {
            return { text: `₹${Math.abs(newBalance).toFixed(2)} Credit`, color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' };
        } else {
            return { text: '₹0.00 Clear', color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-200' };
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <LinearGradient
                    colors={["#13545c", "#07363C"]}
                    style={{ flex: 1 }}
                >
                    <View className="px-6 pt-14 pb-6 flex-1">
                        <Text className="text-white font-bold text-xl text-center mb-6">
                            Add Payment
                        </Text>

                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={{ flex: 1 }}
                        >
                            <View className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 flex-1">
                                <View className="space-y-6">

                                    {/* Customer Dropdown */}
                                    <View>
                                        <Text className="text-gray-700 font-semibold mb-2">
                                            Select Customer
                                        </Text>
                                        <CustomDropdown
                                            data={customers}
                                            labelField="name"
                                            valueField="_id"
                                            placeholder={
                                                isLoadingCustomers
                                                    ? 'Loading customers...'
                                                    : customers.length === 0
                                                        ? 'No customers found'
                                                        : 'Select Customer'
                                            }
                                            searchPlaceholder="Search customer..."
                                            value={form.customerId}
                                            disabled={isLoadingCustomers}
                                            loading={isLoadingCustomers}
                                            onSelect={handleCustomerSelect}
                                            noDataText="No customers available"
                                            style={{
                                                borderColor: '#d1d5db',
                                                borderWidth: 1,
                                                borderRadius: 12,
                                                backgroundColor: '#ffffff'
                                            }}
                                            renderItem={(item) => {
                                                const { status, color, bgColor } = getCustomerStatus(item);
                                                const amount = Math.abs(item.totalPendingAmount || 0);

                                                return (
                                                    <View style={{
                                                        padding: 15,
                                                        borderBottomWidth: 1,
                                                        borderBottomColor: '#f3f4f6',
                                                        backgroundColor: item.totalPendingAmount > 0 ? '#fef2f2' :
                                                            item.totalPendingAmount < 0 ? '#f0fdf4' : '#f9fafb'
                                                    }}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <View style={{ flex: 1 }}>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                    <Text style={{
                                                                        fontSize: 20,
                                                                        marginRight: 8,
                                                                        color: item.totalPendingAmount > 0 ? '#ef4444' :
                                                                            item.totalPendingAmount < 0 ? '#059669' : '#6b7280'
                                                                    }}>
                                                                        {item.totalPendingAmount > 0 ? '🔴' :
                                                                            item.totalPendingAmount < 0 ? '🟢' : '⚪'}
                                                                    </Text>
                                                                    <Text style={{ fontSize: 16, fontWeight: '500', color: '#1f2937' }}>
                                                                        {item?.name || 'Unknown Customer'}
                                                                    </Text>
                                                                </View>

                                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                                                    <Text style={{
                                                                        fontSize: 12,
                                                                        color: color,
                                                                        fontWeight: '600',
                                                                        paddingHorizontal: 8,
                                                                        paddingVertical: 2,
                                                                        backgroundColor: bgColor,
                                                                        borderRadius: 4,
                                                                        marginRight: 8
                                                                    }}>
                                                                        {status}
                                                                    </Text>
                                                                    {amount > 0 && (
                                                                        <Text style={{
                                                                            fontSize: 14,
                                                                            color: color,
                                                                            fontWeight: '600'
                                                                        }}>
                                                                            ₹{amount.toFixed(2)}
                                                                        </Text>
                                                                    )}
                                                                </View>

                                                                <Text style={{
                                                                    fontSize: 10,
                                                                    color: '#9ca3af',
                                                                    marginTop: 2
                                                                }}>
                                                                    ID: {item?._id?.slice(-8) || 'N/A'}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                );
                                            }}
                                        />
                                    </View>

                                    {/* Current Balance Display - Show only when customer is selected */}
                                    {selectedCustomer && (
                                        <>
                                            <View>
                                                <Text className="text-gray-700 font-semibold mb-2">
                                                    Current Balance
                                                </Text>
                                                {(() => {
                                                    const { status, color } = getCustomerStatus(selectedCustomer);
                                                    const amount = Math.abs(selectedCustomer.totalPendingAmount || 0);
                                                    const bgClass = selectedCustomer.totalPendingAmount > 0 ? 'bg-red-50 border-red-200' :
                                                        selectedCustomer.totalPendingAmount < 0 ? 'bg-green-50 border-green-200' :
                                                            'bg-gray-50 border-gray-200';
                                                    const textClass = selectedCustomer.totalPendingAmount > 0 ? 'text-red-700' :
                                                        selectedCustomer.totalPendingAmount < 0 ? 'text-green-700' :
                                                            'text-gray-700';

                                                    return (
                                                        <TextInput
                                                            className={`${bgClass} border rounded-xl px-4 py-3 w-full text-base font-semibold ${textClass}`}
                                                            value={amount > 0 ? `₹${amount.toFixed(2)} ${status}` : 'Clear Balance'}
                                                            editable={false}
                                                        />
                                                    );
                                                })()}
                                            </View>

                                            {/* New Balance After Payment */}
                                            {getTotalPayment() > 0 && (
                                                <View>
                                                    <Text className="text-gray-700 font-semibold mb-2">
                                                        New Balance After Payment
                                                    </Text>
                                                    {(() => {
                                                        const { text, color, bgColor } = getBalanceDisplay();
                                                        return (
                                                            <TextInput
                                                                className={`${bgColor} border rounded-xl px-4 py-3 w-full text-base font-semibold ${color}`}
                                                                value={text}
                                                                editable={false}
                                                            />
                                                        );
                                                    })()}
                                                </View>
                                            )}
                                        </>
                                    )}

                                    {/* Cash Payment */}
                                    <View>
                                        <Text className="text-gray-700 font-semibold mb-2">
                                            Cash Payment (₹)
                                        </Text>
                                        <TextInput
                                            className={inputClass}
                                            value={form.cash}
                                            keyboardType="decimal-pad"
                                            onChangeText={(val) => handleChange('cash', val)}
                                            placeholder="Enter cash amount"
                                            editable={!isSubmitting}
                                            maxLength={10}
                                        />
                                    </View>

                                    {/* Online Payment */}
                                    <View>
                                        <Text className="text-gray-700 font-semibold mb-2">
                                            Online Payment (₹)
                                        </Text>
                                        <TextInput
                                            className={inputClass}
                                            value={form.online}
                                            keyboardType="decimal-pad"
                                            onChangeText={(val) => handleChange('online', val)}
                                            placeholder="Enter online amount"
                                            editable={!isSubmitting}
                                            maxLength={10}
                                        />
                                    </View>

                                    {/* Total Payment Display */}
                                    <View>
                                        <Text className="text-gray-700 font-semibold mb-2">
                                            Total Payment Amount
                                        </Text>
                                        <TextInput
                                            className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 w-full text-base font-bold text-blue-700"
                                            value={`₹${getTotalPayment().toFixed(2)}`}
                                            editable={false}
                                        />
                                    </View>

                                </View>

                                {/* Submit Button - Now inside the white container */}
                                <View className="mt-6">
                                    <TouchableOpacity
                                        onPress={handleSubmit}
                                        disabled={!isFormValid() || isSubmitting}
                                        className={`flex-row items-center justify-center ${isFormValid() && !isSubmitting ? 'bg-green-600' : 'bg-gray-400'
                                            } px-6 py-4 rounded-xl shadow-lg`}
                                    >
                                        {isSubmitting && (
                                            <ActivityIndicator
                                                size="small"
                                                color="white"
                                                style={{ marginRight: 8 }}
                                            />
                                        )}
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={20}
                                            color="white"
                                            style={{ marginRight: 8 }}
                                        />
                                        <Text className="text-white font-bold text-lg">
                                            {isSubmitting ? 'Processing...' : 'Add Payment'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </LinearGradient>
            </TouchableWithoutFeedback>
            <Toast />
        </SafeAreaView>
    );
}

