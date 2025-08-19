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
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import Toast from 'react-native-toast-message';
import axiosInstance from '../../src/utils/axios';

export default function Payment() {
    const [customers, setCustomers] = useState([]);
    const [isCustomerFocus, setIsCustomerFocus] = useState(false);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const [form, setForm] = useState({
        customerId: '',
        cash: '',
        online: '',
    });

    const inputClass =
        'bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 w-full text-base';

    // Function to validate and format numeric input
    const validateNumericInput = (value) => {
        // Remove any non-numeric characters except decimal point
        const numericValue = value.replace(/[^0-9.]/g, '');

        // Ensure only one decimal point
        const parts = numericValue.split('.');
        if (parts.length > 2) {
            return parts[0] + '.' + parts.slice(1).join('');
        }

        // Convert to number and check if it's negative
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

    const fetchCustomers = async (isRefreshing = false) => {
        setForm({ ...form, customerId: '' })
        setSelectedCustomer('')
        const token = await AsyncStorage.getItem('userToken');

        // Don't show loading indicator if it's a refresh
        if (!isRefreshing) {
            setIsLoadingCustomers(true);
        }

        try {
            const res = await axiosInstance.get("/customers?view=true&resultsPerPage=1000", {
                headers: { Authorization: token }
            });
            setCustomers(res?.data?.data?.items || []);

        } catch (error) {
            Toast.show({
                type: "error",
                text1: isRefreshing ? "Failed to refresh customers" : "Failed to fetch customers"
            });
        } finally {
            if (!isRefreshing) {
                setIsLoadingCustomers(false);
            }
        }
    };

    // Handle refresh
    const onRefresh = async () => {
        Keyboard.dismiss();

        setRefreshing(true);

        try {
            // Add a minimum delay to ensure the spinner is visible
            await Promise.all([
                fetchCustomers(true),
                new Promise(resolve => setTimeout(resolve, 500)) // Minimum 500ms delay
            ]);
        } catch (error) {
            console.log('Refresh error:', error);
        } finally {
            setRefreshing(false);
        }
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
            const res = await axiosInstance.post('/payment', payload, {
                headers: { Authorization: token },
            });

            Toast.show({
                type: 'success',
                text1: 'Payment Added Successfully',
            });

            fetchCustomers()
            router.push({
                pathname: "/Home/Reciept",
                params: {
                    source: 'payment',
                    paymentId: res.data._id || res.data.data?._id || 'N/A',
                    date: new Date().toISOString(),
                    customername: customers.find(c => c._id === form.customerId)?.name || 'Unknown',
                    pendingAmount: res.data.data || 0,
                    payment: JSON.stringify({
                        cash: cashAmount,
                        online: onlineAmount,
                    }),
                }
            });

            // Reset form
            setForm({
                customerId: '',
                cash: '',
                online: '',
            });
            setSelectedCustomer(null);

        } catch (error) {
            const errMsg =
                error?.response?.data?.errors?.[0]?.message ||
                error?.response?.data?.message ||
                error.message ||
                'Something went wrong';
            Toast.show({
                type: "error",
                text1: "No Pending Amount Available"
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

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#13545c', '#07363C']}
                        tintColor="#13545c"
                        progressBackgroundColor="#ffffff"
                        size="default"
                    />
                }
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                bounces={true}
                alwaysBounceVertical={true}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <LinearGradient
                        colors={["#13545c", "#07363C"]}
                        style={{ minHeight: '100%' }}
                    >
                        <View className="px-6 pt-14 pb-6">
                            <Text className="text-white font-bold text-xl text-center mb-6">
                                Add Payment
                            </Text>

                            <KeyboardAvoidingView
                                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                                style={{ flex: 1 }}
                            >
                                <View className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 mt-10 flex-1">
                                    <View className="space-y-6">

                                        {/* Customer Dropdown */}
                                        <View>
                                            <Text className="text-gray-700 font-semibold mb-2">
                                                Select Customer
                                            </Text>
                                            <Dropdown
                                                style={[
                                                    styles.dropdown,
                                                    isCustomerFocus && { borderColor: '#2563eb', borderWidth: 2 },
                                                    isLoadingCustomers && styles.dropdownLoading
                                                ]}
                                                placeholderStyle={styles.placeholderStyle}
                                                selectedTextStyle={styles.selectedTextStyle}
                                                inputSearchStyle={styles.inputSearchStyle}
                                                iconStyle={styles.iconStyle}
                                                data={isLoadingCustomers ? [] : customers}
                                                search
                                                maxHeight={300}
                                                labelField="name"
                                                valueField="_id"
                                                placeholder={
                                                    isLoadingCustomers
                                                        ? 'Loading customers...'
                                                        : (!isCustomerFocus ? 'Select Customer' : '')
                                                }
                                                searchPlaceholder="Search customer..."
                                                value={form.customerId}
                                                onFocus={() => !isLoadingCustomers && setIsCustomerFocus(true)}
                                                onBlur={() => setIsCustomerFocus(false)}
                                                disable={isLoadingCustomers}
                                                onChange={(item) => {
                                                    handleChange('customerId', item._id);
                                                    setSelectedCustomer(item);
                                                    setIsCustomerFocus(false);
                                                }}
                                                renderItem={(item) => (
                                                    <View style={{ padding: 12 }}>
                                                        <Text className="text-gray-800 font-medium">
                                                            {item?.name || 'Unknown Customer'}
                                                        </Text>
                                                        {item?.totalPendingAmount ? (
                                                            <Text className="text-gray-500 text-sm">
                                                                {`Pending: ₹${item.totalPendingAmount}`}
                                                            </Text>
                                                        ) : null}
                                                    </View>
                                                )}
                                            />
                                        </View>

                                        {/* Pending Amount Display - Show only when customer is selected */}
                                        {selectedCustomer && (
                                            <View>
                                                <Text className="text-gray-700 font-semibold mb-2">
                                                    Pending Amount
                                                </Text>
                                                <TextInput
                                                    className="bg-gray-200 border border-gray-300 rounded-xl px-4 py-3 w-full text-base"
                                                    value={`₹${selectedCustomer?.totalPendingAmount || 0}`}
                                                    editable={false}
                                                />
                                            </View>
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
                                                Total Payment
                                            </Text>
                                            <TextInput
                                                className="bg-gray-200 border border-gray-300 rounded-xl px-4 py-3 w-full text-base"
                                                value={`₹${(parseFloat(form.cash) || 0) + (parseFloat(form.online) || 0)}`}
                                                editable={false}
                                            />
                                        </View>

                                    </View>
                                </View>
                            </KeyboardAvoidingView>

                            {/* Submit Button */}
                            <View className="px-6 pb-6 pt-4">
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
                    </LinearGradient>
                </TouchableWithoutFeedback>
            </ScrollView>
            <Toast />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    dropdown: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        backgroundColor: 'white',
    },
    dropdownLoading: {
        opacity: 0.6,
        backgroundColor: '#f9f9f9',
    },
    placeholderStyle: {
        fontSize: 16,
        color: '#999',
    },
    selectedTextStyle: {
        fontSize: 16,
        color: '#111',
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 16,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 10,
    },
    iconStyle: {
        width: 20,
        height: 20,
    },
});
