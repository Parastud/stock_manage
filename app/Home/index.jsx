import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated';

const totalSteps = 4;

export default function index() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState('next');

  const [form, setForm] = useState({
    customerName: '',
    itemName: '',
    quantity: '',
    price: '',
    onlinePayment: '',
    cashPayment: '',
    debt: '',
    bill: '',
  });

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleStepChange = newStep => {
    setDirection(newStep > step ? 'next' : 'back');
    setStep(newStep);
  };

  const inputClass =
    'bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 w-full text-base';

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View className="space-y-4">
            <Text className="text-gray-700 font-semibold">Customer Name</Text>
            <TextInput
              className={inputClass}
              placeholder="Search or enter customer name"
              value={form.customerName}
              onChangeText={val => handleChange('customerName', val)}
            />
          </View>
        );
      case 2:
        return (
          <View className="space-y-4">
            <Text className="text-gray-700 font-semibold">Item Name</Text>
            <TextInput
              className={inputClass}
              placeholder="e.g. Necklace"
              value={form.itemName}
              onChangeText={val => handleChange('itemName', val)}
            />
            <Text className="text-gray-700 font-semibold">Quantity</Text>
            <TextInput
              className={inputClass}
              placeholder="e.g. 2"
              keyboardType="numeric"
              value={form.quantity}
              onChangeText={val => handleChange('quantity', val)}
            />
            <Text className="text-gray-700 font-semibold">Price</Text>
            <TextInput
              className={inputClass}
              placeholder="e.g. 12000"
              keyboardType="numeric"
              value={form.price}
              onChangeText={val => handleChange('price', val)}
            />
          </View>
        );
      case 3:
        return (
          <View className="space-y-4">
            <Text className="text-gray-700 font-semibold">Online Payment</Text>
            <TextInput
              className={inputClass}
              placeholder="e.g. 5000"
              keyboardType="numeric"
              value={form.onlinePayment}
              onChangeText={val => handleChange('onlinePayment', val)}
            />
            <Text className="text-gray-700 font-semibold">Cash Payment</Text>
            <TextInput
              className={inputClass}
              placeholder="e.g. 3000"
              keyboardType="numeric"
              value={form.cashPayment}
              onChangeText={val => handleChange('cashPayment', val)}
            />
          </View>
        );
      case 4:
        return (
          <View className="space-y-4">
            <Text className="text-gray-700 font-semibold">Customer Debt</Text>
            <TextInput
              className={inputClass}
              placeholder="e.g. 2000"
              keyboardType="numeric"
              value={form.debt}
              onChangeText={val => handleChange('debt', val)}
            />
            <Text className="text-gray-700 font-semibold">Final Bill</Text>
            <TextInput
              className={inputClass}
              placeholder="e.g. 10000"
              keyboardType="numeric"
              value={form.bill}
              onChangeText={val => handleChange('bill', val)}
            />
          </View>
        );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <LinearGradient
        colors={['#2563eb', '#3b82f6']}
        className="px-6 pt-14 pb-6 rounded-b-3xl shadow-md h-full"
      >
        <Text className="text-white font-bold text-xl text-center">Stock Management</Text>
        <Text className="text-white mt-1 text-sm mb-3 text-center">Step {step} of {totalSteps}</Text>
        <View className="w-full h-2 bg-white/30 rounded-full">
          <View
            className="h-2 bg-white rounded-full"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </View>
        <Text className="text-white mt-2 text-center">{Math.floor((step / totalSteps) * 100)}% Complete</Text>


      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
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
          <TouchableOpacity
            onPress={() => handleStepChange(step - 1)}
            className="flex-row items-center bg-white border border-blue-300 px-6 py-3 rounded-full shadow"
          >
            <Ionicons name="chevron-back" size={20} color="#2563eb" />
            <Text className="text-blue-600 font-semibold ml-1">Previous</Text>
          </TouchableOpacity>
        ) : <View />}

        {step < totalSteps ? (
          <TouchableOpacity
            onPress={() => handleStepChange(step + 1)}
            className="flex-row items-center bg-blue-600 px-6 py-3 rounded-full shadow"
          >
            <Text className="text-white font-semibold mr-1">Next</Text>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => alert('Form submitted')}
            className="bg-green-600 px-6 py-3 rounded-full shadow"
          >
            <Text className="text-white font-semibold">Submit</Text>
          </TouchableOpacity>
        )}
      </View>
            </LinearGradient>
    </SafeAreaView>
  );
}
