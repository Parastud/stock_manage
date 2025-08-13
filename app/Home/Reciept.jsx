import * as Linking from 'expo-linking';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import moment from 'moment';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Receipt() {
  const params = useLocalSearchParams();
  const router = useRouter();

  let cart = [];
  let payment = {};
  let items = [];

  try {
    cart = typeof params.cart === 'string' ? JSON.parse(params.cart) : params.cart || [];
  } catch { }

  try {
    payment = typeof params.payment === 'string' ? JSON.parse(params.payment) : params.payment || {};
  } catch { }

  try {
    items = typeof params.items === 'string' ? JSON.parse(params.items) : params.items || [];
  } catch { }

  // Determine the source (payment or order)
  const isFromPayment = params.source === 'payment' || (!params.totalAmount && payment.cash !== undefined);
  const isFromOrder = params.source === 'order' || params.totalAmount !== undefined;

  // Calculate values based on source
  const getReceiptData = () => {
    if (isFromPayment) {
      return {
        title: 'Payment Receipt',
        date: params.date || new Date().toISOString(),
        customer: params.customername || 'N/A',
        totalAmount: null, // No total amount for payment receipts
        pendingAmount: params.pendingAmount || 0,
        cash: payment.cash || 0,
        online: payment.online || 0,
        totalPayment: (Number(payment.cash) || 0) + (Number(payment.online) || 0),
        items: [], // No items for payment receipts
        showItems: false
      };
    } else {
      return {
        title: 'Order Receipt',
        orderId: params._id || 'N/A',
        date: params.date || new Date().toISOString(),
        customer: params.customername || 'N/A',
        totalAmount: params.totalAmount || 0,
        pendingAmount: params.pending || 0,
        cash: payment.cash || 0,
        online: payment.online || 0,
        totalPayment: (Number(payment.cash) || 0) + (Number(payment.online) || 0),
        items: cart.length > 0 ? cart : items,
        showItems: true
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

        <div class="section">
        ${!isFromPayment &&
    <div class="section-title">'Order ID'</div>}
          <div class="section-value">${receiptData.orderId}</div>
        </div>

        <div class="section">
          <div class="section-title">Date</div>
          <div class="section-value">${moment(receiptData.date).format('DD MMM YYYY, hh:mm A')}</div>
        </div>

        <div class="section">
          <div class="section-title">Customer</div>
          <div class="section-value">${receiptData.customer}</div>
        </div>

        ${receiptData.totalAmount !== null ? `
        <div class="section">
          <div class="section-title">Total Amount</div>
          <div class="section-value amount green">₹${receiptData.totalAmount}</div>
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">Pending Amount</div>
          <div class="section-value amount red">₹${receiptData.pendingAmount}</div>
        </div>

        <div class="section">
          <div class="section-title">Payment Details</div>
          <div class="section-value">💵 Cash: ₹${receiptData.cash}</div>
          <div class="section-value">💳 Online: ₹${receiptData.online}</div>
          <div class="section-value amount blue">Total Payment: ₹${receiptData.totalPayment}</div>
        </div>

        ${receiptData.showItems && receiptData.items.length > 0 ? `
        <div class="section item-list">
          <div class="section-title">📦 Items Purchased</div>
          ${receiptData.items.map(item => `
            <div class="item-row">
              <span>${item.itemName || 'Unnamed Item'}</span>
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

    if (!isFromPayment) {
      message += `\nOrder ID: ${receiptData.orderId}`;
    }

    message += `
Date: ${moment(receiptData.date).format('DD MMM YYYY, hh:mm A')}
Customer: ${receiptData.customer}`;

    if (receiptData.totalAmount !== null) {
      message += `\nTotal: ₹${receiptData.totalAmount}`;
    }

    message += `
Pending: ₹${receiptData.pendingAmount}
Payment: Cash ₹${receiptData.cash}, Online ₹${receiptData.online}
Total Payment: ₹${receiptData.totalPayment}`;

    if (receiptData.showItems && receiptData.items.length > 0) {
      message += `
Items: ${receiptData.items
          .map(i => `${i.itemName || 'Unnamed'} x${i.quantity}`)
          .join(', ')}`;
    }

    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'WhatsApp not installed');
    });
  };


  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <Text className="text-3xl font-bold text-center text-indigo-600 mb-6">
            🧾 {receiptData.title}
          </Text>

          {/* Receipt Info */}
          <View className="space-y-2 mb-5">
            <View className="flex-row justify-between">
              {!isFromPayment &&
                <Text className="text-gray-500">{'Order ID:'}</Text>}
              <Text className="font-semibold">{receiptData.orderId}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500">Date:</Text>
              <Text className="font-medium">
                {moment(receiptData.date).format('DD MMM YYYY, hh:mm A')}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500">Customer:</Text>
              <Text className="font-medium">{receiptData.customer}</Text>
            </View>
          </View>

          {/* Amounts */}
          <View className="mb-5 border-t border-gray-200 pt-4 space-y-1">
            {receiptData.totalAmount !== null && (
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Total Amount</Text>
                <Text className="text-green-700 font-semibold">₹{receiptData.totalAmount}</Text>
              </View>
            )}
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Pending Amount</Text>
              <Text className="text-red-600 font-semibold">₹{receiptData.pendingAmount}</Text>
            </View>
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
            <View className="flex-row justify-between border-t pt-2 mt-2">
              <Text className="font-semibold">Total Payment:</Text>
              <Text className="font-bold text-blue-600">₹{receiptData.totalPayment}</Text>
            </View>
          </View>

          {/* Item List - Only show for orders */}
          {receiptData.showItems && (
            <View className="mb-5">
              <Text className="text-gray-500 mb-2 font-medium">📦 Items Purchased</Text>
              {receiptData.items.length > 0 ? (
                receiptData.items.map((item, idx) => (
                  <View key={idx} className="flex-row justify-between border-b py-2">
                    <Text className="text-gray-800">{item.itemName || 'Unnamed Item'}</Text>
                    <Text className="text-gray-500">x{item.quantity}</Text>
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
          onPress={() => router.replace(isFromPayment ? '/Home/Payment' : '/Home')}
          className="bg-indigo-600 py-3 mt-10 rounded-xl w-[50%] self-center"
        >
          <Text className="text-center text-white text-base font-semibold">
            {isFromPayment ? '💰 Make New Payment' : '🧾 Make New Order'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
