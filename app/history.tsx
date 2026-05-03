import React, { useState, useCallback } from 'react';
import {
  View, Text, SectionList, TouchableOpacity,
  StyleSheet, Alert, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Svg, { Path, Line } from 'react-native-svg';
import { getAllReceipts, getReceiptWithItems, deleteReceipt, Receipt } from '../database/receipts';
import { GroceryItem, addItem } from '../database/items';
import { createList } from '../database/lists';
import { Colors, CURRENCY } from '../constants';

// ─── Trash Icon ───────────────────────────────────────────
const TrashIcon = ({ size = 20, color = '#fff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="4" y1="7" x2="20" y2="7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <Line x1="9" y1="7" x2="9" y2="4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <Line x1="15" y1="7" x2="15" y2="4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <Line x1="9" y1="4" x2="15" y2="4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <Path d="M5 7l1.2 12.2A1 1 0 007.2 20h9.6a1 1 0 001-.8L19 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="10" y1="11" x2="10" y2="16" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <Line x1="14" y1="11" x2="14" y2="16" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </Svg>
);

// ─── Helpers ──────────────────────────────────────────────
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })
  );
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
  receipt, onTap, onLongPress, selectMode, selected,
}: {
  receipt: Receipt; onTap: () => void; onLongPress: () => void;
  selectMode: boolean; selected: boolean;
}) => (
  <TouchableOpacity
    style={[styles.card, selected && styles.cardSelected]}
    onPress={onTap} onLongPress={onLongPress} activeOpacity={0.75}
  >
    {selectMode && (
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected && <Text style={styles.checkmark}>✓</Text>}
      </View>
    )}
    <View style={{ flex: 1 }}>
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardName} numberOfLines={1}>{receipt.name}</Text>
          <Text style={styles.cardStore}>{receipt.store ? `🏪 ${receipt.store}` : '🏪 No store set'}</Text>
          <Text style={styles.cardDate}>{formatDate(receipt.saved_at)}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.cardTotal}>{CURRENCY}{receipt.total.toFixed(2)}</Text>
          <Text style={styles.cardCount}>{receipt.item_count ?? 0} items</Text>
        </View>
      </View>
      {!selectMode && <Text style={styles.cardHint}>tap to view · hold to select</Text>}
    </View>
  </TouchableOpacity>
);

// ─── Receipt Detail Modal ──────────────────────────────────
const ReceiptModal = ({
  visible, receiptId, onClose, onDelete, onReuse,
}: {
  visible: boolean; receiptId: number | null; onClose: () => void;
  onDelete: (id: number) => void;
  onReuse: (receipt: Receipt & { budget: number }, items: GroceryItem[]) => void;
}) => {
  const [data, setData] = useState<{ receipt: Receipt & { budget: number }; items: GroceryItem[] } | null>(null);

  React.useEffect(() => {
    if (visible && receiptId !== null) {
      try {
        const result = getReceiptWithItems(receiptId);
        if (result && result.receipt) setData(result);
      } catch (e) { console.warn('Failed to load receipt', e); }
    } else { setData(null); }
  }, [visible, receiptId]);

  if (!visible || !data) return null;
  const { receipt, items } = data;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.modalSheet}>

          {/* Fixed header */}
          <View style={styles.modalHeader}>
            <View style={styles.handle} />
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalStoreName}>
                  {receipt.store ? receipt.store.toUpperCase() : 'MY GROCERY LIST'}
                </Text>
                <Text style={styles.modalListName} numberOfLines={1}>{receipt.name}</Text>
                <Text style={styles.modalDate}>{formatDate(receipt.saved_at)}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
          </View>

          {/* Scrollable items */}
          <ScrollView
            style={styles.itemsScroll}
            contentContainerStyle={styles.itemsScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={true}
            scrollEventThrottle={16}
          >
            <View style={styles.receiptColHeader}>
              <Text style={styles.receiptColItem}>ITEM</Text>
              <Text style={styles.receiptColPrice}>AMOUNT</Text>
            </View>
            {items.map((item: GroceryItem) => (
              <View key={item.id} style={styles.receiptRow}>
                <Text style={styles.receiptItemName} numberOfLines={1}>
                  {dots(`${item.name} x${item.quantity}`)}
                </Text>
                <Text style={styles.receiptItemPrice}>
                  {item.price > 0 ? `${CURRENCY}${(item.price * item.quantity).toFixed(2)}` : '—'}
                </Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.receiptRow}>
              <Text style={styles.receiptTotalLabel}>TOTAL</Text>
              <Text style={styles.receiptTotalAmount}>{CURRENCY}{receipt.total.toFixed(2)}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptMeta}>Items</Text>
              <Text style={styles.receiptMeta}>{items.length}</Text>
            </View>
            {receipt.budget > 0 && (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptMeta}>Budget</Text>
                <Text style={[styles.receiptMeta, receipt.total > receipt.budget && { color: Colors.danger }]}>
                  {CURRENCY}{receipt.budget.toFixed(2)}{receipt.total > receipt.budget ? ' ⚠️' : ''}
                </Text>
              </View>
            )}
            <View style={styles.divider} />
            <Text style={styles.receiptThankYou}>*** THANK YOU ***</Text>
            <Text style={styles.receiptAppName}>MyGroceryListTracker</Text>
          </ScrollView>

          {/* Fixed footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.footerBtnClose} onPress={onClose}>
              <Text style={styles.footerBtnCloseText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerBtnReuse} onPress={() => onReuse(receipt, items)}>
              <Text style={styles.footerBtnReuseText}>♻️ Reuse</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerBtnDelete} onPress={() => { if (receipt.id !== undefined) onDelete(receipt.id); }}>
              <View style={styles.footerBtnDeleteInner}>
                <TrashIcon size={15} color={Colors.danger} />
                <Text style={styles.footerBtnDeleteText}> Delete</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────
export default function HistoryScreen() {
  const navigation = useNavigation<any>();
  const [sections, setSections] = useState<{ title: string; data: Receipt[] }[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useFocusEffect(useCallback(() => {
    loadReceipts();
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []));

  const loadReceipts = () => {
    const all = getAllReceipts();
    const groups: Record<string, Receipt[]> = {};
    all.forEach((r) => {
      const key = getMonthGroup(r.saved_at);
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    setSections(Object.entries(groups).map(([title, data]) => ({ title, data })));
  };

  const totalCount = sections.reduce((acc, s) => acc + s.data.length, 0);
  const enterSelectMode = (id?: number) => { setSelectMode(true); if (id !== undefined) setSelectedIds(new Set([id])); };
  const exitSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()); };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const toggleSelectSection = (sectionData: Receipt[]) => {
    const ids = sectionData.map((r) => r.id!).filter(Boolean);
    const allSelected = ids.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) { ids.forEach((id) => next.delete(id)); }
      else { ids.forEach((id) => next.add(id)); }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allIds = sections.flatMap((s) => s.data.map((r) => r.id!)).filter(Boolean);
    if (selectedIds.size === totalCount) setSelectedIds(new Set());
    else setSelectedIds(new Set(allIds));
  };

  const handleBulkDelete = () => {
    const count = selectedIds.size;
    if (count === 0) return;
    Alert.alert('Delete Receipts', `Delete ${count} receipt${count > 1 ? 's' : ''}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: `Delete ${count}`, style: 'destructive', onPress: () => {
        selectedIds.forEach((id) => deleteReceipt(id));
        exitSelectMode(); loadReceipts();
      }},
    ]);
  };

  const closeModal = () => { setModalVisible(false); setSelectedId(null); };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Receipt', 'Delete this receipt?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteReceipt(id); closeModal(); loadReceipts(); } },
    ]);
  };

  const handleReuse = (receipt: Receipt & { budget: number }, items: GroceryItem[]) => {
    Alert.alert('♻️ Reuse as New List', `Create a new list based on "${receipt.name}" with ${items.length} items?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Create', onPress: () => {
        const newListId = createList(receipt.name ?? 'Reused List', receipt.store ?? '', receipt.budget ?? 0);
        items.forEach((item) => addItem({ list_id: newListId, name: item.name, price: item.price, quantity: item.quantity, category: item.category, notes: item.notes, checked: 0 }));
        closeModal();
        navigation.navigate('List', { listId: newListId, listName: receipt.name ?? 'Reused List' });
      }},
    ]);
  };

  const handleCardTap = (item: Receipt) => {
    if (selectMode) toggleSelect(item.id!);
    else { setSelectedId(item.id!); setModalVisible(true); }
  };

  const handleCardLongPress = (item: Receipt) => {
    if (!selectMode) enterSelectMode(item.id!);
    else toggleSelect(item.id!);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {!selectMode ? (
        <View style={styles.header}>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>🧾 Receipt History</Text>
            <Text style={styles.headerSub}>{totalCount} receipts saved</Text>
          </View>
          {totalCount > 0 && (
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => enterSelectMode()}>
              <TrashIcon size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.headerSelect}>
          <TouchableOpacity style={styles.selectCancelBtn} onPress={exitSelectMode}>
            <Text style={styles.selectCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleSelectAll}>
            <Text style={styles.selectCountText}>
              {selectedIds.size === totalCount ? 'Deselect All' : `${selectedIds.size} selected`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.selectDeleteBtn, selectedIds.size === 0 && styles.selectDeleteBtnDisabled]}
            onPress={handleBulkDelete} disabled={selectedIds.size === 0}
          >
            <Text style={styles.selectDeleteText}>Delete{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}</Text>
          </TouchableOpacity>
        </View>
      )}

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
          contentContainerStyle={{ paddingBottom: 24 }}
          renderSectionHeader={({ section }) => {
            const ids = section.data.map((r) => r.id!).filter(Boolean);
            const allSectionSelected = ids.length > 0 && ids.every((id) => selectedIds.has(id));
            return (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {selectMode && (
                  <TouchableOpacity onPress={() => toggleSelectSection(section.data)}>
                    <Text style={styles.sectionSelectAll}>{allSectionSelected ? 'Deselect all' : 'Select all'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
          renderItem={({ item }) => (
            <ReceiptCard
              receipt={item} selectMode={selectMode} selected={selectedIds.has(item.id!)}
              onTap={() => handleCardTap(item)} onLongPress={() => handleCardLongPress(item)}
            />
          )}
        />
      )}

      <ReceiptModal visible={modalVisible} receiptId={selectedId} onClose={closeModal} onDelete={handleDelete} onReuse={handleReuse} />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: Colors.screenBg },
  header:               { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.primary },
  headerCenter:         { flex: 1, alignItems: 'flex-start' },
  headerTitle:          { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSub:            { fontSize: 12, color: Colors.primaryLight, marginTop: 2 },
  headerIconBtn:        { position: 'absolute', right: 16, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerSelect:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: Colors.selectHeader },
  selectCancelBtn:      { paddingHorizontal: 10, paddingVertical: 6 },
  selectCancelText:     { color: '#fff', fontSize: 15, fontWeight: '600' },
  selectCountText:      { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  selectDeleteBtn:      { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 },
  selectDeleteBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.35)' },
  selectDeleteText:     { color: Colors.selectHeader, fontWeight: 'bold', fontSize: 14 },
  emptyState:           { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyEmoji:           { fontSize: 48 },
  emptyTitle:           { fontSize: 18, fontWeight: 'bold', color: Colors.textLight },
  emptySub:             { fontSize: 13, color: Colors.textXLight },
  sectionHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
  sectionTitle:         { fontSize: 11, fontWeight: 'bold', color: Colors.textHint, textTransform: 'uppercase', letterSpacing: 1 },
  sectionSelectAll:     { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  card:                 { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, marginHorizontal: 12, marginBottom: 8, borderRadius: 12, padding: 14, elevation: 1, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  cardSelected:         { backgroundColor: Colors.dangerCardBg, borderLeftColor: Colors.selectAccent, elevation: 2 },
  cardTop:              { flexDirection: 'row', justifyContent: 'space-between' },
  cardLeft:             { flex: 1, marginRight: 8 },
  cardRight:            { alignItems: 'flex-end' },
  cardName:             { fontSize: 15, fontWeight: 'bold', color: Colors.primaryDark },
  cardStore:            { fontSize: 12, color: Colors.textHint, marginTop: 2 },
  cardDate:             { fontSize: 11, color: Colors.textXLight, marginTop: 4 },
  cardTotal:            { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
  cardCount:            { fontSize: 11, color: Colors.textXLight, marginTop: 2 },
  cardHint:             { fontSize: 10, color: Colors.textGhost, marginTop: 8, textAlign: 'right' },
  checkbox:             { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.textGhost, justifyContent: 'center', alignItems: 'center', marginRight: 12, flexShrink: 0 },
  checkboxSelected:     { backgroundColor: Colors.selectAccent, borderColor: Colors.selectAccent },
  checkmark:            { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  overlay:              { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  backdrop:             { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  modalSheet:           { backgroundColor: Colors.surfaceModal, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%', overflow: 'hidden' },
  modalHeader:          { backgroundColor: Colors.surfaceModal, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 0 },
  handle:               { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  modalHeaderRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  modalHeaderText:      { flex: 1, marginRight: 12, alignItems: 'center' },
  modalStoreName:       { fontFamily: 'monospace', fontSize: 15, fontWeight: 'bold', color: Colors.primaryDark, letterSpacing: 1, textAlign: 'center' },
  modalListName:        { fontFamily: 'monospace', fontSize: 12, color: Colors.textHint, marginTop: 2, textAlign: 'center' },
  modalDate:            { fontFamily: 'monospace', fontSize: 11, color: Colors.textLight, marginTop: 2, textAlign: 'center' },
  closeBtn:             { backgroundColor: Colors.closeBtnBg, borderRadius: 16, width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  closeBtnText:         { fontSize: 14, color: Colors.textSecondary, fontWeight: 'bold' },
  itemsScroll:          { backgroundColor: Colors.surface, marginHorizontal: 12, borderRadius: 8, marginBottom: 8, flexGrow: 0 },
  itemsScrollContent:   { paddingHorizontal: 16, paddingBottom: 16 },
  receiptColHeader:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderMuted },
  receiptColItem:       { fontFamily: 'monospace', fontSize: 10, color: Colors.textLight, letterSpacing: 1 },
  receiptColPrice:      { fontFamily: 'monospace', fontSize: 10, color: Colors.textLight, letterSpacing: 1 },
  receiptRow:           { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  receiptItemName:      { fontFamily: 'monospace', fontSize: 12, color: Colors.textSecondary, flex: 1 },
  receiptItemPrice:     { fontFamily: 'monospace', fontSize: 12, color: Colors.textSecondary, marginLeft: 8 },
  receiptTotalLabel:    { fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold', color: Colors.textPrimary },
  receiptTotalAmount:   { fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold', color: Colors.textPrimary },
  receiptMeta:          { fontFamily: 'monospace', fontSize: 11, color: Colors.textHint },
  receiptThankYou:      { fontFamily: 'monospace', fontSize: 11, color: Colors.textXLight, textAlign: 'center', letterSpacing: 1, marginTop: 4 },
  receiptAppName:       { fontFamily: 'monospace', fontSize: 10, color: Colors.textGhost, textAlign: 'center', marginTop: 4, marginBottom: 8 },
  divider:              { borderTopWidth: 1, borderStyle: 'dashed', borderColor: Colors.textGhost, marginVertical: 8 },
  modalFooter:          { flexDirection: 'row', gap: 8, padding: 12, paddingBottom: 20, backgroundColor: Colors.surfaceModal, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  footerBtnClose:       { flex: 1, backgroundColor: Colors.primaryXLight, paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 0.5, borderColor: Colors.primaryBorder },
  footerBtnCloseText:   { color: Colors.primary, fontWeight: 'bold', fontSize: 13 },
  footerBtnReuse:       { flex: 1.2, backgroundColor: Colors.infoBg, paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 0.5, borderColor: Colors.infoBorder },
  footerBtnReuseText:   { color: Colors.infoText, fontWeight: 'bold', fontSize: 13 },
  footerBtnDelete:      { flex: 1, backgroundColor: Colors.dangerBg, paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 0.5, borderColor: Colors.dangerBorder },
  footerBtnDeleteInner: { flexDirection: 'row', alignItems: 'center' },
  footerBtnDeleteText:  { color: Colors.danger, fontWeight: 'bold', fontSize: 13 },
});