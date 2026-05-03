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
import { useBudget } from '../hooks/useBudget';
import { Colors, CATEGORIES, CURRENCY } from '../constants';

// ─── Item Row ─────────────────────────────────────────────
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
            {item.price > 0 ? `${CURRENCY}${(item.price * item.quantity).toFixed(2)} ✎` : 'set price ✎'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

// ─── Item Form ────────────────────────────────────────────
const ItemForm = ({
  title, name, price, qty, category, notes,
  onName, onPrice, onQty, onCategory, onNotes,
  onSave, onCancel, showPrice = true,
  suggestions, dismiss, permanentDismiss,
}: any) => (
  <Pressable style={styles.overlay} onPress={onCancel}>
    {Platform.OS === 'ios' ? (
      <KeyboardAvoidingView behavior="padding" style={{ maxHeight: '90%' }}>
        <ItemFormContent
          title={title} name={name} price={price} qty={qty} category={category} notes={notes}
          onName={onName} onPrice={onPrice} onQty={onQty} onCategory={onCategory} onNotes={onNotes}
          onSave={onSave} onCancel={onCancel} showPrice={showPrice}
          suggestions={suggestions} dismiss={dismiss} permanentDismiss={permanentDismiss}
        />
      </KeyboardAvoidingView>
    ) : (
      <View style={{ maxHeight: '90%' }}>
        <ItemFormContent
          title={title} name={name} price={price} qty={qty} category={category} notes={notes}
          onName={onName} onPrice={onPrice} onQty={onQty} onCategory={onCategory} onNotes={onNotes}
          onSave={onSave} onCancel={onCancel} showPrice={showPrice}
          suggestions={suggestions} dismiss={dismiss} permanentDismiss={permanentDismiss}
        />
      </View>
    )}
  </Pressable>
);

const ItemFormContent = ({
  title, name, price, qty, category, notes,
  onName, onPrice, onQty, onCategory, onNotes,
  onSave, onCancel, showPrice,
  suggestions, dismiss, permanentDismiss,
}: any) => (
  <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
    <Text style={styles.modalTitle}>{title}</Text>
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
      <Text style={styles.label}>Item Name *</Text>
      <TextInput style={styles.input} placeholder="e.g. Eggs" value={name} onChangeText={onName} />

      {suggestions.length > 0 && showPrice && (
        <ScrollView style={styles.suggestBox} nestedScrollEnabled keyboardShouldPersistTaps="handled">
          {suggestions.map((s: any) => (
            <View key={s.name} style={styles.suggestRow}>
              <TouchableOpacity
                style={styles.suggestMain}
                onPress={() => { onName(s.name); onPrice(s.price > 0 ? s.price.toString() : ''); onCategory(s.category); dismiss(s.name); }}
              >
                <Text style={styles.suggestName}>{s.name}</Text>
                <Text style={styles.suggestPrice}>{s.price > 0 ? `${CURRENCY}${s.price.toFixed(2)}` : 'no price'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.suggestDismissBtn}
                onPress={() => permanentDismiss(s.name)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.suggestDismissText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {showPrice && (
        <View style={styles.row}>
          <View style={{ flex: 2 }}>
            <Text style={styles.label}>Price {CURRENCY}</Text>
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
);

// ─── Main Screen ──────────────────────────────────────────
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
  const [toastVisible, setToastVisible] = useState(false);

  const { suggestions, dismiss, permanentDismiss } = useSuggestions(newName);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = () => {
    setItems(getItems(listId));
    const list = getLists().find((l) => l.id === listId);
    setBudget(list?.budget ?? 0);
  };

  const unchecked = items.filter((i) => i.checked === 0);
  const checked   = items.filter((i) => i.checked === 1);
  const { total, overBudget, budgetPct } = useBudget(items, budget);

  const handleAddItem = () => {
    if (!newName.trim()) { Alert.alert('Required', 'Enter an item name.'); return; }
    addItem({ list_id: listId, name: newName.trim(), price: parseFloat(newPrice) || 0, quantity: parseInt(newQty) || 1, category: newCategory, notes: newNotes.trim(), checked: 0 });
    setNewName(''); setNewPrice(''); setNewQty('1'); setNewCategory('General'); setNewNotes('');
    setAddVisible(false);
    loadData();
  };

  const handleLongPress = (item: GroceryItem) => {
    Alert.alert(item.name, 'What do you want to do?', [
      { text: '✏️ Edit', onPress: () => {
        setEditTarget(item); setEditName(item.name);
        setEditQty(item.quantity.toString()); setEditCategory(item.category); setEditNotes(item.notes);
        setEditVisible(true);
      }},
      { text: '🗑️ Delete', style: 'destructive', onPress: () =>
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
    updateItem({ ...editTarget!, name: editName.trim(), quantity: parseInt(editQty) || 1, category: editCategory, notes: editNotes.trim() });
    setEditVisible(false); setEditTarget(null); loadData();
  };

  const handlePriceConfirm = (id: number) => {
    const parsed = parseFloat(editingPriceVal);
    if (!isNaN(parsed) && parsed >= 0) updateItemPrice(id, parsed);
    setEditingPriceId(null); setEditingPriceVal(''); loadData();
  };

  const handleToggle = (item: GroceryItem) => {
    toggleChecked(item.id!, item.checked === 0 ? 1 : 0); loadData();
  };

  const handleSaveReceipt = () => {
    if (items.length === 0) { Alert.alert('Empty List', 'Add items before saving a receipt.'); return; }
    Alert.alert('Save Receipt', `Save this shopping session?\nTotal: ${CURRENCY}${total.toFixed(2)}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Save', onPress: () => {
        saveReceipt(listId, total);
        archiveList(listId);
        setToastVisible(true);
        setTimeout(() => { setToastVisible(false); navigation.goBack(); }, 1500);
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
            {CURRENCY}{total.toFixed(2)} / {CURRENCY}{budget.toFixed(2)}{overBudget ? ' ⚠️ Over budget!' : ''}
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
          {unchecked.map((item) => (
            <ItemRow key={item.id} item={item}
              editingPriceId={editingPriceId} editingPriceVal={editingPriceVal}
              setEditingPriceVal={setEditingPriceVal} setEditingPriceId={setEditingPriceId}
              handleToggle={handleToggle} handleLongPress={handleLongPress} handlePriceConfirm={handlePriceConfirm}
            />
          ))}
          {checked.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>✅ Got it ({checked.length})</Text>
              </View>
              {checked.map((item) => (
                <ItemRow key={item.id} item={item}
                  editingPriceId={editingPriceId} editingPriceVal={editingPriceVal}
                  setEditingPriceVal={setEditingPriceVal} setEditingPriceId={setEditingPriceId}
                  handleToggle={handleToggle} handleLongPress={handleLongPress} handlePriceConfirm={handlePriceConfirm}
                />
              ))}
            </View>
          )}
          <View style={{ height: 140 }} />
        </ScrollView>

        <TouchableOpacity style={styles.fab} onPress={() => setAddVisible(true)} activeOpacity={0.85}>
          <Text style={styles.fabPlus}>+</Text>
          <Text style={styles.fabLabel}>Add item</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={[styles.totalAmount, overBudget && styles.totalOver]}>
            {CURRENCY}{total.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveReceipt}>
          <Text style={styles.saveBtnText}>💾 Save receipt</Text>
        </TouchableOpacity>
      </View>

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
          showPrice={true} suggestions={suggestions} dismiss={dismiss} permanentDismiss={permanentDismiss}
        />
      </Modal>

      <Modal visible={editVisible} transparent animationType="slide">
        <ItemForm
          title="Edit Item"
          name={editName} price="" qty={editQty} category={editCategory} notes={editNotes}
          onName={setEditName} onPrice={() => {}} onQty={setEditQty} onCategory={setEditCategory} onNotes={setEditNotes}
          onSave={handleSaveEdit}
          onCancel={() => { setEditVisible(false); setEditTarget(null); }}
          showPrice={false} suggestions={suggestions} dismiss={dismiss} permanentDismiss={permanentDismiss}
        />
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: Colors.screenBg },
  header:               { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: Colors.primary },
  backBtn:              { color: '#fff', fontSize: 15, fontWeight: '600' },
  headerTitle:          { color: '#fff', fontSize: 17, fontWeight: 'bold', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  budgetContainer:      { backgroundColor: Colors.surface, padding: 10, paddingHorizontal: 16 },
  budgetTrack:          { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 4 },
  budgetFill:           { height: 8, backgroundColor: Colors.primaryMedium, borderRadius: 4 },
  budgetOver:           { backgroundColor: Colors.selectAccent },
  budgetText:           { fontSize: 12, color: Colors.textSecondary },
  budgetOverText:       { color: Colors.danger, fontWeight: 'bold' },
  scroll:               { flex: 1 },
  emptyState:           { alignItems: 'center', paddingTop: 80 },
  emptyText:            { fontSize: 18, color: Colors.textLight },
  emptyHint:            { fontSize: 13, color: Colors.textXLight, marginTop: 6 },
  itemRow:              { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, marginHorizontal: 12, marginTop: 8, borderRadius: 10, padding: 12, elevation: 1, borderLeftWidth: 3, borderLeftColor: Colors.primaryMedium },
  itemRowChecked:       { opacity: 0.65, backgroundColor: '#f9f9f9', borderLeftColor: Colors.textGhost },
  itemRowGreenAccent:   { borderLeftColor: Colors.primaryMedium },
  itemRowNoPriceAccent: { borderLeftColor: Colors.amberAccent },
  priceChipGreen:       { backgroundColor: Colors.primaryXLight, borderRadius: 6, paddingVertical: 5, paddingHorizontal: 8, borderWidth: 0.5, borderColor: Colors.primaryLight },
  priceChipAmber:       { backgroundColor: Colors.amberBg, borderRadius: 6, paddingVertical: 5, paddingHorizontal: 8, borderWidth: 0.5, borderColor: Colors.amberBorder },
  priceChipDone:        { backgroundColor: Colors.surfaceMuted, borderRadius: 6, paddingVertical: 5, paddingHorizontal: 8 },
  priceChipTextGreen:   { fontSize: 13, fontWeight: 'bold', color: Colors.primary },
  priceChipTextAmber:   { fontSize: 12, fontWeight: 'bold', color: Colors.amberText },
  priceChipTextDone:    { fontSize: 13, color: Colors.textXLight, textDecorationLine: 'line-through' },
  checkbox:             { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.primaryMedium, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkboxDone:         { backgroundColor: Colors.primaryMedium, borderColor: Colors.primaryMedium },
  checkmark:            { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  itemInfo:             { flex: 1 },
  itemName:             { fontSize: 15, fontWeight: '600', color: Colors.primaryDark },
  itemNameDone:         { textDecorationLine: 'line-through', color: '#999' },
  itemSub:              { fontSize: 11, color: Colors.textHint, marginTop: 2 },
  itemNotes:            { fontSize: 11, color: Colors.textLight, fontStyle: 'italic' },
  priceEditBox:         { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceInput:           { borderWidth: 1, borderColor: Colors.primaryMedium, borderRadius: 6, padding: 4, paddingHorizontal: 8, fontSize: 14, minWidth: 70, textAlign: 'right', color: Colors.primaryDark },
  priceConfirmBtn:      { backgroundColor: Colors.primaryMedium, borderRadius: 6, padding: 6 },
  priceConfirmText:     { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  sectionHeader:        { marginHorizontal: 12, marginTop: 16, marginBottom: 4 },
  sectionTitle:         { fontSize: 13, fontWeight: 'bold', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  footer:               { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.borderLight, elevation: 8 },
  totalLabel:           { fontSize: 12, color: Colors.textHint },
  totalAmount:          { fontSize: 22, fontWeight: 'bold', color: Colors.primaryDark },
  totalOver:            { color: Colors.danger },
  saveBtn:              { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24 },
  saveBtnText:          { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  fab:                  { position: 'absolute', bottom: 10, right: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, borderRadius: 28, paddingVertical: 10, paddingHorizontal: 20, gap: 8, elevation: 6, zIndex: 10 },
  fabPlus:              { color: '#fff', fontSize: 24, lineHeight: 24, fontWeight: 'bold' },
  fabLabel:             { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  overlay:              { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox:             { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle:           { fontSize: 18, fontWeight: 'bold', color: Colors.primaryDark, marginBottom: 12 },
  label:                { fontSize: 13, color: Colors.textSecondary, marginBottom: 4, marginTop: 8 },
  input:                { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: Colors.surfaceAlt },
  row:                  { flexDirection: 'row' },
  catChip:              { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.surfaceInput, marginRight: 8 },
  catChipActive:        { backgroundColor: Colors.primary },
  catChipText:          { fontSize: 12, color: Colors.textSecondary },
  catChipTextActive:    { color: '#fff' },
  modalBtns:            { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalBtn:             { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelBtn:            { backgroundColor: Colors.surfaceInput },
  cancelText:           { color: Colors.textSecondary, fontWeight: 'bold' },
  createBtn:            { backgroundColor: Colors.primary },
  createText:           { color: '#fff', fontWeight: 'bold' },
  suggestBox:           { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, marginTop: 2, marginBottom: 4, maxHeight: 132, overflow: 'hidden' },
  suggestRow:           { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.borderMuted },
  suggestMain:          { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 },
  suggestName:          { fontSize: 14, color: Colors.primaryDark },
  suggestPrice:         { fontSize: 13, color: Colors.textHint },
  suggestDismissBtn:    { paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center', alignItems: 'center' },
  suggestDismissText:   { fontSize: 13, color: Colors.textXLight, fontWeight: 'bold' },
  toast:                { position: 'absolute', top: 100, alignSelf: 'center', backgroundColor: Colors.primaryDark, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, elevation: 10, zIndex: 99 },
  toastText:            { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});