import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../../api/client';
import { Product, Customer } from '../../types';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

interface CartItem {
  product: any;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

// Sample seeded barcodes from database for hardware-free simulation
const DEMO_BARCODES = [
  { code: '8941100500010', name: 'Aarong Liquid Milk 1L' },
  { code: '8941100500027', name: 'Pran Frooto Mango 250ml' },
  { code: '8941100500034', name: 'Radhuni Chilli Powder 200g' },
  { code: '8941100500041', name: 'Teer Soyabean Oil 5L' },
  { code: '8941100500058', name: 'Dano Power Milk 500g' },
];

export const POSScreen = () => {
  const navigation = useNavigation<any>();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraActive, setCameraActive] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  // Customer & Checkout state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState('0');
  const [paymentType, setPaymentType] = useState<'CASH' | 'CREDIT'>('CASH');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);

  const scanLockRef = useRef(false);

  useEffect(() => {
    // Fetch customers list for dropdown selection
    const fetchCustomers = async () => {
      try {
        const res = await apiClient.get('/parties?type=CUSTOMER');
        const list = res.data?.data?.parties || res.data?.parties || res.data?.data || [];
        setCustomers(list);
      } catch (e) {
        console.warn('Failed to load customers:', e);
      }
    };
    fetchCustomers();
  }, []);

  const addProductToCart = (product: any) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      const price = Number(product.sellingPrice || product.salePrice || 0);

      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + 1;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          lineTotal: newQty * price,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            unitPrice: price,
            lineTotal: price,
          },
        ];
      }
    });
  };

  const handleBarcodeLookup = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    setSearching(true);
    try {
      const res = await apiClient.get(`/products/by-code/${trimmed}`);
      const product = res.data?.data || res.data;

      if (!product || !product.id) {
        Alert.alert('Not Found', `No product found with barcode or SKU: ${trimmed}`);
        return;
      }

      addProductToCart(product);
      setLastScannedCode(trimmed);
      setManualCode('');
    } catch (e: any) {
      Alert.alert('Scan Error', e.message || 'Product not found with this code');
    } finally {
      setSearching(false);
    }
  };

  const onBarcodeScanned = ({ data }: { data: string }) => {
    if (scanLockRef.current) return;
    scanLockRef.current = true;

    handleBarcodeLookup(data);

    // Throttle camera scans to avoid 20 scans in a second
    setTimeout(() => {
      scanLockRef.current = false;
    }, 2000);
  };

  const updateQuantity = (index: number, change: number) => {
    setCart((prev) => {
      const item = prev[index];
      const newQty = item.quantity + change;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      const updated = [...prev];
      updated[index] = {
        ...item,
        quantity: newQty,
        lineTotal: newQty * item.unitPrice,
      };
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountAmount = Math.min(Number(discount) || 0, subtotal);
  const grandTotal = Math.max(0, subtotal - discountAmount);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add at least one product to complete a sale.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId: selectedCustomer ? selectedCustomer.id : undefined,
        customerName: selectedCustomer ? selectedCustomer.name : customerName,
        customerPhone: selectedCustomer ? selectedCustomer.phone : customerPhone,
        paymentType,
        discount: discountAmount,
        paidAmount: paymentType === 'CREDIT' ? 0 : grandTotal,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      const res = await apiClient.post('/sales', payload);
      const createdSale = res.data?.data || res.data;

      // Reset cart and modal
      setCart([]);
      setCheckoutModalVisible(false);
      setDiscount('0');
      setSelectedCustomer(null);
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');

      // Navigate to digital receipt view
      navigation.navigate('Receipt', { sale: createdSale });
    } catch (e: any) {
      Alert.alert('Checkout Failed', e.message || 'Could not complete the sale');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Controls */}
      <View style={styles.topControlBar}>
        <TouchableOpacity
          style={[styles.cameraToggleBtn, cameraActive && styles.cameraToggleBtnActive]}
          onPress={async () => {
            if (!permission?.granted) {
              const res = await requestPermission();
              if (!res.granted) {
                Alert.alert('Camera Permission', 'Camera access is required to scan barcodes.');
                return;
              }
            }
            setCameraActive(!cameraActive);
          }}
        >
          <Ionicons
            name={cameraActive ? 'camera' : 'camera-outline'}
            size={18}
            color={cameraActive ? '#ffffff' : '#0284c7'}
          />
          <Text style={[styles.cameraToggleText, cameraActive && styles.cameraToggleTextActive]}>
            {cameraActive ? 'Close Camera Scanner' : 'Open Camera Scanner'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Live Camera Viewfinder */}
      {cameraActive ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e', 'qr'],
            }}
            onBarcodeScanned={onBarcodeScanned}
          >
            <View style={styles.scannerOverlay}>
              <View style={styles.scanTargetBox}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.scannerHint}>Align barcode within square</Text>
            </View>
          </CameraView>
        </View>
      ) : null}

      {/* Manual Barcode Input & Test Simulation Chips */}
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter Barcode / SKU (e.g. 8941100500010)"
            placeholderTextColor="#94a3b8"
            value={manualCode}
            onChangeText={setManualCode}
            keyboardType="default"
            autoCapitalize="none"
            onSubmitEditing={() => handleBarcodeLookup(manualCode)}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => handleBarcodeLookup(manualCode)}
            disabled={searching}
          >
            {searching ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="add" size={24} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Demo Barcode Simulation Chips for testing without physical scanner */}
        <View style={styles.simulationHeader}>
          <Ionicons name="flash" size={14} color="#f59e0b" style={{ marginRight: 4 }} />
          <Text style={styles.simulationTitle}>Hardware-Free Barcode Simulation (1-Tap Test):</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {DEMO_BARCODES.map((item) => (
            <TouchableOpacity
              key={item.code}
              style={styles.demoChip}
              onPress={() => handleBarcodeLookup(item.code)}
            >
              <Ionicons name="barcode-outline" size={14} color="#0284c7" style={{ marginRight: 4 }} />
              <Text style={styles.demoChipText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Cart Items List */}
      <View style={styles.cartSection}>
        <View style={styles.cartHeader}>
          <Text style={styles.cartTitle}>Cart Items ({cart.reduce((sum, i) => sum + i.quantity, 0)})</Text>
          {cart.length > 0 ? (
            <TouchableOpacity onPress={() => setCart([])}>
              <Text style={styles.clearCartText}>Clear All</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {cart.length === 0 ? (
          <View style={styles.emptyCartContainer}>
            <Ionicons name="cart-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
            <Text style={styles.emptyCartSub}>Scan a barcode above or tap a test chip to start selling</Text>
          </View>
        ) : (
          <FlatList
            data={cart}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.cartItemRow}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.cartItemPrice}>
                    ৳{item.unitPrice.toLocaleString()} × {item.quantity} = ৳{item.lineTotal.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.qtyControlRow}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(index, -1)}
                  >
                    <Ionicons name="remove" size={16} color="#334155" />
                  </TouchableOpacity>
                  <Text style={styles.qtyNumber}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(index, 1)}
                  >
                    <Ionicons name="add" size={16} color="#334155" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => removeItem(index)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* Sticky Bottom Checkout Footer */}
      {cart.length > 0 ? (
        <View style={styles.bottomFooter}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.footerLabel}>Total Payable</Text>
              <Text style={styles.footerGrandTotal}>৳{grandTotal.toLocaleString()}</Text>
            </View>
            <Button
              title="Proceed to Pay"
              onPress={() => setCheckoutModalVisible(true)}
              icon="arrow-forward-outline"
              size="lg"
              style={styles.payButton}
            />
          </View>
        </View>
      ) : null}

      {/* Checkout Drawer Modal */}
      <Modal
        visible={checkoutModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCheckoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Checkout</Text>
              <TouchableOpacity onPress={() => setCheckoutModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Customer selection */}
              <Text style={styles.inputLabel}>Customer Type</Text>
              <View style={styles.customerTypeRow}>
                <TouchableOpacity
                  style={[styles.typePill, !selectedCustomer && styles.typePillActive]}
                  onPress={() => setSelectedCustomer(null)}
                >
                  <Text style={[styles.typePillText, !selectedCustomer && styles.typePillTextActive]}>
                    Walk-in Customer
                  </Text>
                </TouchableOpacity>
                {customers.length > 0 ? (
                  <TouchableOpacity
                    style={[styles.typePill, selectedCustomer && styles.typePillActive]}
                    onPress={() => setSelectedCustomer(customers[0])}
                  >
                    <Text style={[styles.typePillText, selectedCustomer && styles.typePillTextActive]}>
                      Registered Party
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {!selectedCustomer ? (
                <>
                  <Input
                    label="Customer Name"
                    value={customerName}
                    onChangeText={setCustomerName}
                    placeholder="Walk-in Customer"
                  />
                  <Input
                    label="Phone Number"
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                    placeholder="017xxxxxxxx"
                    keyboardType="phone-pad"
                  />
                </>
              ) : (
                <View style={styles.selectedCustomerBox}>
                  <Text style={styles.selectedCustomerTitle}>Selected: {selectedCustomer.name}</Text>
                  <Text style={styles.selectedCustomerSub}>
                    Phone: {selectedCustomer.phone} | Due: ৳{Number(selectedCustomer.dueAmount || 0).toLocaleString()}
                  </Text>
                </View>
              )}

              {/* Payment Method */}
              <Text style={styles.inputLabel}>Payment Method</Text>
              <View style={styles.paymentTypeRow}>
                <TouchableOpacity
                  style={[styles.paymentPill, paymentType === 'CASH' && styles.paymentPillActive]}
                  onPress={() => setPaymentType('CASH')}
                >
                  <Ionicons
                    name="cash-outline"
                    size={18}
                    color={paymentType === 'CASH' ? '#0284c7' : '#64748b'}
                  />
                  <Text
                    style={[styles.paymentPillText, paymentType === 'CASH' && styles.paymentPillTextActive]}
                  >
                    Cash Paid
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.paymentPill, paymentType === 'CREDIT' && styles.paymentPillActive]}
                  onPress={() => setPaymentType('CREDIT')}
                >
                  <Ionicons
                    name="card-outline"
                    size={18}
                    color={paymentType === 'CREDIT' ? '#0284c7' : '#64748b'}
                  />
                  <Text
                    style={[
                      styles.paymentPillText,
                      paymentType === 'CREDIT' && styles.paymentPillTextActive,
                    ]}
                  >
                    Full Credit (Due)
                  </Text>
                </TouchableOpacity>
              </View>

              <Input
                label="Discount Amount (৳)"
                value={discount}
                onChangeText={setDiscount}
                keyboardType="numeric"
                placeholder="0"
              />

              {/* Invoice Breakdown */}
              <View style={styles.breakdownCard}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Subtotal</Text>
                  <Text style={styles.breakdownVal}>৳{subtotal.toLocaleString()}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Discount</Text>
                  <Text style={[styles.breakdownVal, { color: '#ef4444' }]}>
                    -৳{discountAmount.toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.breakdownRow, styles.grandTotalRow]}>
                  <Text style={styles.grandTotalLabel}>Net Payable</Text>
                  <Text style={styles.grandTotalVal}>৳{grandTotal.toLocaleString()}</Text>
                </View>
              </View>

              <Button
                title={paymentType === 'CREDIT' ? 'Confirm Credit Sale' : 'Complete Cash Sale & Print'}
                onPress={handleCheckout}
                loading={submitting}
                icon="checkmark-circle-outline"
                size="lg"
                style={{ marginTop: 16, marginBottom: 20 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topControlBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cameraToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  cameraToggleBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  cameraToggleText: {
    color: '#0284c7',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  cameraToggleTextActive: {
    color: '#ffffff',
  },
  cameraContainer: {
    height: 240,
    width: '100%',
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTargetBox: {
    width: 220,
    height: 140,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#38bdf8',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scannerHint: {
    color: '#ffffff',
    marginTop: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  searchSection: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  searchButton: {
    backgroundColor: '#0284c7',
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  simulationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  simulationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d97706',
  },
  chipScroll: {
    flexDirection: 'row',
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  demoChipText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  cartSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  clearCartText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyCartContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyCartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 10,
  },
  emptyCartSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cartItemInfo: {
    flex: 1,
    paddingRight: 10,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#0284c7',
    marginTop: 2,
    fontWeight: '600',
  },
  qtyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBtn: {
    backgroundColor: '#f1f5f9',
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyNumber: {
    paddingHorizontal: 8,
    fontWeight: '700',
    fontSize: 14,
    color: '#0f172a',
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 6,
  },
  bottomFooter: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    elevation: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  footerGrandTotal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0284c7',
  },
  payButton: {
    minWidth: 160,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 4,
  },
  customerTypeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  typePill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: 8,
  },
  typePillActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  typePillText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  typePillTextActive: {
    color: '#ffffff',
  },
  selectedCustomerBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginBottom: 12,
  },
  selectedCustomerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0369a1',
  },
  selectedCustomerSub: {
    fontSize: 12,
    color: '#0284c7',
    marginTop: 2,
  },
  paymentTypeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  paymentPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginHorizontal: 4,
  },
  paymentPillActive: {
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff',
  },
  paymentPillText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  paymentPillTextActive: {
    color: '#0284c7',
    fontWeight: '700',
  },
  breakdownCard: {
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  breakdownVal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    marginTop: 6,
    paddingTop: 8,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  grandTotalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0284c7',
  },
});

