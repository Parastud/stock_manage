  import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Modal,
  RefreshControl,
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
import Animated, {
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import axiosInstance from '../../src/Components/utils/axios';

  const totalSteps = 2;

  export default function Index() {
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState('next');
    const [customers, setCustomers] = useState([]);
    const [items, setItems] = useState([]);
    const [isCustomerFocus, setIsCustomerFocus] = useState(false);
    const [isItemFocus, setIsItemFocus] = useState(false);
    const [pending, setPending] = useState();
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const router = useRouter();
    const [CustomerMapping, setCustomerMapping] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    // Loading states
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
    const [isLoadingItems, setIsLoadingItems] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
      customerId: '',
      itemId: '',
      quantity: '',
      onlinePayment: '',
      cashPayment: '',
      defaultQuantityType: '',
      boxes: ''
    });

    // Function to validate and format numeric input
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

    function roundUpTo50(num) {
      return Math.ceil(num / 50) * 50;
    }

    const handleSubmit = async () => {
      const cashAmount = parseFloat(form.cashPayment) || 0;
      const onlineAmount = parseFloat(form.onlinePayment) || 0;

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

      if (!form.customerId || cart.length === 0) {
        Toast.show({
          type: "error",
          text1: 'Missing customer or cart information',
        });
        setIsSubmitting(false);
        return;
      }

      const payload = {
        customerId: form.customerId,
        items: cart.map(({ itemId, quantity, amount }) => ({
          itemId,
          quantity,
          amount,
        })),
        totalAmount: cart.reduce((sum, item) => sum + item.amount, 0),
        payment: {
          cash: cashAmount,
          online: onlineAmount,
        },
        date: new Date(),
      };

      try {
        const res = await axiosInstance.post('/order', payload, {
          headers: { Authorization: token },
        });
        Toast.show({
          type: 'success',
          text1: 'Order Added Successfully',
        });
        resetForm();
        fetchData();
        const responseData = res.data.data;
        router.push({
          pathname: "/Home/Reciept",
          params: {
            ...responseData,
            cart: JSON.stringify(cart),
            items: JSON.stringify(responseData.items),
            payment: JSON.stringify(responseData.payment),
            customername: customers.find(i => form.customerId == i._id)?.name
          }
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

    const resetForm = () => {
      setForm({
        customerId: '',
        itemId: '',
        quantity: '',
        onlinePayment: '',
        cashPayment: '',
        defaultQuantityType: '',
        boxes: '',
      });
      setCart([]);
      setStep(1);
      setItems([]);
      setIsLoadingItems(false);
    };

    const inputClass =
      'bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 w-full text-base';

    const handleChange = (key, value, resetId = false) => {
      if (key === 'onlinePayment' || key === 'cashPayment') {
        const validatedValue = validateNumericInput(value);
        setForm((prev) => ({
          ...prev,
          [key]: validatedValue,
        }));
      } else if (key === 'quantity' || key === 'boxes') {
        const validatedValue = validateNumericInput(value);
        setForm((prev) => ({
          ...prev,
          [key]: validatedValue,
          ...(resetId && key === 'customerId' ? { customerId: '' } : {}),
          ...(resetId && key === 'itemName' ? { itemId: '' } : {}),
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          [key]: value,
          ...(resetId && key === 'customerId' ? { customerId: '' } : {}),
          ...(resetId && key === 'itemName' ? { itemId: '' } : {}),
        }));
      }
    };

    const handleStepChange = (newStep) => {
      setDirection(newStep > step ? 'next' : 'back');
      setStep(newStep);
    };

    const fetchData = async (isRefreshing = false) => {
      handleChange('customerId', '')
      handleChange('itemId', '')
      setStep(1)
      setCart([])
      const token = await AsyncStorage.getItem('userToken');

      // Don't show loading indicator if it's a refresh
      if (!isRefreshing) {
        setIsLoadingCustomers(true);
      }

      try {
        const [res1, res2] = await Promise.all([
          axiosInstance.get("/customers?view=true&resultsPerPage=1000", {
            headers: { Authorization: token }
          }),
          axiosInstance.get("/customerItemMappings?view=true&resultsPerPage=1000", {
            headers: { Authorization: token }
          })
        ]);

        setCustomers(res1?.data?.data?.items);
        setCustomerMapping(res2?.data?.data?.items);



      } catch (error) {
        Toast.show({
          type: "error",
          text1: isRefreshing ? "Failed to refresh data" : "Issue Occurred"
        });
      } finally {
        if (!isRefreshing) {
          setIsLoadingCustomers(false);
        }
      }
    };

    // Improved refresh handler
    const onRefresh = async () => {
      // Dismiss keyboard first
      Keyboard.dismiss();

      setRefreshing(true);

      try {
        // Add a minimum delay to ensure the spinner is visible
        const [dataResult] = await Promise.all([
          fetchData(true),
          new Promise(resolve => setTimeout(resolve, 500)) // Minimum 500ms delay
        ]);
      } catch (error) {
        console.log('Refresh error:', error);
      } finally {
        setRefreshing(false);
      }
    };

    useEffect(() => {
      fetchData();
    }, []);

    const addItemToCart = () => {
      if (!form.itemId || !form.quantity) {
        Toast.show({
          type: "error",
          text1: 'Missing item details'
        });
        return;
      }

      const quantityValue = parseFloat(form.quantity);
      if (quantityValue <= 0) {
        Toast.show({
          type: "error",
          text1: 'Quantity must be greater than 0'
        });
        return;
      }

      const isDuplicate = cart.some((i) => i._id == form.itemId);
      if (isDuplicate) {
        Toast.show({
          type: "error",
          text1: 'Item already added'
        });
        return;
      }

      const item = items.find((i) => i._id === form.itemId);
      const singleitem = item.price / item.quantity;
      const amount = item?.itemId.shouldRoundOff ? roundUpTo50(Number(form.quantity * singleitem)) : (Number(form.quantity * singleitem))
      const newItem = {
        itemId: item.itemId,
        itemName: item?.itemId.name || '',
        quantity: Math.floor(Number(form.quantity)),
        amount: amount,
        _id: item._id
      };

      setCart((prev) => [...prev, newItem]);
      setForm((prev) => ({
        ...prev,
        itemName: '',
        itemId: '',
        quantity: '',
        boxes: '',
        defaultQuantityType: '',
        price: ''
      }));
      Toast.show({
        type: 'success',
        text1: 'Item added to cart',
      });
    };

    const deleteCartItem = (index) => {
      cart.length === 1 ? (setShowCart(false), handleStepChange(1)) : null;
      setCart((prev) => prev.filter((_, i) => i !== index));
    };

    const isStepValid = () => {
      if (step === 1) {
        return form.customerId.trim() !== '' && cart.length > 0;
      }
      if (step === 2) {
        const cashAmount = parseFloat(form.cashPayment) || 0;
        const onlineAmount = parseFloat(form.onlinePayment) || 0;
        return (cashAmount >= 0 && onlineAmount >= 0);
      }
      return false;
    };

    const renderStep = () => {
      if (step === 1) {
        return (
          <View className="space-y-4">
            <Text className="text-gray-700 font-semibold">Select Customer</Text>

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
              placeholder={isLoadingCustomers ? 'Loading customers...' : (!isCustomerFocus ? 'Select Customer' : '')}
              searchPlaceholder="Search customer..."
              value={form.customerId}
              onFocus={() => !isLoadingCustomers && setIsCustomerFocus(true)}
              onBlur={() => setIsCustomerFocus(false)}
              disable={isLoadingCustomers}
              onChange={(item) => {
                setForm((prev) => ({
                  ...prev,
                  customerId: item._id,
                  defaultQuantityType: '',
                  boxes: '',
                  quantity: '',
                  itemId: ''
                }));
                setCart([])
                setPending(item.totalPendingAmount);
                setIsCustomerFocus(false);
                setIsLoadingItems(true);

                setTimeout(() => {
                  setItems(
                    CustomerMapping.filter((x) => x.customerId?._id === item._id)
                  );
                  setIsLoadingItems(false);
                }, 300);
              }}
              renderItem={(item) => (
                <View style={{ padding: 10 }}>
                  <Text>{item.name}</Text>
                </View>
              )}
            />

            <Text className="text-gray-700 font-semibold">Select Mapping</Text>

            <Dropdown
              style={[
                styles.dropdown,
                isItemFocus && { borderColor: '#2563eb', borderWidth: 2 },
                (!form.customerId || isLoadingItems) && styles.dropdownLoading
              ]}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              iconStyle={styles.iconStyle}
              data={isLoadingItems ? [] : items}
              search
              maxHeight={300}
              labelField="itemId.name"
              valueField="_id"
              placeholder={
                !form.customerId
                  ? 'Select customer first'
                  : isLoadingItems
                    ? 'Loading items...'
                    : (!isItemFocus ? 'Select Item' : '...')
              }
              searchPlaceholder="Search item..."
              onFocus={() => !isLoadingItems && form.customerId && setIsItemFocus(true)}
              onBlur={() => setIsItemFocus(false)}
              disable={!form.customerId || isLoadingItems}
              onChange={(selectedItem) => {
                const itemData = items.find(item => item._id === selectedItem._id);
                setForm((prev) => ({
                  ...prev,
                  itemId: selectedItem._id,
                  defaultQuantityType: itemData?.itemId?.defaultQuantityType || '',
                  quantity: "",
                  boxes: ""
                }));
                setIsItemFocus(false);
              }}
              value={form.itemId}
              renderItem={(item) => (
                <View style={{ padding: 10 }}>
                  <Text>
                    Item: {item.itemId.name} | Quantity: {item.quantity} | Price: ₹{item.price}
                  </Text>
                </View>
              )}
            />

            {form.customerId && !isLoadingItems && items.length === 0 && (
              <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mt-2">
                <Text className="text-yellow-800 text-center">
                  No items found for this customer
                </Text>
              </View>
            )}

            {form.itemId ? (
              form.defaultQuantityType === 'box' ? (
                <>
                  <Text className="text-gray-700 font-semibold">Boxes</Text>
                  <TextInput
                    className={inputClass}
                    value={form.boxes}
                    keyboardType="decimal-pad"
                    onChangeText={(val) => {
                      const validatedVal = validateNumericInput(val);
                      const newBoxes = Number(validatedVal) || 0;
                      const itemsPerBox = items.find((item) => item._id === form.itemId)?.itemId?.itemsPerBox || 0;
                      const newQuantity = newBoxes * itemsPerBox;

                      setForm(prev => ({
                        ...prev,
                        boxes: validatedVal,
                        quantity: newQuantity.toString()
                      }));
                    }}
                    placeholder="Enter number of boxes"
                    maxLength={10}
                  />
                  <Text className="text-gray-500 text-sm mt-1">
                    A Box Contains {items.find((item) => item._id === form.itemId)?.itemId?.itemsPerBox ?? 0} Items
                  </Text>

                  <Text className="text-gray-700 font-semibold">Quantity</Text>
                  <TextInput
                    className={inputClass}
                    value={form.quantity}
                    keyboardType="decimal-pad"
                    onChangeText={(val) => handleChange('quantity', val)}
                    editable={!isLoadingItems && !!form.itemId}
                    placeholder="Calculated quantity"
                    maxLength={10}
                  />
                </>
              ) : (
                <>
                  <Text className="text-gray-600 mb-2">Loose Items</Text>
                  <Text className="text-gray-700 font-semibold">Quantity</Text>
                  <TextInput
                    className={inputClass}
                    value={form.quantity}
                    keyboardType="decimal-pad"
                    onChangeText={(val) => handleChange('quantity', val)}
                    editable={!isLoadingItems && !!form.itemId}
                    placeholder="Enter quantity"
                    maxLength={10}
                  />
                </>
              )
            ) : null}

            <TouchableOpacity
              onPress={addItemToCart}
              className={`${!form.itemId || !form.quantity || isLoadingItems ? `bg-gray-400` : `bg-blue-600`} rounded-xl px-6 py-3 mt-2`}
              disabled={!form.itemId || !form.quantity || isLoadingItems}
            >
              <Text className="text-white text-center font-bold">Add Item</Text>
            </TouchableOpacity>
          </View>
        );
      }

      if (step === 2) {
        const total = cart.reduce((acc, cur) => acc + parseInt(cur.amount || 0), 0);
        const finalBill = (pending || 0) + total;

        return (
          <View className="space-y-4">
            <Text className="text-gray-700 font-semibold">Bill</Text>
            <TextInput className="bg-gray-200 px-4 py-3 rounded-xl" value={String(total)} editable={false} />

            <Text className="text-gray-700 font-semibold">Customer Debt</Text>
            <TextInput className="bg-gray-200 px-4 py-3 rounded-xl" value={String(pending)} editable={false} />

            <Text className="text-gray-700 font-semibold">Final Amount to be Paid</Text>
            <TextInput className="bg-gray-200 px-4 py-3 rounded-xl" value={String(finalBill)} editable={false} />

            <Text className="text-gray-700 font-semibold">Online Payment (₹)</Text>
            <TextInput
              className={inputClass}
              keyboardType="decimal-pad"
              value={form.onlinePayment}
              onChangeText={(val) => handleChange('onlinePayment', val)}
              editable={!isSubmitting}
              placeholder="Enter online payment amount"
              maxLength={10}
            />

            <Text className="text-gray-700 font-semibold">Cash Payment (₹)</Text>
            <TextInput
              className={inputClass}
              keyboardType="decimal-pad"
              value={form.cashPayment}
              onChangeText={(val) => handleChange('cashPayment', val)}
              editable={!isSubmitting}
              placeholder="Enter cash payment amount"
              maxLength={10}
            />

            <Text className="text-gray-700 font-semibold">Total Payment</Text>
            <TextInput
              className="bg-gray-200 px-4 py-3 rounded-xl"
              value={(parseFloat(form.onlinePayment || 0) + parseFloat(form.cashPayment || 0)).toString() || '0'}
              editable={false}
            />
          </View>
        );
      }
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
            <LinearGradient colors={["#13545c", "#07363C"]} style={{ minHeight: '100%' }}>
              <View className="px-6 pt-14 pb-6">
                <Text className="text-white font-bold text-xl text-center">Stock Management</Text>
                <Text className="text-white mt-1 text-sm mb-3 text-center">Step {step} of {totalSteps}</Text>

                <View className="w-full h-2 bg-white/30 rounded-full">
                  <View className="h-2 bg-white rounded-full" style={{ width: `${(step / totalSteps) * 100}%` }} />
                </View>

                {cart.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setShowCart(true)}
                    className="bg-indigo-600 rounded-xl px-6 py-3 mt-2 absolute right-10 top-10 flex-row items-center space-x-2"
                  >
                    <Ionicons name="cart" size={20} color="white" />
                    <Text className="text-white font-bold">({cart.length})</Text>
                  </TouchableOpacity>
                )}
                  <Animated.View
                    key={step}
                    style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 24 }}
                    entering={direction === 'next' ? SlideInRight : SlideInLeft}
                    exiting={direction === 'next' ? SlideOutLeft : SlideOutRight}
                  >
                    <View className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 mt-20">
                      {renderStep()}
                    </View>
                  </Animated.View>

                <View className="flex-row justify-between items-center px-6 pb-6">
                  {step > 1 ? (
                    <TouchableOpacity
                      onPress={() => handleStepChange(step - 1)}
                      className="flex-row items-center bg-white border border-blue-300 px-6 py-3 rounded-full shadow"
                      disabled={isSubmitting}
                    >
                      <Ionicons name="chevron-back" size={20} color="#2563eb" />
                      <Text className="text-blue-600 font-semibold ml-1">Previous</Text>
                    </TouchableOpacity>
                  ) : <View />}

                  {step < totalSteps ? (
                    <TouchableOpacity
                      onPress={() => handleStepChange(step + 1)}
                      className={`flex-row items-center ${isStepValid() && !isLoadingCustomers && !isLoadingItems ? 'bg-blue-600' : 'bg-gray-400'} px-6 py-3 rounded-full shadow`}
                      disabled={!isStepValid() || isLoadingCustomers || isLoadingItems}
                    >
                      <Text className="text-white font-semibold mr-1">Next</Text>
                      <Ionicons name="chevron-forward" size={20} color="white" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={handleSubmit}
                      disabled={!isStepValid() || isSubmitting}
                      className={`flex-row items-center ${isStepValid() && !isSubmitting ? 'bg-green-600' : 'bg-gray-400'} px-6 py-3 rounded-full shadow`}
                    >
                      {isSubmitting && <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />}
                      <Text className="text-white font-semibold">
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </LinearGradient>
          </TouchableWithoutFeedback>
        </ScrollView>

        <Modal visible={showCart} animationType="slide" onRequestClose={() => setShowCart(false)}>
          <SafeAreaView className="flex-1 bg-white p-4">
            <Text className="text-lg font-bold mb-4">Cart Items</Text>
            <FlatList
              data={cart}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item, index }) => (
                <View className="flex-row justify-between items-center mb-2 border-b pb-2">
                  <View>
                    <Text>{item.itemName}</Text>
                    <Text>Qty: {item.quantity}</Text>
                    <Text>₹ {item.amount}</Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteCartItem(index)} className="px-3 py-1 bg-red-500 rounded-xl">
                    <Text className="text-white">Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
            <TouchableOpacity onPress={() => setShowCart(false)} className="mt-4 px-6 py-3 bg-blue-600 rounded-full">
              <Text className="text-white font-semibold text-center">Close</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </Modal>
        <Toast />
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    container: {
      backgroundColor: 'white',
      padding: 16,
    },
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
    icon: {
      marginRight: 5,
    },
    label: {
      position: 'absolute',
      backgroundColor: 'white',
      left: 22,
      top: 8,
      zIndex: 999,
      paddingHorizontal: 8,
      fontSize: 14,
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
