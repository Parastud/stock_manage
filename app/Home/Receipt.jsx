import * as Linking from 'expo-linking';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import moment from 'moment';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function Receipt() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  let cart = [];
  let payment = {};
  
  try {
    cart = typeof params.cart === 'string' ? JSON.parse(params.cart) : params.cart || [];
  } catch { }
  
  try {
    payment = typeof params.items === 'string' ? JSON.parse(params.items) : params.items || [];
  } catch { }
  
  try {
    payment = typeof params.payment === 'string' ? JSON.parse(params.payment) : params.payment || {};
  } catch { }

  // Smart source detection
  const isFromPayment = params.source === 'payment';
  const isFromOrder = params.source === 'order';
  
  // Check if new parameters exist (todayTotal, oldpending)
  const hasNewParams = params.todayTotal !== undefined || params.oldpending !== undefined;
  
  // Determine receipt type
  const getReceiptType = () => {
    if (isFromPayment) return 'payment';
    if (isFromOrder && hasNewParams) return 'detailed_order';
    if (isFromOrder && !hasNewParams) return 'simple_order';
    return 'simple_order';
  };

  const receiptType = getReceiptType();

  // Calculate values based on receipt type
  const getReceiptData = () => {
    const baseData = {
      date: params.date || new Date().toISOString(),
      customer: params.customername || 'N/A',
      orderId: params._id || 'N/A',
      cash: payment.cash || 0,
      online: payment.online || 0,
      items: cart,
    };

    switch (receiptType) {
      case 'payment':
        return {
          ...baseData,
          title: 'Payment Receipt',
          todayTotal: 0,
          totalAmount: (Number(payment.cash) || 0) + (Number(payment.online) || 0),
          totalPending: params.pendingAmount,
          showItems: false,
          showOldBalance: true,
          showPending: true
        };

      case 'detailed_order':
        const todayTotal = Number(params.totalAmount) || 0;
        const oldBalance = Number(params.oldpending) || 0;
        const totalAmount = todayTotal+oldBalance;
        const totalPayment = (Number(payment.cash) || 0) + (Number(payment.online) || 0);
        return {
          ...baseData,
          title: 'Order Receipt',
          todayTotal,
          oldBalance,
          totalAmount,
          totalPayment,
          totalPending: totalAmount - totalPayment,
          showItems: true,
          showOldBalance: true,
          showPending: true
        };

      case 'simple_order':
      default:
        const orderTotal = Number(params.totalAmount) || cart.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const simplePayment = (Number(payment.cash) || 0) + (Number(payment.online) || 0);
        
        return {
          ...baseData,
          title: 'Order Receipt',
          todayTotal: orderTotal,
          oldBalance: 0,
          totalAmount: simplePayment, // Total amount = cash + online for simple orders
          totalPayment: simplePayment,
          totalPending: orderTotal-simplePayment,
          showItems: true,
          showOldBalance: false,
          showPending: true
        };
    }
  };

  const receiptData = getReceiptData();

  const generateHtml = () => `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body {
          font-family: 'Arial', sans-serif;
          padding: 24px;
          background-color: #f8f9fa;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: auto;
          background: #fff;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 0 10px rgba(0,0,0,0.05);
        }
        h1 {
          text-align: center;
          color: #4f46e5;
        }
        .section {
          margin-bottom: 16px;
        }
        .section-title {
          font-weight: bold;
          color: #6b7280;
          margin-bottom: 4px;
        }
        .section-value {
          font-size: 16px;
          font-weight: 500;
        }
        .amount {
          font-size: 18px;
          font-weight: bold;
        }
        .green { color: #16a34a; }
        .red { color: #dc2626; }
        .blue { color: #2563eb; }
        .item-list {
          border-top: 1px solid #e5e7eb;
          margin-top: 12px;
          padding-top: 12px;
        }
        .item-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🧾 ${receiptData.title}</h1>
        ${receiptType !== 'payment' ? `
        <div class="section">
          <div class="section-title">Order ID</div>
          <div class="section-value">${receiptData.orderId}</div>
        </div>` : ``}
        
        <div class="section">
          <div class="section-title">Date</div>
          <div class="section-value">${moment(receiptData.date).format('DD MMM YYYY, hh:mm A')}</div>
        </div>
        
        <div class="section">
          <div class="section-title">Customer</div>
          <div class="section-value blue">${receiptData.customer}</div>
        </div>
        
        ${receiptType === 'detailed_order' ? `
        <div class="section">
          <div class="section-title">Today Total</div>
          <div class="section-value amount">₹${receiptData.todayTotal}</div>
        </div>
        ` : ''}
        
        ${receiptData.showOldBalance &&receiptType === 'detailed_order'  ? `
        <div class="section">
          <div class="section-title">Old Balance</div>
          <div class="section-value amount">₹${receiptData.oldBalance}</div>
        </div>
        ` : ''}
        
        ${receiptType === 'simple_order' ? `
        <div class="section">
          <div class="section-title">Order Total</div>
          <div class="section-value amount">₹${receiptData.todayTotal}</div>
        </div>
        ` : ''}
        
        ${receiptType != 'payment' ? `
          <div class="section">
          <div class="section-title">Total Amount</div>
          <div class="section-value amount blue">₹${receiptData.totalAmount}</div>
        </div>` : `
        <div class="section">
          <div class="section-title">Total Pending</div>
          <div class="section-value amount red">₹${receiptData.totalPending}</div>
        </div>`}
        
        <div class="section">
          <div class="section-title">Payment Details</div>
          <div class="section-value">💵 Cash: ₹${receiptData.cash}</div>
          <div class="section-value">💳 Online: ₹${receiptData.online}</div>
        </div>
        
        ${receiptData.showPending &&
          receiptType != 'payment'?
          `
        <div class="section">
          <div class="section-title">Total Pending</div>
          <div class="section-value amount red">₹${receiptData.totalPending}</div>
        </div>
        ` : `<div class="section">
          <div class="section-title">Total Amount</div>
          <div class="section-value amount blue">₹${receiptData.totalAmount}</div>
        </div>`}
        
        ${receiptData.showItems && receiptData.items.length > 0 ? `
        <div class="section item-list">
          <div class="section-title">📦 Items Purchased</div>
          ${receiptData.items.map(item => `
            <div class="item-row">
              <span>${item.itemName ? item.itemName :item.itemId.name || 'Unnamed Item'}</span>
              <span>Qty: ${item.quantity}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}
      </div>
    </body>
  </html>
`;

  const printPDF = async () => {
    try {
      const { uri } = await Print.printToFileAsync({ html: generateHtml() });
      await Sharing.shareAsync(uri);
    } catch {
      Alert.alert('Error', 'Could not generate PDF.');
    }
  };

  const shareViaWhatsApp = () => {
    let message = `🧾 ${receiptData.title}`;
    if (receiptType !== 'payment') {
      message += `\nOrder ID: ${receiptData.orderId}`;
    }
    message += `
Date: ${moment(receiptData.date).format('DD MMM YYYY, hh:mm A')}
Customer: ${receiptData.customer}`;
    
    if (receiptType === 'detailed_order') {
      message += `\nToday Total: ₹${receiptData.todayTotal}`;
      message += `\nOld Balance: ₹${receiptData.oldBalance}`;
    } else if (receiptType === 'simple_order') {
      message += `\nOrder Total: ₹${receiptData.todayTotal}`;
    }
    
    message += `\nTotal Amount: ₹${receiptData.totalAmount}`;
    message += `\nCash: ₹${receiptData.cash}, Online: ₹${receiptData.online}`;
    
    if (receiptData.showPending) {
      message += `\nTotal Pending: ₹${receiptData.totalPending}`;
    }

    if (receiptData.showItems && receiptData.items.length > 0) {
      message += `\nItems: ${receiptData.items
        .map(i => `${i.itemName ? i.itemName :i.itemId.name|| 'Unnamed'} x${i.quantity}`)
        .join(', ')}`;
    }

    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'WhatsApp not installed');
    });
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <View className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <Text className="text-3xl font-bold text-center text-indigo-600 mb-6">
          🧾 {receiptData.title}
        </Text>

        {/* Receipt Info */}
        <View className="space-y-2 mb-5">
          {receiptType !== 'payment' && (
            <View className="flex-row justify-between">
              <Text className="text-gray-500">Order ID:</Text>
              <Text className="font-semibold">{receiptData.orderId}</Text>
            </View>
          )}
          <View className="flex-row justify-between">
            <Text className="text-gray-500">Date:</Text>
            <Text className="font-medium">
              {moment(receiptData.date).format('DD MMM YYYY, hh:mm A')}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-500">Customer:</Text>
            <Text className="font-medium text-sky-600">{receiptData.customer}</Text>
          </View>
        </View>

        {/* Amounts */}
        <View className="mb-5 border-t border-gray-200 pt-4 space-y-1">
          {receiptType === 'detailed_order' && (
            <>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Today Total:</Text>
                <Text className="font-semibold">₹{receiptData.todayTotal}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Old Balance:</Text>
                <Text className="font-semibold">₹{receiptData.oldBalance}</Text>
              </View>
            </>
          )}
          {receiptType === 'simple_order' && (
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Order Total:</Text>
              <Text className="font-semibold">₹{receiptData.todayTotal}</Text>
            </View>
          )}
          {receiptType != 'payment' ?
            <View className="flex-row justify-between">
            <Text className="text-gray-600">Total Amount:</Text>
            <Text className="text-blue-600 font-bold text-lg">₹{receiptData.totalAmount}</Text>
          </View>
          :<View className="flex-row justify-between">
            <Text className="font-semibold">Total Pending:</Text>
              <Text className="font-bold text-red-600">₹{receiptData.totalPending}</Text>
          </View>}
        </View>

        {/* Payment Details */}
        <View className="mb-5">
          <Text className="text-gray-500 mb-2 font-medium">💰 Payment Details</Text>
          <View className="flex-row justify-between">
            <Text>💵 Cash:</Text>
            <Text className="font-medium">₹{receiptData.cash}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text>💳 Online:</Text>
            <Text className="font-medium">₹{receiptData.online}</Text>
          </View>
          {receiptData.showPending && (

           (
            receiptType != 'payment' ?

            <View className="flex-row justify-between border-t pt-2 mt-2">
              <Text className="font-semibold">Total Pending:</Text>
              <Text className="font-bold text-red-600">₹{receiptData.totalPending}</Text>
            </View>
          :<View className="flex-row justify-between border-t pt-2 mt-2">
                          <Text className="text-gray-600">Total Amount:</Text>
            <Text className="text-blue-600 font-bold text-lg">₹{receiptData.totalAmount}</Text>

            </View> 
          )
          )}
        </View>

        {/* Item List */}
        {receiptData.showItems && (
          <View className="mb-5">
            <Text className="text-gray-500 mb-2 font-medium">📦 Items Purchased</Text>
            {receiptData.items.length > 0 ? (
              receiptData.items.map((item, idx) => (
                <View key={idx} className="flex-row justify-between border-b py-2">
                  <Text className="text-gray-800">{item.itemName ? item.itemName :item.itemId.name || 'Unnamed Item'}</Text>
                  <Text className="text-gray-500">
                    x{item.quantity}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-gray-400">No items found</Text>
            )}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <TouchableOpacity
        onPress={printPDF}
        className="bg-indigo-600 py-4 rounded-2xl mb-4 shadow-sm"
      >
        <Text className="text-center text-white text-base font-semibold">
          📄 Download PDF
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={shareViaWhatsApp}
        className="bg-green-500 py-4 rounded-2xl shadow-sm"
      >
        <Text className="text-center text-white text-base font-semibold">
          📲 Share via WhatsApp
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace(receiptType === 'payment' ? '/Home/Payment' : '/Home')}
        className="bg-indigo-600 py-3 mt-10 rounded-xl w-[50%] self-center"
      >
        <Text className="text-center text-white text-base font-semibold">
          {receiptType === 'payment' ? '💰 Make New Payment' : '🧾 Make New Order'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
