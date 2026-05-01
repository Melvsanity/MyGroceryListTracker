import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Modal, TextInput, KeyboardAvoidingView,
  Platform, Pressable, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { GroceryItem, getItems, addItem, updateItem, updateItemPrice, toggleChecked, deleteItem } from '../database/items';
import { getLists, archiveList } from '../database/lists';
import { saveReceipt } from '../database/receipts';
import { useSuggestions } from '../hooks/useSuggestions';

const CATEGORIES = ['General', 'Produce', 'Meat', 'Dairy', 'Beverages', 'Snacks', 'Frozen', 'Household', 'Personal Care'];

const ItemRow = ({ item, editingPriceId, editingPriceVal, setEditingPriceVal, setEditingPriceId, handleToggle, handleLongPress, handlePriceConfirm }: {
  item: GroceryItem;
  editingPriceId: number | null;
  editingPriceVal: string;
  setEditingPriceVal: (v: string) => void;
  setEditingPriceId: (id: number | null) => void;
  handleToggle: (item: GroceryItem) => void;
  handleLongPress: (item: GroceryItem) => void;
  handlePriceConfirm: (id: number) => void;
}) => {
  const isEditingPrice = editingPriceId === item.id;
  return (
    <TouchableOpacity
      style={[
        styles.itemRow,
        item.checked === 1 && styles.itemRowChecked,
        item.checked === 0 && item.price === 0 && styles.itemRowNoPriceAccent,
        item.checked === 0 && item.price > 0 && styles.itemRowGreenAccent,
      ]}
      onPress={() => handleToggle(item)}
      onLongPress={() => handleLongPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, item.checked === 1 && styles.checkboxDone]}>
        {item.checked === 1 && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, item.checked === 1 && styles.itemNameDone]}>
          {item.name}
        </Text>
        <Text style={styles.itemSub}>
          {item.category} · qty {item.quantity}
          {item.checked === 0 ? '  ·  hold to edit' : '  ·  got it'}
        </Text>
        {item.notes ? <Text style={styles.itemNotes}>{item.notes}</Text> : null}
      </View>

      {isEditingPrice ? (
        <View style={styles.priceEditBox}>
          <TextInput
            style={styles.priceInput}
            value={editingPriceVal}
            onChangeText={setEditingPriceVal}
            keyboardType="numeric"
            autoFocus
            selectTextOnFocus
            onSubmitEditing={() => handlePriceConfirm(item.id!)}
            onBlur={() => handlePriceConfirm(item.id!)}
          />
          <TouchableOpacity style={styles.priceConfirmBtn} onPress={() => handlePriceConfirm(item.id!)}>
            <Text style={styles.priceConfirmText}>✓</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            setEditingPriceId(item.id!);
            setEditingPriceVal(item.price > 0 ? item.price.toString() : '');
          }}
          style={item.checked === 1 ? styles.priceChipDone : item.price > 0 ? styles.priceChipGreen : styles.priceChipAmber}
        >
          <Text style={item.checked === 1 ? styles.priceChipTextDone : item.price > 0 ? styles.priceChipTextGreen : styles.priceChipTextAmber}>
            {item.price > 0 ? `₱${(item.price * item.quantity).toFixed(2)} ✎` : 'set price ✎'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const ItemForm = ({
  title, name, price, qty, category, notes,
  onName, onPrice, onQty, onCategory, onNotes,
  onSave, onCancel, showPrice = true,
  suggestions, dismiss,
}: any) => (
  <Pressable style={styles.overlay} onPress={onCancel}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ maxHeight: '90%' }}>
      <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
        <Text style={styles.modalTitle}>{title}</Text>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
        <Text style={styles.label}>Item Name *</Text>
        <TextInput style={styles.input} placeholder="e.g. Eggs" value={name} onChangeText={onName} />

        {suggestions.length > 0 && showPrice && (
          <ScrollView style={styles.suggestBox} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {suggestions.map((s: any) => (
              <TouchableOpacity key={s.name} style={styles.suggestRow}
                onPress={() => { onName(s.name); onPrice(s.price > 0 ? s.price.toString() : ''); onCategory(s.category); dismiss(s.name); }}>
                <Text style={styles.suggestName}>{s.name}</Text>
                <Text style={styles.suggestPrice}>{s.price > 0 ? `₱${s.price.toFixed(2)}` : 'no price'}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {showPrice && (
          <View style={styles.row}>
            <View style={{ flex: 2 }}>
              <Text style={styles.label}>Price ₱</Text>
              <TextInput style={styles.input} placeholder="0.00" value={price} onChangeText={onPrice} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.label}>Qty</Text>
              <TextInput style={styles.input} placeholder="1" value={qty} onChangeText={onQty} keyboardType="numeric" />
            </View>
          </View>
        )}

        {!showPrice && (
          <View>
            <Text style={styles.label}>Qty</Text>
            <TextInput style={styles.input} placeholder="1" value={qty} onChangeText={onQty} keyboardType="numeric" />
          </View>
        )}

        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat}
              style={[styles.catChip, category === cat && styles.catChipActive]}
              onPress={() => onCategory(cat)}>
              <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput style={styles.input} placeholder="e.g. Brand preference" value={notes} onChangeText={onNotes} />

        <View style={styles.modalBtns}>
          <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modalBtn, styles.createBtn]} onPress={onSave}>
            <Text style={styles.createText}>Save</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </Pressable>
    </KeyboardAvoidingView>
  </Pressable>
);

export default function ListScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { listId, listName } = route.params;

  const [items, setItems] = useState<GroceryItem[]>([]);
  const [budget, setBudget] = useState(0);

  const [addVisible, setAddVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newCategory, setNewCategory] = useState('General');
  const [newNotes, setNewNotes] = useState('');

  const [editVisible, setEditVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<GroceryItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editCategory, setEditCategory] = useState('General');
  const [editNotes, setEditNotes] = useState('');

  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [editingPriceVal, setEditingPriceVal] = useState('');

  const { suggestions, dismiss } = useSuggestions(newName);

  const [toastVisible, setToastVisible] = useState(false);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = () => {
    setItems(getItems(listId));
    const list = getLists().find((l) => l.id === listId);
    setBudget(list?.budget ?? 0);
  };

  const unchecked = items.filter((i) => i.checked === 0);
  const checked   = items.filter((i) => i.checked === 1);
  const total     = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const overBudget = budget > 0 && total > budget;
  const budgetPct  = budget > 0 ? Math.min(total / budget, 1) : 0;

  const handleAddItem = () => {
    if (!newName.trim()) { Alert.alert('Required', 'Enter an item name.'); return; }
    addItem({ list_id: listId, name: newName.trim(), price: parseFloat(newPrice) || 0, quantity: parseInt(newQty) || 1, category: newCategory, notes: newNotes.trim(), checked: 0 });
    setNewName(''); setNewPrice(''); setNewQty('1'); setNewCategory('General'); setNewNotes('');
    setAddVisible(false);
    loadData();
  };

  const handleLongPress = (item: GroceryItem) => {
    Alert.alert(item.name, 'What do you want to do?', [
      {
        text: '✏️ Edit', onPress: () => {
          setEditTarget(item);
          setEditName(item.name);
          setEditQty(item.quantity.toString());
          setEditCategory(item.category);
          setEditNotes(item.notes);
          setEditVisible(true);
        }
      },
      {
        text: '🗑️ Delete', style: 'destructive', onPress: () =>
          Alert.alert('Remove Item', `Remove "${item.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => { deleteItem(item.id!); loadData(); } },
          ])
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) { Alert.alert('Required', 'Enter an item name.'); return; }
    updateItem({
      ...editTarget!,
      name: editName.trim(),
      quantity: parseInt(editQty) || 1,
      category: editCategory,
      notes: editNotes.trim(),
    });
    setEditVisible(false);
    setEditTarget(null);
    loadData();
  };

  const handlePriceConfirm = (id: number) => {
    const parsed = parseFloat(editingPriceVal);
    if (!isNaN(parsed) && parsed >= 0) updateItemPrice(id, parsed);
    setEditingPriceId(null);
    setEditingPriceVal('');
    loadData();
  };

  const handleToggle = (item: GroceryItem) => {
    toggleChecked(item.id!, item.checked === 0 ? 1 : 0);
    loadData();
  };

  const handleSaveReceipt = () => {
    if (items.length === 0) { Alert.alert('Empty List', 'Add items before saving a receipt.'); return; }
    Alert.alert('Save Receipt', `Save this shopping session?\nTotal: ₱${total.toFixed(2)}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Save', onPress: () => {
        saveReceipt(listId, total);
        archiveList(listId);
        setToastVisible(true);
        setTimeout(() => {
          setToastVisible(false);
          navigation.goBack();
        }, 1500);
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{listName}</Text>
        <View style={{ width: 50 }} />
      </View>

      {budget > 0 && (
        <View style={styles.budgetContainer}>
          <View style={styles.budgetTrack}>
            <View style={[styles.budgetFill, { width: `${budgetPct * 100}%` }, overBudget && styles.budgetOver]} />
          </View>
          <Text style={[styles.budgetText, overBudget && styles.budgetOverText]}>
            ₱{total.toFixed(2)} / ₱{budget.toFixed(2)}{overBudget ? ' ⚠️ Over budget!' : ''}
          </Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <ScrollView style={styles.scroll}>
          {unchecked.length === 0 && checked.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No items yet.</Text>
              <Text style={styles.emptyHint}>Tap "+ Add" to start your list.</Text>
            </View>
          )}
          {unchecked.map((item) => <ItemRow
            key={item.id}
            item={item}
            editingPriceId={editingPriceId}
            editingPriceVal={editingPriceVal}
            setEditingPriceVal={setEditingPriceVal}
            setEditingPriceId={setEditingPriceId}
            handleToggle={handleToggle}
            handleLongPress={handleLongPress}
            handlePriceConfirm={handlePriceConfirm}
          />)}
          {checked.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>✅ Got it ({checked.length})</Text>
              </View>
              {checked.map((item) => <ItemRow
                key={item.id}
                item={item}
                editingPriceId={editingPriceId}
                editingPriceVal={editingPriceVal}
                setEditingPriceVal={setEditingPriceVal}
                setEditingPriceId={setEditingPriceId}
                handleToggle={handleToggle}
                handleLongPress={handleLongPress}
                handlePriceConfirm={handlePriceConfirm}
              />)}
            </View>
          )}
          <View style={{ height: 140 }} />
        </ScrollView>

        <TouchableOpacity
          style={styles.fab}
          onPress={() => setAddVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.fabPlus}>+</Text>
          <Text style={styles.fabLabel}>Add item</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={[styles.totalAmount, overBudget && styles.totalOver]}>
            ₱{total.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveReceipt}>
          <Text style={styles.saveBtnText}>💾 Save receipt</Text>
        </TouchableOpacity>
      </View>

      {/* Success toast */}
      {toastVisible && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>✅ Receipt saved!</Text>
        </View>
      )}

      <Modal visible={addVisible} transparent animationType="slide">
        <ItemForm
          title="Add Item"
          name={newName} price={newPrice} qty={newQty} category={newCategory} notes={newNotes}
          onName={setNewName} onPrice={setNewPrice} onQty={setNewQty} onCategory={setNewCategory} onNotes={setNewNotes}
          onSave={handleAddItem}
          onCancel={() => { setAddVisible(false); setNewName(''); setNewPrice(''); setNewQty('1'); setNewCategory('General'); setNewNotes(''); }}
          showPrice={true}
          suggestions={suggestions}
          dismiss={dismiss}
        />
      </Modal>

      <Modal visible={editVisible} transparent animationType="slide">
        <ItemForm
          title="Edit Item"
          name={editName} price="" qty={editQty} category={editCategory} notes={editNotes}
          onName={setEditName} onPrice={() => {}} onQty={setEditQty} onCategory={setEditCategory} onNotes={setEditNotes}
          onSave={handleSaveEdit}
          onCancel={() => { setEditVisible(false); setEditTarget(null); }}
          showPrice={false}
          suggestions={suggestions}
          dismiss={dismiss}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#f0f4f0' },
  header:               { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#2e7d32' },
  backBtn:              { color: '#fff', fontSize: 15, fontWeight: '600' },
  headerTitle:          { color: '#fff', fontSize: 17, fontWeight: 'bold', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  budgetContainer:      { backgroundColor: '#fff', padding: 10, paddingHorizontal: 16 },
  budgetTrack:          { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 4 },
  budgetFill:           { height: 8, backgroundColor: '#4caf50', borderRadius: 4 },
  budgetOver:           { backgroundColor: '#e53935' },
  budgetText:           { fontSize: 12, color: '#555' },
  budgetOverText:       { color: '#c62828', fontWeight: 'bold' },
  scroll:               { flex: 1 },
  emptyState:           { alignItems: 'center', paddingTop: 80 },
  emptyText:            { fontSize: 18, color: '#aaa' },
  emptyHint:            { fontSize: 13, color: '#bbb', marginTop: 6 },
  itemRow:              { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12, marginTop: 8, borderRadius: 10, padding: 12, elevation: 1, borderLeftWidth: 3, borderLeftColor: '#4caf50' },
  itemRowChecked:       { opacity: 0.65, backgroundColor: '#f9f9f9', borderLeftColor: '#ccc' },
  itemRowGreenAccent:   { borderLeftColor: '#4caf50' },
  itemRowNoPriceAccent: { borderLeftColor: '#ffd54f' },
  priceChipGreen:       { backgroundColor: '#e8f5e9', borderRadius: 6, paddingVertical: 5, paddingHorizontal: 8, borderWidth: 0.5, borderColor: '#a5d6a7' },
  priceChipAmber:       { backgroundColor: '#fff8e1', borderRadius: 6, paddingVertical: 5, paddingHorizontal: 8, borderWidth: 0.5, borderColor: '#ffe082' },
  priceChipDone:        { backgroundColor: '#f5f5f5', borderRadius: 6, paddingVertical: 5, paddingHorizontal: 8 },
  priceChipTextGreen:   { fontSize: 13, fontWeight: 'bold', color: '#2e7d32' },
  priceChipTextAmber:   { fontSize: 12, fontWeight: 'bold', color: '#b8860b' },
  priceChipTextDone:    { fontSize: 13, color: '#bbb', textDecorationLine: 'line-through' },
  checkbox:             { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#4caf50', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkboxDone:         { backgroundColor: '#4caf50', borderColor: '#4caf50' },
  checkmark:            { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  itemInfo:             { flex: 1 },
  itemName:             { fontSize: 15, fontWeight: '600', color: '#1b5e20' },
  itemNameDone:         { textDecorationLine: 'line-through', color: '#999' },
  itemSub:              { fontSize: 11, color: '#888', marginTop: 2 },
  itemNotes:            { fontSize: 11, color: '#aaa', fontStyle: 'italic' },
  priceEditBox:         { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceInput:           { borderWidth: 1, borderColor: '#4caf50', borderRadius: 6, padding: 4, paddingHorizontal: 8, fontSize: 14, minWidth: 70, textAlign: 'right', color: '#1b5e20' },
  priceConfirmBtn:      { backgroundColor: '#4caf50', borderRadius: 6, padding: 6 },
  priceConfirmText:     { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  sectionHeader:        { marginHorizontal: 12, marginTop: 16, marginBottom: 4 },
  sectionTitle:         { fontSize: 13, fontWeight: 'bold', color: '#777', textTransform: 'uppercase', letterSpacing: 0.5 },
  footer:               { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', elevation: 8 },
  totalLabel:           { fontSize: 12, color: '#888' },
  totalAmount:          { fontSize: 22, fontWeight: 'bold', color: '#1b5e20' },
  totalOver:            { color: '#c62828' },
  saveBtn:              { backgroundColor: '#2e7d32', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24 },
  saveBtnText:          { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  fab:                  { position: 'absolute', bottom: 10, right: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#2e7d32', borderRadius: 28, paddingVertical: 10, paddingHorizontal: 20, gap: 8, elevation: 6, zIndex: 10 },
  fabPlus:              { color: '#fff', fontSize: 24, lineHeight: 24, fontWeight: 'bold' },
  fabLabel:             { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  overlay:              { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox:             { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle:           { fontSize: 18, fontWeight: 'bold', color: '#1b5e20', marginBottom: 12 },
  label:                { fontSize: 13, color: '#555', marginBottom: 4, marginTop: 8 },
  input:                { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: '#fafafa' },
  row:                  { flexDirection: 'row' },
  catChip:              { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 8 },
  catChipActive:        { backgroundColor: '#2e7d32' },
  catChipText:          { fontSize: 12, color: '#555' },
  catChipTextActive:    { color: '#fff' },
  modalBtns:            { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalBtn:             { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelBtn:            { backgroundColor: '#f0f0f0' },
  cancelText:           { color: '#555', fontWeight: 'bold' },
  createBtn:            { backgroundColor: '#2e7d32' },
  createText:           { color: '#fff', fontWeight: 'bold' },
  suggestBox:           { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginTop: 2, marginBottom: 4, maxHeight: 132, overflow: 'hidden' },
  suggestRow:           { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  suggestName:          { fontSize: 14, color: '#1b5e20' },
  suggestPrice:         { fontSize: 13, color: '#888' },
  toast:                { position: 'absolute', top: 100, alignSelf: 'center', backgroundColor: '#1b5e20', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, elevation: 10, zIndex: 99 },
  toastText:            { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});