import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

export const InventoryScreen = () => {
  const [movements, setMovements] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Stock Adjustment Modal
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [productCodeOrSku, setProductCodeOrSku] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [adjustType, setAdjustType] = useState<
    'RESTOCK' | 'DAMAGE' | 'LOSS' | 'RETURN' | 'CORRECTION'
  >('RESTOCK');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchingProduct, setSearchingProduct] = useState(false);

  const fetchInventoryData = useCallback(async () => {
    try {
      const [overviewRes, historyRes] = await Promise.all([
        apiClient.get('/inventory/overview').catch(() => ({ data: null })),
        apiClient.get('/inventory/history', { params: { limit: 30 } }),
      ]);

      if (overviewRes?.data?.data) {
        setOverview(overviewRes.data.data);
      }
      const list = historyRes.data?.data?.movements || historyRes.data?.data || [];
      setMovements(list);
    } catch (e) {
      console.warn('Failed to load inventory movements:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventoryData();
  };

  const handleLookupProduct = async () => {
    if (!productCodeOrSku.trim()) return;
    setSearchingProduct(true);
    try {
      const res = await apiClient.get(`/products/by-code/${productCodeOrSku.trim()}`);
      const prod = res.data?.data || res.data;
      if (!prod || !prod.id) {
        Alert.alert('Not Found', 'No product found with this barcode or SKU.');
        return;
      }
      setSelectedProduct(prod);
    } catch (e: any) {
      Alert.alert('Lookup Error', e.message || 'Product not found');
    } finally {
      setSearchingProduct(false);
    }
  };

  const handleSaveAdjustment = async () => {
    if (!selectedProduct) {
      Alert.alert('Missing Product', 'Please lookup and select a product first.');
      return;
    }
    const qtyNum = parseInt(adjustQty, 10);
    if (isNaN(qtyNum) || qtyNum === 0) {
      Alert.alert('Invalid Quantity', 'Please enter a non-zero whole number quantity.');
      return;
    }
    if (!adjustReason.trim()) {
      Alert.alert('Reason Required', 'Please enter an audit reason/note.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/inventory/adjustments', {
        productId: selectedProduct.id,
        type: adjustType,
        quantity: qtyNum,
        reason: adjustReason.trim(),
      });

      Alert.alert('Success', 'Stock adjustment registered successfully');
      setAdjustModalVisible(false);
      setSelectedProduct(null);
      setProductCodeOrSku('');
      setAdjustQty('');
      setAdjustReason('');
      fetchInventoryData();
    } catch (e: any) {
      Alert.alert('Adjustment Failed', e.message || 'Could not record adjustment');
    } finally {
      setSubmitting(false);
    }
  };

  const getMovementVariant = (type: string) => {
    switch (type) {
      case 'RESTOCK':
      case 'PURCHASE':
      case 'RETURN':
        return 'success';
      case 'DAMAGE':
      case 'LOSS':
        return 'danger';
      case 'SALE':
        return 'info';
      default:
        return 'neutral';
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Banner with Adjustment Action */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.headerTitle}>Warehouse Inventory</Text>
          <Text style={styles.headerSubtitle}>Real-time stock ledger & movements</Text>
        </View>
        <TouchableOpacity
          style={styles.adjustBtn}
          onPress={() => setAdjustModalVisible(true)}
        >
          <Ionicons name="swap-vertical" size={16} color="#ffffff" style={{ marginRight: 4 }} />
          <Text style={styles.adjustBtnText}>Adjust Stock</Text>
        </TouchableOpacity>
      </View>

      {/* Movements FlatList */}
      {loading ? (
        <ActivityIndicator size="large" color="#0284c7" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={movements}
          keyExtractor={(item, index) => item.id || index.toString()}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const isPositive = Number(item.quantityChange) > 0;
            return (
              <Card style={styles.movementCard}>
                <View style={styles.movementRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.movementProductName}>
                      {item.product?.name || item.productName || 'Stock Item'}
                    </Text>
                    <Text style={styles.movementSku}>
                      SKU: {item.product?.sku || 'N/A'} • By: {item.performedBy?.name || 'Staff'}
                    </Text>
                    {item.notes || item.reason ? (
                      <Text style={styles.movementNote}>
                        Note: {item.notes || item.reason}
                      </Text>
                    ) : null}
                    <Text style={styles.movementTime}>
                      {new Date(item.createdAt).toLocaleString()}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={[
                        styles.movementQty,
                        { color: isPositive ? '#10b981' : '#ef4444' },
                      ]}
                    >
                      {isPositive ? `+${item.quantityChange}` : item.quantityChange}
                    </Text>
                    <Badge
                      label={item.type?.toLowerCase() || 'movement'}
                      variant={getMovementVariant(item.type)}
                    />
                  </View>
                </View>
              </Card>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="swap-horizontal-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No stock movements logged yet</Text>
            </View>
          }
        />
      )}

      {/* Stock Adjustment Modal */}
      <Modal
        visible={adjustModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAdjustModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Stock Adjustment</Text>
              <TouchableOpacity onPress={() => setAdjustModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Product Lookup */}
              <Text style={styles.inputLabel}>Scan or Enter Barcode / SKU</Text>
              <View style={styles.lookupRow}>
                <Input
                  placeholder="e.g. 8941100500010"
                  value={productCodeOrSku}
                  onChangeText={setProductCodeOrSku}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Find"
                  onPress={handleLookupProduct}
                  loading={searchingProduct}
                  size="sm"
                  style={{ marginLeft: 8, height: 44 }}
                />
              </View>

              {selectedProduct ? (
                <View style={styles.selectedProductCard}>
                  <Text style={styles.selectedProdName}>{selectedProduct.name}</Text>
                  <Text style={styles.selectedProdStock}>
                    Current Stock: {selectedProduct.quantity} {selectedProduct.unit || 'units'}
                  </Text>
                </View>
              ) : null}

              {/* Movement Type */}
              <Text style={styles.inputLabel}>Adjustment Type</Text>
              <View style={styles.typeRow}>
                {(['RESTOCK', 'DAMAGE', 'LOSS', 'RETURN', 'CORRECTION'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typePill, adjustType === t && styles.typePillActive]}
                    onPress={() => setAdjustType(t)}
                  >
                    <Text
                      style={[styles.typePillText, adjustType === t && styles.typePillTextActive]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label="Quantity (+ to add, - to deduct)"
                placeholder="e.g. 10 or -5"
                value={adjustQty}
                onChangeText={setAdjustQty}
                keyboardType="numeric"
              />

              <Input
                label="Reason / Notes *"
                placeholder="e.g. Shelf damage or restock from supplier"
                value={adjustReason}
                onChangeText={setAdjustReason}
              />

              <Button
                title="Confirm Stock Adjustment"
                onPress={handleSaveAdjustment}
                loading={submitting}
                icon="checkmark-circle-outline"
                size="lg"
                style={{ marginTop: 14, marginBottom: 10 }}
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  adjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  adjustBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  listContainer: {
    paddingVertical: 10,
    paddingBottom: 30,
  },
  movementCard: {
    marginVertical: 4,
    padding: 12,
  },
  movementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  movementProductName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  movementSku: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  movementNote: {
    fontSize: 11,
    color: '#0284c7',
    marginTop: 2,
    fontStyle: 'italic',
  },
  movementTime: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 3,
  },
  movementQty: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  },
  lookupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedProductCard: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginBottom: 12,
  },
  selectedProdName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0369a1',
  },
  selectedProdStock: {
    fontSize: 12,
    color: '#0284c7',
    marginTop: 2,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  typePill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typePillActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  typePillTextActive: {
    color: '#ffffff',
  },
});

