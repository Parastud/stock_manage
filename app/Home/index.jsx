import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
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

const totalSteps = 3;

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
  const router = useRouter()
  const [temp, settemp] = useState([])

  const [form, setForm] = useState({
    customerId: '',
    itemId: '',
    quantity: '',
    price: '',
    onlinePayment: '',
    cashPayment: '',
  });

  const handleSubmit = async () => {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      Toast.show({
        type: "error",
        text1: 'User token missing'
      });
      return;
    }

    if (!form.customerId || cart.length === 0) {
      Toast.show({
        type: "error",
        text1: 'Missing customer or cart information',
      });
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
        cash: Number(form.cashPayment),
        online: Number(form.onlinePayment),
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
          cart:JSON.stringify(temp),
          items: JSON.stringify(responseData.items),
          payment: JSON.stringify(responseData.payment),
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
      console.log(error);
    }
  };

  const resetForm = () => {
    setForm({
      customerId: '',
      itemId: '',
      quantity: '',
      price: '',
      onlinePayment: '',
      cashPayment: '',
    });
    settemp(cart)
    setCart([]);
    setStep(1);
  };


  const inputClass =
    'bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 w-full text-base';

  const handleChange = (key, value, resetId = false) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(resetId && key === 'customerId' ? { customerId: '' } : {}),
      ...(resetId && key === 'itemName' ? { itemId: '' } : {}),
    }));
  };

  const handleStepChange = (newStep) => {
    setDirection(newStep > step ? 'next' : 'back');
    setStep(newStep);
  };

  const fetchData = async () => {
    const token = await AsyncStorage.getItem('userToken');
    try {
      const res1 = await axiosInstance.get("/customers?view=true", { headers: { Authorization: token } });
      const res2 = await axiosInstance.get("/items?view=true", { headers: { Authorization: token } });
      setCustomers(Array.isArray(res1.data) ? res1.data : res1.data.data || []);
      setItems(res2.data.data.items || []);
    } catch (error) {
      // console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addItemToCart = () => {
    if (!form.itemId || !form.quantity || !form.price) {
      Toast.show({
        type: "error",
        text1: 'Missing item details'
      });
      return;
    }

    const isDuplicate = cart.some((i) => i.itemId === form.itemId);
    if (isDuplicate) {
      Toast.show({
        type: "error",
        text1: 'Item already added'
      });
      return;
    }

    const item = items.find((i) => i._id === form.itemId);
    const newItem = {
      itemId: form.itemId,
      itemName: item?.name || '',
      quantity: Number(form.quantity),
      amount: Number(form.price),
    };

    setCart((prev) => [...prev, newItem]);
    setForm((prev) => ({ ...prev, itemName: '', itemId: '', quantity: '', price: '' }));
    Toast.show({
      type: 'success',
      text1: 'Item added to cart',
    });
  };

  const deleteCartItem = (index) => {
    cart.length === 1 ? (setShowCart(false), handleStepChange(2)) : null;
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const isStepValid = () => {
    if (step === 1) {
      return form.customerId.trim() !== '';
    }
    if (step === 2) {
      return cart.length > 0;
    }
    if (step === 3) {
      return form.onlinePayment.trim() !== '' && form.cashPayment.trim() !== '';
    }
    return false;
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <View className="space-y-4">
          <Text className="text-gray-700 font-semibold">Select Customer</Text>
          <Dropdown
            style={[styles.dropdown, isCustomerFocus && { borderColor: '#2563eb', borderWidth: 2 }]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={customers}
            search
            maxHeight={300}
            labelField="name"
            valueField="_id"
            placeholder={!isCustomerFocus ? 'Select Customer' : ''}
            searchPlaceholder="Search customer..."
            value={form.customerId}
            onFocus={() => setIsCustomerFocus(true)}
            onBlur={() => setIsCustomerFocus(false)}
            onChange={(item) => {
              setForm((prev) => ({
                ...prev,
                customerId: item._id,
              }));
              setPending(item.totalPendingAmount);
              setIsCustomerFocus(false);
            }}
          />

        </View>
      );
    }


    if (step === 2) {
      return (
        <View className="space-y-4">
          <Text className="text-gray-700 font-semibold">Select Item</Text>
          <Dropdown
            style={[styles.dropdown, isItemFocus && { borderColor: '#2563eb', borderWidth: 2 }]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={items}
            search
            maxHeight={300}
            labelField="name"
            valueField="_id"
            placeholder={!isItemFocus ? 'Select Item' : '...'}
            searchPlaceholder="Search item..."
            onFocus={() => setIsItemFocus(true)}
            onBlur={() => setIsItemFocus(false)}
            onChange={(item) => {
              setForm((prev) => ({
                ...prev,
                itemId: item._id,
              }));
              setIsItemFocus(false);
            }}
            value={form.itemId}

          />

          <Text className="text-gray-700 font-semibold">Quantity</Text>
          <TextInput
            className={inputClass}
            placeholder="Enter Quantity"
            maxLength={10}
            keyboardType="numeric"
            value={form.quantity}
            onChangeText={(val) => {
              const numericVal = val.replace(/[^0-9]/g, '');
              handleChange('quantity', numericVal);
            }}
          />

          <Text className="text-gray-700 font-semibold">Price</Text>
          <TextInput
            className={inputClass}
            placeholder="Enter Price"
            maxLength={10}
            keyboardType="decimal-pad"
            value={form.price}
            onChangeText={(val) => {
              const numericVal = val.replace(/[^0-9.]/g, '')
                .replace(/^(\d*\.\d*).*$/, '$1');
              handleChange('price', numericVal);
            }}
          />

          <TouchableOpacity
            onPress={addItemToCart}
            className={`${!form.itemId || !form.quantity || !form.price ? `bg-gray-400` : `bg-blue-600`} rounded-xl px-6 py-3 mt-2`}
            disabled={!form.itemId || !form.quantity || !form.price}
          >
            <Text className="text-white text-center font-bold">Add Item</Text>
          </TouchableOpacity>
        </View>
      );
    }


    if (step === 3) {
      const total = cart.reduce((acc, cur) => acc + parseInt(cur.amount || 0), 0);
      const finalBill = (pending || 0) + total;

      return (
        <View className="space-y-4">
          <Text className="text-gray-700 font-semibold">Customer Debt</Text>
          <TextInput className="bg-gray-200 px-4 py-3 rounded-xl" value={String(pending)} editable={false} />

          <Text className="text-gray-700 font-semibold">Bill</Text>
          <TextInput className="bg-gray-200 px-4 py-3 rounded-xl" value={String(total)} editable={false} />

          <Text className="text-gray-700 font-semibold">Final Amount to be Paid</Text>
          <TextInput className="bg-gray-200 px-4 py-3 rounded-xl" value={String(finalBill)} editable={false} />

          <Text className="text-gray-700 font-semibold">Online Payment</Text>
          <TextInput className={inputClass} keyboardType="numeric" value={form.onlinePayment} onChangeText={(val) => handleChange('onlinePayment', val)} />

          <Text className="text-gray-700 font-semibold">Cash Payment</Text>
          <TextInput className={inputClass} keyboardType="numeric" value={form.cashPayment} onChangeText={(val) => handleChange('cashPayment', val)} />

          <Text className="text-gray-700 font-semibold">Total Payment</Text>
          <TextInput className="bg-gray-200 px-4 py-3 rounded-xl" value={(parseFloat(form.onlinePayment || 0) + parseFloat(form.cashPayment || 0)).toString() || '0'} editable={false} />
        </View>
      );
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView className="flex-1 bg-white">
        <LinearGradient colors={["#13545c", "#07363C"]} className="px-6 pt-14 pb-6 rounded-b-3xl shadow-md h-full">
          <Text className="text-white font-bold text-xl text-center">Stock Management</Text>
          <Text className="text-white mt-1 text-sm mb-3 text-center">Step {step} of {totalSteps}</Text>

          <View className="w-full h-2 bg-white/30 rounded-full">
            <View className="h-2 bg-white rounded-full" style={{ width: `${(step / totalSteps) * 100}%` }} />
          </View>
          <TouchableOpacity className='absolute left-2 top-10' onPress={() => { router.push("/Home/Profile") }}>
            <Ionicons name='person-circle' size={40} color="white" />
          </TouchableOpacity>
          {cart.length > 0 && (
            <TouchableOpacity
              onPress={() => setShowCart(true)}
              className="bg-indigo-600 rounded-xl px-6 py-3 mt-2 absolute right-10 top-10 flex-row items-center space-x-2"
            >
              <Ionicons name="cart" size={20} color="white" />
              <Text className="text-white font-bold">({cart.length})</Text>
            </TouchableOpacity>
          )}

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">

            <Animated.View
              key={step}
              className="flex-1 px-6 py-6"
              entering={direction === 'next' ? SlideInRight : SlideInLeft}
              exiting={direction === 'next' ? SlideOutLeft : SlideOutRight}
            >
              <View className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 mt-20">
                {renderStep()}
              </View>
            </Animated.View>
          </KeyboardAvoidingView>

          <View className="flex-row justify-between items-center px-6 pb-6">
            {step > 1 ? (
              <TouchableOpacity onPress={() => handleStepChange(step - 1)} className="flex-row items-center bg-white border border-blue-300 px-6 py-3 rounded-full shadow">
                <Ionicons name="chevron-back" size={20} color="#2563eb" />
                <Text className="text-blue-600 font-semibold ml-1">Previous</Text>
              </TouchableOpacity>
            ) : <View />}

            {step < totalSteps ? (
              <TouchableOpacity onPress={() => handleStepChange(step + 1)} className={`flex-row items-center ${isStepValid() ? 'bg-blue-600' : 'bg-gray-400'} px-6 py-3 rounded-full shadow`} disabled={!isStepValid()}>
                <Text className="text-white font-semibold mr-1">Next</Text>
                <Ionicons name="chevron-forward" size={20} color="white" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleSubmit} disabled={!isStepValid()} className={`${isStepValid() ? 'bg-green-600' : 'bg-gray-400'} px-6 py-3 rounded-full shadow`}>
                <Text className="text-white font-semibold">Submit</Text>
              </TouchableOpacity>
            )}
          </View>

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
        </LinearGradient>
        <Toast />
      </SafeAreaView>
    </TouchableWithoutFeedback>
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