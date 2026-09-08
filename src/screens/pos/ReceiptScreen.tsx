import React from 'react';
import { View, Text, StyleSheet, ScrollView, Share, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';

export const ReceiptScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const sale = route.params?.sale || {};

  const handleShare = async () => {
    try {
      const itemsText = (sale.items || [])
        .map(
          (i: any) =>
            `- ${i.product?.name || i.productName || 'Item'} x${i.quantity}: ৳${Number(i.lineTotal || i.subtotal || 0).toLocaleString()}`
        )
        .join('\n');

      const message = `
==============================
   INVENTORY POS - CASH MEMO   
==============================
Invoice: ${sale.referenceNumber || sale.invoiceNo || 'INV'}
Date: ${new Date(sale.createdAt || Date.now()).toLocaleString()}
Customer: ${sale.customerName || 'Walk-in Customer'}
Phone: ${sale.customerPhone || 'N/A'}

ITEMS:
${itemsText}

------------------------------
Subtotal: ৳${Number(sale.totalAmount || 0).toLocaleString()}
Discount: ৳${Number(sale.discount || 0).toLocaleString()}
Grand Total: ৳${Number(sale.netAmount || sale.totalAmount || 0).toLocaleString()}
Paid Amount: ৳${Number(sale.paidAmount || 0).toLocaleString()}
Due Amount: ৳${Number(sale.dueAmount || 0).toLocaleString()}
Payment Status: ${sale.dueAmount > 0 ? 'DUE' : 'PAID'}
==============================
Thank you for your business!
`;
      await Share.share({ message });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Header Icon */}
        <View style={styles.successIconBox}>
          <Ionicons name="checkmark-circle" size={60} color="#10b981" />
          <Text style={styles.successTitle}>Payment Completed</Text>
          <Text style={styles.successSub}>Sale invoice registered in inventory system</Text>
        </View>

        {/* Paper Receipt Card */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <Text style={styles.storeTitle}>SMART INVENTORY POS</Text>
            <Text style={styles.invoiceNo}>Invoice #{sale.referenceNumber || sale.invoiceNo || 'N/A'}</Text>
            <Text style={styles.timestamp}>
              {new Date(sale.createdAt || Date.now()).toLocaleString()}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Customer Meta */}
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Customer:</Text>
            <Text style={styles.metaVal}>{sale.customerName || 'Walk-in Customer'}</Text>
          </View>
          {sale.customerPhone ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Phone:</Text>
              <Text style={styles.metaVal}>{sale.customerPhone}</Text>
            </View>
          ) : null}
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Status:</Text>
            <Badge
              label={Number(sale.dueAmount || 0) > 0 ? 'Due Pending' : 'Paid in Full'}
              variant={Number(sale.dueAmount || 0) > 0 ? 'warning' : 'success'}
            />
          </View>

          <View style={styles.divider} />

          {/* Items Table */}
          <Text style={styles.tableHeader}>ITEMS SOLD</Text>
          {(sale.items || []).map((item: any, idx: number) => (
            <View key={item.id || idx} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>
                  {item.product?.name || item.productName || 'Product Item'}
                </Text>
                <Text style={styles.itemSub}>
                  ৳{Number(item.unitPrice || 0).toLocaleString()} × {item.quantity}
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                ৳{Number(item.lineTotal || item.subtotal || 0).toLocaleString()}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          {/* Pricing Calculation */}
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Subtotal</Text>
            <Text style={styles.calcVal}>৳{Number(sale.totalAmount || 0).toLocaleString()}</Text>
          </View>
          {Number(sale.discount || 0) > 0 ? (
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Discount</Text>
              <Text style={[styles.calcVal, { color: '#ef4444' }]}>
                -৳{Number(sale.discount || 0).toLocaleString()}
              </Text>
            </View>
          ) : null}
          <View style={[styles.calcRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Net Amount</Text>
            <Text style={styles.grandTotalVal}>
              ৳{Number(sale.netAmount || sale.totalAmount || 0).toLocaleString()}
            </Text>
          </View>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Paid Amount</Text>
            <Text style={styles.calcVal}>৳{Number(sale.paidAmount || 0).toLocaleString()}</Text>
          </View>
          {Number(sale.dueAmount || 0) > 0 ? (
            <View style={styles.calcRow}>
              <Text style={[styles.calcLabel, { color: '#dc2626', fontWeight: '700' }]}>Due Amount</Text>
              <Text style={[styles.calcVal, { color: '#dc2626', fontWeight: '700' }]}>
                ৳{Number(sale.dueAmount || 0).toLocaleString()}
              </Text>
            </View>
          ) : null}

          {/* Barcode bottom aesthetic */}
          <View style={styles.barcodeAesthetic}>
            <Ionicons name="barcode" size={40} color="#64748b" />
            <Text style={styles.thankYou}>Thank you for your visit!</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Button
            title="Share Cash Memo"
            variant="outline"
            onPress={handleShare}
            icon="share-social-outline"
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            title="Next Sale"
            variant="primary"
            onPress={() => navigation.navigate('POS')}
            icon="add-circle-outline"
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  successIconBox: {
    alignItems: 'center',
    marginVertical: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
  },
  successSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  receiptCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  receiptHeader: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  storeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 1,
  },
  invoiceNo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284c7',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  tableHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  itemSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  calcLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  calcVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    marginTop: 6,
    paddingTop: 8,
    marginBottom: 4,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  grandTotalVal: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0284c7',
  },
  barcodeAesthetic: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  thankYou: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 20,
  },
});

