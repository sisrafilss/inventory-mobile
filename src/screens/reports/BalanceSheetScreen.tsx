import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';

export const BalanceSheetScreen = () => {
  const [filterType, setFilterType] = useState<'today' | 'this_month' | 'all_time'>('this_month');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBalanceSheet = useCallback(async () => {
    try {
      let startDate: string | undefined;
      let endDate: string | undefined;

      const now = new Date();
      if (filterType === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        endDate = now.toISOString();
      } else if (filterType === 'this_month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        endDate = now.toISOString();
      }

      const res = await apiClient.get('/reports/balance-sheet', {
        params: { startDate, endDate },
      });
      setData(res.data?.data || res.data);
    } catch (e) {
      console.warn('Failed to load balance sheet:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterType]);

  useEffect(() => {
    setLoading(true);
    fetchBalanceSheet();
  }, [fetchBalanceSheet]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBalanceSheet();
  };

  const handleShare = async () => {
    if (!data) return;
    const p = data.particulars || {};
    const s = data.summary || {};
    const message = `
========================================
       COMMERCIAL BALANCE SHEET
========================================
Store: ${data.storeInfo?.storeName || 'Smart Inventory'}
Date: ${new Date().toLocaleDateString()}
Filter: ${filterType.toUpperCase()}

TRADING ACCOUNT (DEBIT / CREDIT)
----------------------------------------
(-) Previous Stock:    ৳${Number(p.previousStock || 0).toLocaleString()}
(-) Total Purchases:   ৳${Number(p.totalPurchase || 0).toLocaleString()}
(+) Total Sales:       ৳${Number(p.totalSale || 0).toLocaleString()}
(+) Present Stock:     ৳${Number(p.presentStock || 0).toLocaleString()}
----------------------------------------
Trading Outcome:       ${p.isProfit ? 'PROFIT' : 'LOSS'}: ৳${Number(p.profit || p.loss || 0).toLocaleString()}
Balanced Total:        ৳${Number(p.balancedTotal || 0).toLocaleString()}

EXECUTIVE SUMMARY
----------------------------------------
Gross Profit:          ৳${Number(s.grossProfit || 0).toLocaleString()}
Operating Expenses:    ৳${Number(s.operatingExpenses || 0).toLocaleString()}
Net Operating Income:  ৳${Number(s.netOperatingIncome || 0).toLocaleString()}
Customer Receivables:  ৳${Number(s.accountsReceivable || 0).toLocaleString()}
Supplier Payables:     ৳${Number(s.accountsPayable || 0).toLocaleString()}
Working Capital:       ৳${Number(s.netWorkingCapital || 0).toLocaleString()}
========================================
`;
    await Share.share({ message });
  };

  const p = data?.particulars || {
    previousStock: 0,
    totalPurchase: 0,
    totalSale: 0,
    presentStock: 0,
    profit: 0,
    loss: 0,
    isProfit: true,
    balancedTotal: 0,
  };

  const s = data?.summary || {
    revenue: 0,
    cogs: 0,
    grossProfit: 0,
    operatingExpenses: 0,
    netOperatingIncome: 0,
    accountsReceivable: 0,
    accountsPayable: 0,
    inventoryValuation: 0,
    netWorkingCapital: 0,
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
    >
      {/* Header Filter & Share Bar */}
      <View style={styles.topFilterBar}>
        <View style={styles.filterPills}>
          <TouchableOpacity
            style={[styles.filterPill, filterType === 'today' && styles.filterPillActive]}
            onPress={() => setFilterType('today')}
          >
            <Text style={[styles.filterText, filterType === 'today' && styles.filterTextActive]}>
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filterType === 'this_month' && styles.filterPillActive]}
            onPress={() => setFilterType('this_month')}
          >
            <Text style={[styles.filterText, filterType === 'this_month' && styles.filterTextActive]}>
              This Month
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filterType === 'all_time' && styles.filterPillActive]}
            onPress={() => setFilterType('all_time')}
          >
            <Text style={[styles.filterText, filterType === 'all_time' && styles.filterTextActive]}>
              All Time
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-social" size={18} color="#0284c7" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0284c7" style={{ marginVertical: 40 }} />
      ) : (
        <>
          {/* Main Profit / Loss Banner */}
          <View
            style={[
              styles.statusBanner,
              { backgroundColor: p.isProfit ? '#ecfdf5' : '#fef2f2', borderColor: p.isProfit ? '#a7f3d0' : '#fecaca' },
            ]}
          >
            <Ionicons
              name={p.isProfit ? 'trending-up' : 'trending-down'}
              size={32}
              color={p.isProfit ? '#10b981' : '#ef4444'}
            />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.statusBannerLabel, { color: p.isProfit ? '#065f46' : '#991b1b' }]}>
                Trading Account {p.isProfit ? 'Net Profit' : 'Net Loss'}
              </Text>
              <Text style={[styles.statusBannerAmount, { color: p.isProfit ? '#047857' : '#dc2626' }]}>
                ৳{Number(p.isProfit ? p.profit : p.loss).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Trading Account Ledger Card */}
          <Card style={styles.ledgerCard}>
            <Text style={styles.ledgerHeaderTitle}>TRADING ACCOUNT LEDGER</Text>
            <Text style={styles.ledgerSubtitle}>Debit (Purchases & Opening) vs Credit (Sales & Closing)</Text>

            <View style={styles.ledgerGrid}>
              {/* Debit Side */}
              <View style={[styles.ledgerCol, styles.debitCol]}>
                <Text style={styles.colTitle}>DEBIT (খরচ / মজুদ)</Text>

                <View style={styles.ledgerItem}>
                  <Text style={styles.itemTitle}>Previous Stock</Text>
                  <Text style={styles.itemSubtitle}>Opening valuation</Text>
                  <Text style={styles.itemVal}>৳{Number(p.previousStock).toLocaleString()}</Text>
                </View>

                <View style={styles.ledgerItem}>
                  <Text style={styles.itemTitle}>Total Purchases</Text>
                  <Text style={styles.itemSubtitle}>Procurement costs</Text>
                  <Text style={styles.itemVal}>৳{Number(p.totalPurchase).toLocaleString()}</Text>
                </View>

                {p.isProfit ? (
                  <View style={[styles.ledgerItem, styles.profitItem]}>
                    <Text style={[styles.itemTitle, { color: '#059669' }]}>Trading Profit</Text>
                    <Text style={styles.itemSubtitle}>Credit - Debit</Text>
                    <Text style={[styles.itemVal, { color: '#059669' }]}>
                      ৳{Number(p.profit).toLocaleString()}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Credit Side */}
              <View style={[styles.ledgerCol, styles.creditCol]}>
                <Text style={styles.colTitle}>CREDIT (আয় / অবশিষ্ট)</Text>

                <View style={styles.ledgerItem}>
                  <Text style={styles.itemTitle}>Total Sales</Text>
                  <Text style={styles.itemSubtitle}>Revenue realized</Text>
                  <Text style={styles.itemVal}>৳{Number(p.totalSale).toLocaleString()}</Text>
                </View>

                <View style={styles.ledgerItem}>
                  <Text style={styles.itemTitle}>Present Stock</Text>
                  <Text style={styles.itemSubtitle}>Closing inventory</Text>
                  <Text style={styles.itemVal}>৳{Number(p.presentStock).toLocaleString()}</Text>
                </View>

                {!p.isProfit ? (
                  <View style={[styles.ledgerItem, styles.lossItem]}>
                    <Text style={[styles.itemTitle, { color: '#dc2626' }]}>Trading Loss</Text>
                    <Text style={styles.itemSubtitle}>Debit - Credit</Text>
                    <Text style={[styles.itemVal, { color: '#dc2626' }]}>
                      ৳{Number(p.loss).toLocaleString()}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Balanced Total Footer */}
            <View style={styles.balancedRow}>
              <Text style={styles.balancedLabel}>Balanced Total (সমতা মূল্য):</Text>
              <Text style={styles.balancedVal}>৳{Number(p.balancedTotal).toLocaleString()}</Text>
            </View>
          </Card>

          {/* Key Financial KPIs */}
          <Card>
            <Text style={styles.sectionHeading}>Financial Health & Operations</Text>

            <View style={styles.kpiRow}>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiItemLabel}>Gross Profit</Text>
                <Text style={[styles.kpiItemVal, { color: '#0284c7' }]}>
                  ৳{Number(s.grossProfit).toLocaleString()}
                </Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiItemLabel}>Operating Expenses</Text>
                <Text style={[styles.kpiItemVal, { color: '#ef4444' }]}>
                  ৳{Number(s.operatingExpenses).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.kpiRow}>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiItemLabel}>Net Operating Income</Text>
                <Text
                  style={[
                    styles.kpiItemVal,
                    { color: Number(s.netOperatingIncome) >= 0 ? '#10b981' : '#dc2626' },
                  ]}
                >
                  ৳{Number(s.netOperatingIncome).toLocaleString()}
                </Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiItemLabel}>Net Working Capital</Text>
                <Text style={[styles.kpiItemVal, { color: '#6366f1' }]}>
                  ৳{Number(s.netWorkingCapital).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.kpiRow}>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiItemLabel}>Customer Dues (Receivable)</Text>
                <Text style={styles.kpiItemVal}>
                  ৳{Number(s.accountsReceivable).toLocaleString()}
                </Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiItemLabel}>Supplier Dues (Payable)</Text>
                <Text style={styles.kpiItemVal}>
                  ৳{Number(s.accountsPayable).toLocaleString()}
                </Text>
              </View>
            </View>
          </Card>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterPills: {
    flexDirection: 'row',
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  filterPillActive: {
    backgroundColor: '#0284c7',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  shareBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusBannerLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusBannerAmount: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  ledgerCard: {
    padding: 16,
  },
  ledgerHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  ledgerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 12,
  },
  ledgerGrid: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  ledgerCol: {
    flex: 1,
    padding: 10,
  },
  debitCol: {
    backgroundColor: '#fffbeb',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  creditCol: {
    backgroundColor: '#f0fdf4',
  },
  colTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    textAlign: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    marginBottom: 6,
  },
  ledgerItem: {
    marginVertical: 4,
  },
  profitItem: {
    backgroundColor: '#ecfdf5',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  lossItem: {
    backgroundColor: '#fef2f2',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  itemSubtitle: {
    fontSize: 10,
    color: '#64748b',
  },
  itemVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  balancedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  balancedLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  balancedVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0284c7',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  kpiItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  kpiItemLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  kpiItemVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
});

