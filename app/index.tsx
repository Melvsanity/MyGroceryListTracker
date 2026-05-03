import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, Modal, TextInput,
  KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Line } from 'react-native-svg';
import { GroceryList, getLists, createList, updateList, deleteList, getListSummary } from '../database/lists';
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

type ListWithSummary = GroceryList & { count: number; total: number };

// ─── List Form Modal ──────────────────────────────────────
const ListForm = ({
  title, name, store, budget, onName, onStore, onBudget, onSave, onCancel,
}: {
  title: string; name: string; store: string; budget: string;
  onName: (v: string) => void; onStore: (v: string) => void;
  onBudget: (v: string) => void; onSave: () => void; onCancel: () => void;
}) => (
  <Pressable style={styles.overlay} onPress={onCancel}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
        <Text style={styles.modalTitle}>{title}</Text>
        <Text style={styles.label}>List Name *</Text>
        <TextInput style={styles.input} placeholder="e.g. Weekly Groceries" value={name} onChangeText={onName} />
        <Text style={styles.label}>Store (optional)</Text>
        <TextInput style={styles.input} placeholder="e.g. SM Supermarket" value={store} onChangeText={onStore} />
        <Text style={styles.label}>Budget {CURRENCY} (optional)</Text>
        <TextInput style={styles.input} placeholder="e.g. 1500" value={budget} onChangeText={onBudget} keyboardType="numeric" />
        <View style={styles.modalBtns}>
          <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modalBtn, styles.createBtn]} onPress={onSave}>
            <Text style={styles.createText}>Save</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </KeyboardAvoidingView>
  </Pressable>
);

// ─── Helpers ──────────────────────────────────────────────
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' · ' + date.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true });
};

// ─── List Card ────────────────────────────────────────────
const ListCard = ({
  item, onPress, onLongPress, selectMode, selected,
}: {
  item: ListWithSummary; onPress: () => void; onLongPress: () => void;
  selectMode: boolean; selected: boolean;
}) => (
  <TouchableOpacity
    style={[styles.card, selected && styles.cardSelected]}
    onPress={onPress} onLongPress={onLongPress} activeOpacity={0.75}
  >
    {selectMode && (
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected && <Text style={styles.checkmark}>✓</Text>}
      </View>
    )}
    <View style={{ flex: 1 }}>
      <View style={styles.cardTop}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardTotal}>{CURRENCY}{item.total.toFixed(2)}</Text>
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.cardSub}>{item.store ? `🏪 ${item.store}` : '🏪 No store set'}</Text>
        <Text style={styles.cardSub}>{item.count} item{item.count !== 1 ? 's' : ''}</Text>
      </View>
      <Text style={styles.cardDate}>📅 {formatDate(item.created_at)}</Text>
      {item.budget > 0 && (
        <View style={styles.budgetRow}>
          <Text style={[styles.budgetText, item.total > item.budget && styles.overBudget]}>
            Budget: {CURRENCY}{item.budget.toFixed(2)}{item.total > item.budget ? ' ⚠️ Over!' : ''}
          </Text>
        </View>
      )}
      {!selectMode && <Text style={styles.hint}>Long press to edit or select</Text>}
    </View>
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────
export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [lists, setLists] = useState<ListWithSummary[]>([]);
  const [createVisible, setCreateVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStore, setNewStore] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [editVisible, setEditVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<ListWithSummary | null>(null);
  const [editName, setEditName] = useState('');
  const [editStore, setEditStore] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useFocusEffect(useCallback(() => {
    loadLists();
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []));

  const loadLists = () => {
    const raw = getLists();
    setLists(raw.map((l) => ({ ...l, ...getListSummary(l.id!) })));
  };

  const enterSelectMode = (id?: number) => {
    setSelectMode(true);
    if (id !== undefined) setSelectedIds(new Set([id]));
    else setSelectedIds(new Set());
  };

  const exitSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()); };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === lists.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(lists.map((l) => l.id!)));
  };

  const handleBulkDelete = () => {
    const count = selectedIds.size;
    if (count === 0) return;
    Alert.alert('Delete Lists', `Delete ${count} list${count > 1 ? 's' : ''} and all their items? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: `Delete ${count}`, style: 'destructive', onPress: () => {
        selectedIds.forEach((id) => deleteList(id));
        exitSelectMode(); loadLists();
      }},
    ]);
  };

  const handleCardPress = (item: ListWithSummary) => {
    if (selectMode) toggleSelect(item.id!);
    else navigation.navigate('List', { listId: item.id, listName: item.name });
  };

  const handleLongPress = (item: ListWithSummary) => {
    if (selectMode) { toggleSelect(item.id!); return; }
    Alert.alert(item.name, 'What do you want to do?', [
      { text: '✏️ Edit', onPress: () => {
        setEditTarget(item); setEditName(item.name);
        setEditStore(item.store ?? '');
        setEditBudget(item.budget > 0 ? item.budget.toString() : '');
        setEditVisible(true);
      }},
      { text: '☑️ Select', onPress: () => enterSelectMode(item.id!) },
      { text: '🗑️ Delete', style: 'destructive', onPress: () => {
        Alert.alert('Delete List', `Delete "${item.name}" and all its items?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => { deleteList(item.id!); loadLists(); } },
        ]);
      }},
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) { Alert.alert('Required', 'Please enter a list name.'); return; }
    updateList(editTarget!.id!, editName.trim(), editStore.trim(), parseFloat(editBudget) || 0);
    setEditVisible(false); setEditTarget(null); loadLists();
  };

  const handleCreate = () => {
    if (!newName.trim()) { Alert.alert('Required', 'Please enter a list name.'); return; }
    createList(newName.trim(), newStore.trim(), parseFloat(newBudget) || 0);
    setNewName(''); setNewStore(''); setNewBudget('');
    setCreateVisible(false); loadLists();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {!selectMode ? (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🛒 My Lists</Text>
          <View style={styles.headerActions}>
            {lists.length > 0 && (
              <TouchableOpacity style={styles.headerIconBtn} onPress={() => enterSelectMode()}>
                <TrashIcon size={20} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.addBtn} onPress={() => setCreateVisible(true)}>
              <Text style={styles.addBtnText}>+ New</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.headerSelect}>
          <TouchableOpacity style={styles.selectCancelBtn} onPress={exitSelectMode}>
            <Text style={styles.selectCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleSelectAll}>
            <Text style={styles.selectCountText}>
              {selectedIds.size === lists.length ? 'Deselect All' : `${selectedIds.size} selected`}
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

      <FlatList
        data={lists}
        keyExtractor={(item) => item.id!.toString()}
        renderItem={({ item }) => (
          <ListCard
            item={item} selectMode={selectMode} selected={selectedIds.has(item.id!)}
            onPress={() => handleCardPress(item)} onLongPress={() => handleLongPress(item)}
          />
        )}
        contentContainerStyle={lists.length === 0 ? styles.emptyContainer : { paddingBottom: 16, paddingTop: 4 }}
        ListEmptyComponent={
          <View>
            <Text style={styles.emptyText}>No lists yet.</Text>
            <Text style={styles.emptyHint}>Tap "+ New" to get started!</Text>
          </View>
        }
      />

      <Modal visible={createVisible} transparent animationType="slide">
        <ListForm
          title="New Grocery List"
          name={newName} store={newStore} budget={newBudget}
          onName={setNewName} onStore={setNewStore} onBudget={setNewBudget}
          onSave={handleCreate}
          onCancel={() => { setCreateVisible(false); setNewName(''); setNewStore(''); setNewBudget(''); }}
        />
      </Modal>

      <Modal visible={editVisible} transparent animationType="slide">
        <ListForm
          title="Edit List"
          name={editName} store={editStore} budget={editBudget}
          onName={setEditName} onStore={setEditStore} onBudget={setEditBudget}
          onSave={handleSaveEdit}
          onCancel={() => { setEditVisible(false); setEditTarget(null); }}
        />
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container:              { flex: 1, backgroundColor: Colors.screenBg },
  header:                 { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: Colors.primary },
  headerTitle:            { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerActions:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconBtn:          { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  addBtn:                 { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  addBtnText:             { color: Colors.primary, fontWeight: 'bold', fontSize: 13 },
  headerSelect:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: Colors.selectHeader },
  selectCancelBtn:        { paddingHorizontal: 10, paddingVertical: 6 },
  selectCancelText:       { color: '#fff', fontSize: 15, fontWeight: '600' },
  selectCountText:        { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  selectDeleteBtn:        { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 },
  selectDeleteBtnDisabled:{ backgroundColor: 'rgba(255,255,255,0.35)' },
  selectDeleteText:       { color: Colors.selectHeader, fontWeight: 'bold', fontSize: 14 },
  emptyContainer:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText:              { fontSize: 18, color: Colors.textLight, marginBottom: 8 },
  emptyHint:              { fontSize: 13, color: Colors.textXLight },
  card:                   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, marginHorizontal: 12, marginTop: 10, borderRadius: 12, padding: 16, elevation: 2 },
  cardSelected:           { backgroundColor: Colors.dangerCardBg, elevation: 3, borderWidth: 1.5, borderColor: Colors.dangerCardBorder },
  cardTop:                { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cardName:               { fontSize: 16, fontWeight: 'bold', color: Colors.primaryDark, flex: 1 },
  cardTotal:              { fontSize: 16, fontWeight: 'bold', color: Colors.primary },
  cardBottom:             { flexDirection: 'row', justifyContent: 'space-between' },
  cardSub:                { fontSize: 12, color: Colors.textMuted },
  budgetRow:              { marginTop: 6 },
  budgetText:             { fontSize: 12, color: Colors.textSecondary },
  overBudget:             { color: Colors.danger, fontWeight: 'bold' },
  hint:                   { fontSize: 10, color: Colors.textXLight, marginTop: 6, textAlign: 'right' },
  cardDate:               { fontSize: 11, color: Colors.textXLight, marginTop: 5 },
  checkbox:               { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.textGhost, justifyContent: 'center', alignItems: 'center', marginRight: 14, flexShrink: 0 },
  checkboxSelected:       { backgroundColor: Colors.selectAccent, borderColor: Colors.selectAccent },
  checkmark:              { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  overlay:                { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox:               { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle:             { fontSize: 18, fontWeight: 'bold', color: Colors.primaryDark, marginBottom: 16 },
  label:                  { fontSize: 13, color: Colors.textSecondary, marginBottom: 4, marginTop: 10 },
  input:                  { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: Colors.surfaceAlt },
  modalBtns:              { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalBtn:               { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelBtn:              { backgroundColor: Colors.surfaceInput },
  cancelText:             { color: Colors.textSecondary, fontWeight: 'bold' },
  createBtn:              { backgroundColor: Colors.primary },
  createText:             { color: '#fff', fontWeight: 'bold' },
});