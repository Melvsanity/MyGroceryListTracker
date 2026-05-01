import React, { useState, useCallback } from 'react';
import {
  View, Text, SectionList, TouchableOpacity,
  StyleSheet, Alert, Modal, ScrollView, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getAllReceipts, getReceiptWithItems, deleteReceipt, Receipt } from '../database/receipts';
import { GroceryItem } from '../database/items';

// ─── Helpers ──────────────────────────────────────────────
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const getMonthGroup = (dateStr?: string): string => {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
};

const dots = (name: string, maxLen: number = 24): string => {
  if (name.length >= maxLen) return name.substring(0, maxLen - 1);
  return name + '.'.repeat(maxLen - name.length);
};

// ─── Receipt Card ──────────────────────────────────────────
const ReceiptCard = ({
  receipt, onTap, onLongPress,
}: { receipt: Receipt; onTap: () => void; onLongPress: () => void }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={onTap}
    onLongPress={onLongPress}
    activeOpacity={0.75}
  >
    <View style={styles.cardTop}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardName} numberOfLines={1}>{receipt.name}</Text>
        <Text style={styles.cardStore}>
          {receipt.store ? `🏪 ${receipt.store}` : '🏪 No store set'}
        </Text>
        <Text style={styles.cardDate}>{formatDate(receipt.saved_at)}</Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardTotal}>₱{receipt.total.toFixed(2)}</Text>
        <Text style={styles.cardCount}>{receipt.item_count ?? 0} items</Text>
      </View>
    </View>
    <Text style={styles.cardHint}>tap to view · hold to delete</Text>
  </TouchableOpacity>
);

// ─── Receipt Detail Modal ──────────────────────────────────
const ReceiptModal = ({
  visible, receiptId, onClose, onDelete,
}: {
  visible: boolean;
  receiptId: number | null;
  onClose: () => void;
  onDelete: (id: number) => void;
}) => {
  const [data, setData] = useState<{ receipt: Receipt & { budget: number }; items: GroceryItem[] } | null>(null);

  React.useEffect(() => {
    if (visible && receiptId !== null) {
      try {
        const result = getReceiptWithItems(receiptId);
        if (result && result.receipt) setData(result);
      } catch (e) {
        console.warn('Failed to load receipt', e);
      }
    } else {
      setData(null);
    }
  }, [visible, receiptId]);

  if (!data) return null;
  const { receipt, items } = data;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>

          {/* Modal handle */}
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* Receipt paper */}
            <View style={styles.receiptPaper}>

              {/* Header */}
              <Text style={styles.receiptStore}>
                {receipt.store ? receipt.store.toUpperCase() : 'MY GROCERY LIST'}
              </Text>
              <Text style={styles.receiptListName}>{receipt.name}</Text>
              <Text style={styles.receiptDate}>{formatDate(receipt.saved_at)}</Text>

              <View style={styles.divider} />

              {/* Items */}
              {items.map((item: GroceryItem) => (
                <View key={item.id} style={styles.receiptRow}>
                  <Text style={styles.receiptItemName} numberOfLines={1}>
                    {dots(`${item.name} x${item.quantity}`)}
                  </Text>
                  <Text style={styles.receiptItemPrice}>
                    {item.price > 0 ? `₱${(item.price * item.quantity).toFixed(2)}` : '—'}
                  </Text>
                </View>
              ))}

              <View style={styles.divider} />

              {/* Totals */}
              <View style={styles.receiptRow}>
                <Text style={styles.receiptTotalLabel}>TOTAL</Text>
                <Text style={styles.receiptTotalAmount}>₱{receipt.total.toFixed(2)}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptMeta}>Items</Text>
                <Text style={styles.receiptMeta}>{items.length}</Text>
              </View>
              {receipt.budget > 0 && (
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptMeta}>Budget</Text>
                  <Text style={[
                    styles.receiptMeta,
                    receipt.total > receipt.budget && { color: '#c62828' }
                  ]}>
                    ₱{receipt.budget.toFixed(2)}
                    {receipt.total > receipt.budget ? ' ⚠️' : ''}
                  </Text>
                </View>
              )}

              <View style={styles.divider} />

              <Text style={styles.receiptThankYou}>*** THANK YOU ***</Text>
              <Text style={styles.receiptAppName}>MyGroceryListTracker</Text>
            </View>

            {/* Delete button */}
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => { if (receipt.id !== undefined) onDelete(receipt.id); }}
            >
              <Text style={styles.deleteBtnText}>🗑️ Delete Receipt</Text>
            </TouchableOpacity>

            <View style={{ height: 24 }} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────
export default function HistoryScreen() {
  const [sections, setSections] = useState<{ title: string; data: Receipt[] }[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(useCallback(() => { loadReceipts(); }, []));

  const loadReceipts = () => {
    const all = getAllReceipts();
    // Group by month
    const groups: Record<string, Receipt[]> = {};
    all.forEach((r) => {
      const key = getMonthGroup(r.saved_at);
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    setSections(Object.entries(groups).map(([title, data]) => ({ title, data })));
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Receipt', 'Are you sure you want to delete this receipt?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          deleteReceipt(id);
          setModalVisible(false);
          setSelectedId(null);
          loadReceipts();
        }
      },
    ]);
  };

  const handleLongPress = (id: number) => {
    Alert.alert('Delete Receipt', 'Delete this receipt?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          deleteReceipt(id);
          loadReceipts();
        }
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🧾 Receipt History</Text>
        <Text style={styles.headerSub}>
          {sections.reduce((acc, s) => acc + s.data.length, 0)} receipts saved
        </Text>
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🧾</Text>
          <Text style={styles.emptyTitle}>No receipts yet</Text>
          <Text style={styles.emptySub}>Save a shopping session to see it here.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id?.toString() ?? ''}
          contentContainerStyle={{ paddingBottom: 16 }}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <ReceiptCard
              receipt={item}
              onTap={() => { if (item.id !== undefined) { setSelectedId(item.id); setModalVisible(true); } }}
              onLongPress={() => { if (item.id !== undefined) handleLongPress(item.id); }}
            />
          )}
        />
      )}

      <ReceiptModal
        visible={modalVisible}
        receiptId={selectedId}
        onClose={() => { setModalVisible(false); setSelectedId(null); }}
        onDelete={handleDelete}
      />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#f0f4f0' },
  header:             { padding: 16, backgroundColor: '#2e7d32' },
  headerTitle:        { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSub:          { fontSize: 12, color: '#a5d6a7', marginTop: 2 },
  emptyState:         { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyEmoji:         { fontSize: 48 },
  emptyTitle:         { fontSize: 18, fontWeight: 'bold', color: '#aaa' },
  emptySub:           { fontSize: 13, color: '#bbb' },
  sectionHeader:      { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
  sectionTitle:       { fontSize: 11, fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: 1 },
  card:               { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 8, borderRadius: 12, padding: 14, elevation: 1, borderLeftWidth: 3, borderLeftColor: '#2e7d32' },
  cardTop:            { flexDirection: 'row', justifyContent: 'space-between' },
  cardLeft:           { flex: 1, marginRight: 8 },
  cardRight:          { alignItems: 'flex-end' },
  cardName:           { fontSize: 15, fontWeight: 'bold', color: '#1b5e20' },
  cardStore:          { fontSize: 12, color: '#888', marginTop: 2 },
  cardDate:           { fontSize: 11, color: '#bbb', marginTop: 4 },
  cardTotal:          { fontSize: 18, fontWeight: 'bold', color: '#2e7d32' },
  cardCount:          { fontSize: 11, color: '#bbb', marginTop: 2 },
  cardHint:           { fontSize: 10, color: '#ccc', marginTop: 8, textAlign: 'right' },
  overlay:            { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:         { backgroundColor: '#f5f5f0', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '90%' },
  handle:             { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  receiptPaper:       { backgroundColor: '#fff', borderRadius: 4, padding: 20, marginBottom: 16, borderWidth: 0.5, borderColor: '#e0e0e0' },
  receiptStore:       { fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold', color: '#1b5e20', textAlign: 'center', letterSpacing: 1 },
  receiptListName:    { fontFamily: 'monospace', fontSize: 12, color: '#888', textAlign: 'center', marginTop: 2 },
  receiptDate:        { fontFamily: 'monospace', fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 2 },
  divider:            { borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#ccc', marginVertical: 10 },
  receiptRow:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  receiptItemName:    { fontFamily: 'monospace', fontSize: 12, color: '#333', flex: 1 },
  receiptItemPrice:   { fontFamily: 'monospace', fontSize: 12, color: '#333', marginLeft: 8 },
  receiptTotalLabel:  { fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold', color: '#111' },
  receiptTotalAmount: { fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold', color: '#111' },
  receiptMeta:        { fontFamily: 'monospace', fontSize: 11, color: '#888' },
  receiptThankYou:    { fontFamily: 'monospace', fontSize: 11, color: '#bbb', textAlign: 'center', letterSpacing: 1, marginTop: 4 },
  receiptAppName:     { fontFamily: 'monospace', fontSize: 10, color: '#ccc', textAlign: 'center', marginTop: 4 },
  deleteBtn:          { backgroundColor: '#ffebee', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 0.5, borderColor: '#ffcdd2' },
  deleteBtnText:      { color: '#c62828', fontWeight: 'bold', fontSize: 14 },
});
