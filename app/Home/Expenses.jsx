import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Toast from 'react-native-toast-message';
import axiosInstance from '../../src/Components/utils/axios';

export default function Expense() {
    const [isPaymentTypeFocus, setIsPaymentTypeFocus] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const [form, setForm] = useState({
        name: '',
        amount: '',
        date: new Date().toISOString().split('T')[0], // Default to today
        paymentType: 'cash',
        cash: '',
        online: '',
    });

    const paymentTypes = [
        { label: 'Cash Only', value: 'cash' },
        { label: 'Online Only', value: 'online' },
        { label: 'Mixed (Cash + Online)', value: 'mixed' },
    ];

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
        if (key === 'cash' || key === 'online' || key === 'amount') {
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

    // Calculate total amount when cash or online changes
    const handleCashChange = (value) => {
        const validatedValue = validateNumericInput(value);
        const totalAmount = parseFloat(validatedValue || 0) + parseFloat(form.online || 0);
        setForm(prev => ({
            ...prev,
            cash: validatedValue,
            amount: totalAmount.toString(),
        }));
    };

    const handleOnlineChange = (value) => {
        const validatedValue = validateNumericInput(value);
        const totalAmount = parseFloat(form.cash || 0) + parseFloat(validatedValue || 0);
        setForm(prev => ({
            ...prev,
            online: validatedValue,
            amount: totalAmount.toString(),
        }));
    };

    // Handle payment type change
    const handlePaymentTypeChange = (type) => {
        let newForm = { ...form, paymentType: type };

        if (type === 'cash') {
            newForm.cash = form.amount;
            newForm.online = '';
        } else if (type === 'online') {
            newForm.online = form.amount;
            newForm.cash = '';
        } else {
            // For mixed type, clear both to allow manual entry
            newForm.cash = '';
            newForm.online = '';
            newForm.amount = '';
        }

        setForm(newForm);
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            Toast.show({
                type: "error",
                text1: 'Please enter expense name'
            });
            return;
        }

        if (!form.date) {
            Toast.show({
                type: "error",
                text1: 'Please select a date'
            });
            return;
        }

        const cashAmount = parseFloat(form.cash) || 0;
        const onlineAmount = parseFloat(form.online) || 0;
        const totalAmount = parseFloat(form.amount) || 0;

        if (totalAmount <= 0) {
            Toast.show({
                type: "error",
                text1: 'Please enter a valid expense amount'
            });
            return;
        }

        if (form.paymentType === 'cash' && cashAmount <= 0) {
            Toast.show({
                type: "error",
                text1: 'Please enter cash amount'
            });
            return;
        }

        if (form.paymentType === 'online' && onlineAmount <= 0) {
            Toast.show({
                type: "error",
                text1: 'Please enter online amount'
            });
            return;
        }

        if (form.paymentType === 'mixed' && (cashAmount <= 0 || onlineAmount <= 0)) {
            Toast.show({
                type: "error",
                text1: 'Please enter both cash and online amounts'
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
            name: form.name.trim(),
            amount: totalAmount,
            date: form.date,
            paymentType: form.paymentType,
            cash: cashAmount,
            online: onlineAmount,
        };

        try {
            const res = await axiosInstance.post('/expense', payload, {
                headers: { Authorization: token },
            });

            Toast.show({
                type: 'success',
                text1: 'Expense Added Successfully',
            });

            // Reset form
            setForm({
                name: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                paymentType: 'cash',
                cash: '',
                online: '',
            });

        } catch (error) {
            const errMsg =
                error?.response?.data?.errors?.[0]?.message ||
                error?.response?.data?.message ||
                error.message ||
                'Something went wrong';
            Toast.show({
                type: "error",
                text1: errMsg
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid = () => {
        const totalAmount = parseFloat(form.amount) || 0;
        const cashAmount = parseFloat(form.cash) || 0;
        const onlineAmount = parseFloat(form.online) || 0;

        if (!form.name.trim() || !form.date || totalAmount <= 0) {
            return false;
        }

        if (form.paymentType === 'cash' && cashAmount <= 0) {
            return false;
        }

        if (form.paymentType === 'online' && onlineAmount <= 0) {
            return false;
        }

        if (form.paymentType === 'mixed' && (cashAmount <= 0 || onlineAmount <= 0)) {
            return false;
        }

        return true;
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
                <KeyboardAwareScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    enableOnAndroid
                    keyboardShouldPersistTaps="handled"
                    extraScrollHeight={Platform.OS === 'ios' ? 20 : 0}
                    className='bg-[#07363C]'
                >
                <ScrollView
                    className="flex-1"
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
                                    Add Expense
                                </Text>

                                <View className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 mt-10 flex-1">
                                    <View className="space-y-6">

                                        {/* Expense Name */}
                                        <View>
                                            <Text className="text-gray-700 font-semibold mb-2">
                                                Expense Name
                                            </Text>
                                            <TextInput
                                                className={inputClass}
                                                value={form.name}
                                                onChangeText={(val) => handleChange('name', val)}
                                                placeholder="Enter expense name"
                                                editable={!isSubmitting}
                                                maxLength={100}
                                            />
                                        </View>

                                        {/* Date */}
                                        <View>
                                            <Text className="text-gray-700 font-semibold mb-2">
                                                Date
                                            </Text>
                                            <TextInput
                                                className={inputClass}
                                                value={form.date}
                                                onChangeText={(val) => handleChange('date', val)}
                                                placeholder="YYYY-MM-DD"
                                                editable={!isSubmitting}
                                            />
                                        </View>

                                        {/* Payment Type Dropdown */}
                                        <View>
                                            <Text className="text-gray-700 font-semibold mb-2">
                                                Payment Type
                                            </Text>
                                            <Dropdown
                                                style={[
                                                    styles.dropdown,
                                                    isPaymentTypeFocus && { borderColor: '#2563eb', borderWidth: 2 }
                                                ]}
                                                placeholderStyle={styles.placeholderStyle}
                                                selectedTextStyle={styles.selectedTextStyle}
                                                iconStyle={styles.iconStyle}
                                                data={paymentTypes}
                                                maxHeight={300}
                                                labelField="label"
                                                valueField="value"
                                                placeholder={!isPaymentTypeFocus ? 'Select Payment Type' : ''}
                                                value={form.paymentType}
                                                onFocus={() => setIsPaymentTypeFocus(true)}
                                                onBlur={() => setIsPaymentTypeFocus(false)}
                                                disable={isSubmitting}
                                                onChange={(item) => {
                                                    handlePaymentTypeChange(item.value);
                                                    setIsPaymentTypeFocus(false);
                                                }}
                                            />
                                        </View>

                                        {/* Cash Payment - Show for cash and mixed */}
                                        {(form.paymentType === 'cash' || form.paymentType === 'mixed') && (
                                            <View>
                                                <Text className="text-gray-700 font-semibold mb-2">
                                                    Cash Amount (₹)
                                                </Text>
                                                <TextInput
                                                    className={inputClass}
                                                    value={form.cash}
                                                    keyboardType="decimal-pad"
                                                    onChangeText={form.paymentType === 'mixed' ? handleCashChange : (val) => {
                                                        const validatedValue = validateNumericInput(val);
                                                        setForm(prev => ({
                                                            ...prev,
                                                            cash: validatedValue,
                                                            amount: validatedValue
                                                        }));
                                                    }}
                                                    placeholder="Enter cash amount"
                                                    editable={!isSubmitting}
                                                    maxLength={10}
                                                />
                                            </View>
                                        )}

                                        {/* Online Payment - Show for online and mixed */}
                                        {(form.paymentType === 'online' || form.paymentType === 'mixed') && (
                                            <View>
                                                <Text className="text-gray-700 font-semibold mb-2">
                                                    Online Amount (₹)
                                                </Text>
                                                <TextInput
                                                    className={inputClass}
                                                    value={form.online}
                                                    keyboardType="decimal-pad"
                                                    onChangeText={form.paymentType === 'mixed' ? handleOnlineChange : (val) => {
                                                        const validatedValue = validateNumericInput(val);
                                                        setForm(prev => ({
                                                            ...prev,
                                                            online: validatedValue,
                                                            amount: validatedValue
                                                        }));
                                                    }}
                                                    placeholder="Enter online amount"
                                                    editable={!isSubmitting}
                                                    maxLength={10}
                                                />
                                            </View>
                                        )}

                                        {/* Total Amount Display */}
                                        <View>
                                            <Text className="text-gray-700 font-semibold mb-2">
                                                Total Amount
                                            </Text>
                                            <TextInput
                                                className="bg-gray-200 border border-gray-300 rounded-xl px-4 py-3 w-full text-base"
                                                value={`₹${form.amount || '0'}`}
                                                editable={false}
                                            />
                                        </View>

                                    </View>
                                </View>

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
                                            name="add-circle"
                                            size={20}
                                            color="white"
                                            style={{ marginRight: 8 }}
                                        />
                                        <Text className="text-white font-bold text-lg">
                                            {isSubmitting ? 'Adding...' : 'Add Expense'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </LinearGradient>
                    </TouchableWithoutFeedback>
                </ScrollView>
                <Toast />
        </KeyboardAwareScrollView>
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
    placeholderStyle: {
        fontSize: 16,
        color: '#999',
    },
    selectedTextStyle: {
        fontSize: 16,
        color: '#111',
    },
    iconStyle: {
        width: 20,
        height: 20,
    },
});
