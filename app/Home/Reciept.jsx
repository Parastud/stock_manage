import * as Linking from 'expo-linking';
import * as Print from 'expo-print';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import moment from 'moment';
import { Alert, Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Reciept() {
    const params = useLocalSearchParams();

    let items = [];
    let payment = {};
    let cart = [];

    try {
        items = typeof params.items === 'string' ? JSON.parse(params.items) : params.items;
    } catch {
        items = [];
    }

    try {
        cart = typeof params.cart === 'string' ? JSON.parse(params.cart) : params.cart;
    } catch {
        cart = [];
    }

    try {
        payment = typeof params.payment === 'string' ? JSON.parse(params.payment) : params.payment;
    } catch {
        payment = {};
    }

    const generateHtml = () => {
        return `
      <html>
        <body>
          <h1>🧾 Receipt</h1>
          <p><strong>Order ID:</strong> ${params._id}</p>
          <p><strong>Date:</strong> ${moment(params.date).format('DD MMM YYYY, hh:mm A')}</p>
          <p><strong>Customer ID:</strong> ${params.customerId}</p>
          <p><strong>Total Amount:</strong> ₹${params.totalAmount}</p>
          <p><strong>Pending Amount:</strong> ₹${params.pending}</p>
          <p><strong>Payment:</strong> Cash ₹${payment.cash ?? 0}, Online ₹${payment.online ?? 0}</p>
          <h2>Items:</h2>
          <ul>
            ${cart
                .map(
                    (item) =>
                        `<li>${item.itemId?.name ?? 'Unnamed'} - Qty: ${item.quantity} - ₹${item.amount}</li>`
                )
                .join('')}
          </ul>
        </body>
      </html>
    `;
    };

    const printPDF = async () => {
        try {
            const { uri } = await Print.printToFileAsync({
                html: generateHtml(),
            });
            await Sharing.shareAsync(uri);
        } catch (error) {
            Alert.alert('Error', 'Failed to create PDF');
        }
    };

    const shareViaWhatsApp = () => {
        const message = `🧾 Receipt
Order ID: ${params._id}
Date: ${moment(params.date).format('DD MMM YYYY, hh:mm A')}
Customer ID: ${params.customerId}
Total: ₹${params.totalAmount}
Pending: ₹${params.pending}
Payment: Cash ₹${payment.cash ?? 0}, Online ₹${payment.online ?? 0}
Items: ${cart
                .map((i) => `${i.itemId?.name ?? 'Unnamed'} x${i.quantity} - ₹${i.amount}`)
                .join(', ')}`;

        const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
        Linking.openURL(url).catch(() => {
            Alert.alert('Error', 'WhatsApp is not installed');
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.heading}>🧾 Receipt</Text>

                <View style={styles.section}>
                    <Text style={styles.label}>Order ID:</Text>
                    <Text style={styles.value}>{params._id}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Date:</Text>
                    <Text style={styles.value}>
                        {moment(params.date).format('DD MMM YYYY, hh:mm A')}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Customer ID:</Text>
                    <Text style={styles.value}>{params.customerId}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Total Amount:</Text>
                    <Text style={styles.value}>₹{params.totalAmount}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Pending Amount:</Text>
                    <Text style={styles.value}>₹{params.pending}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Payment Method:</Text>
                    <Text style={styles.value}>Cash: ₹{payment.cash ?? 'N/A'}</Text>
                    <Text style={styles.value}>Online: ₹{payment.online ?? 'N/A'}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Items:</Text>
                    {console.log(cart)}
                    {Array.isArray(cart) && cart.length > 0 ? (
                        cart.map((item, index) => (
                            <Text key={item.itemId?._id || index} style={styles.item}>
                                {item.itemName ?? 'Unnamed'} - Qty: {item.quantity} - ₹{item.amount}
                            </Text>
                        ))
                    ) : (
                        <Text style={styles.value}>No items found</Text>
                    )}
                </View>

                {/* QR Code */}
                <View style={styles.section}>
                    <Text style={styles.label}>QR Code (Order ID):</Text>
                    <QRCode value={params._id ?? 'N/A'} size={120} />
                </View>

                {/* Buttons */}
                <View style={styles.section}>
                    <Button title="Download PDF" onPress={printPDF} />
                    <View style={{ height: 10 }} />
                    <Button title="Share via WhatsApp" color="#25D366" onPress={shareViaWhatsApp} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 16,
    },
    heading: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    section: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        color: '#666',
    },
    value: {
        fontSize: 18,
        fontWeight: '600',
    },
    item: {
        fontSize: 16,
        paddingLeft: 10,
        marginVertical: 2,
    },
});
