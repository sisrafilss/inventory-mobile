import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { apiClient } from '../../api/client';
import { Badge } from '../../components/Badge';
import { Card } from '../../components/Card';

export const ProductDetailScreen = () => {
  const route = useRoute<any>();
  const initialProduct = route.params?.product;
  const [product, setProduct] = useState(initialProduct);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialProduct?.id) {
      const loadFullDetails = async () => {
        setLoading(true);
        try {
          const res = await apiClient.get(`/products/${initialProduct.id}`);
          setProduct(res.data?.data || res.data);
        } catch (e) {
          console.warn('Failed to load full product info:', e);
        } finally {
          setLoading(false);
        }
      };
      loadFullDetails();
    }
  }, [initialProduct?.id]);

  if (!product) {
    return (
      <View style={styles.center}>
        <Text>Product information not found.</Text>
      </View>
    );
  }

  const cost = Number(product.costPrice || 0);
  const selling = Number(product.sellingPrice || 0);
  const margin = cost > 0 ? (((selling - cost) / cost) * 100).toFixed(1) : '0.0';
  const warehouseStocks = product.warehouseStocks || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {loading ? (
        <ActivityIndicator size="small" color="#0284c7" style={{ marginBottom: 12 }} />
      ) : null}

      {/* Main Info Card */}
      <Card style={styles.mainCard}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.categoryText}>
          {product.category?.name || 'General Category'}
        </Text>

        <View style={styles.badgeRow}>
          <Badge
            label={product.quantity > 0 ? 'Active & In Stock' : 'Out of Stock'}
            variant={product.quantity > 0 ? 'success' : 'danger'}
            size="md"
          />
          {product.unit ? (
            <Badge label={`Unit: ${product.unit}`} variant="info" size="md" />
          ) : null}
        </View>

        <View style={styles.divider} />

        {/* Identifiers */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>SKU Code</Text>
          <Text style={styles.infoValue}>{product.sku || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Barcode (EAN/UPC)</Text>
          <Text style={styles.infoValue}>{product.barcode || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Reorder Alert Level</Text>
          <Text style={styles.infoValue}>{product.reorderLevel || 10} units</Text>
        </View>
      </Card>

      {/* Pricing & Profit Margin */}
      <Card>
        <Text style={styles.sectionTitle}>Financials & Margin</Text>
        <View style={styles.priceGrid}>
          <View style={styles.priceBox}>
            <Text style={styles.priceBoxLabel}>Cost Price</Text>
            <Text style={styles.priceBoxVal}>৳{cost.toLocaleString()}</Text>
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.priceBoxLabel}>Selling Price</Text>
            <Text style={[styles.priceBoxVal, { color: '#0284c7' }]}>৳{selling.toLocaleString()}</Text>
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.priceBoxLabel}>Gross Margin</Text>
            <Text style={[styles.priceBoxVal, { color: '#10b981' }]}>+{margin}%</Text>
          </View>
        </View>
      </Card>

      {/* Warehouse Inventory Breakdown */}
      <Card>
        <Text style={styles.sectionTitle}>Warehouse Stock Breakdown</Text>
        {warehouseStocks.length === 0 ? (
          <View style={styles.warehouseRow}>
            <Ionicons name="business-outline" size={18} color="#64748b" style={{ marginRight: 8 }} />
            <Text style={styles.warehouseName}>Main Warehouse</Text>
            <Text style={styles.warehouseStock}>{product.quantity} {product.unit || 'units'}</Text>
          </View>
        ) : (
          warehouseStocks.map((w: any, idx: number) => (
            <View key={w.warehouseId || idx} style={styles.warehouseRow}>
              <Ionicons name="business-outline" size={18} color="#64748b" style={{ marginRight: 8 }} />
              <Text style={styles.warehouseName}>{w.warehouse?.name || w.warehouseName || 'Warehouse'}</Text>
              <Text style={styles.warehouseStock}>{w.stock || w.quantity} {product.unit || 'units'}</Text>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingVertical: 12,
    paddingBottom: 30,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCard: {
    padding: 18,
  },
  productName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 26,
  },
  categoryText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  priceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceBox: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    marginHorizontal: 4,
  },
  priceBoxLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  priceBoxVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  warehouseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  warehouseName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  warehouseStock: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0284c7',
  },
});

