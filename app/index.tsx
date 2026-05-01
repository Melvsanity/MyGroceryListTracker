import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, Modal, TextInput,
  KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { GroceryList, getLists, createList, updateList, deleteList, getListSummary } from '../database/lists';

type ListWithSummary = GroceryList & { count: number; total: number };

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
        <Text style={styles.label}>Budget ₱ (optional)</Text>
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

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  }) + ' · ' + date.toLocaleTimeString('en-PH', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
};

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

  useFocusEffect(useCallback(() => { loadLists(); }, []));

  const loadLists = () => {
    const raw = getLists();
    setLists(raw.map((l) => ({ ...l, ...getListSummary(l.id!) })));
  };

  const handleCreate = () => {
    if (!newName.trim()) { Alert.alert('Required', 'Please enter a list name.'); return; }
    createList(newName.trim(), newStore.trim(), parseFloat(newBudget) || 0);
    setNewName(''); setNewStore(''); setNewBudget('');
    setCreateVisible(false);
    loadLists();
  };

  const handleLongPress = (item: ListWithSummary) => {
    Alert.alert(item.name, 'What do you want to do?', [
      {
        text: '✏️ Edit', onPress: () => {
          setEditTarget(item);
          setEditName(item.name);
          setEditStore(item.store ?? '');
          setEditBudget(item.budget > 0 ? item.budget.toString() : '');
          setEditVisible(true);
        }
      },
      {
        text: '🗑️ Delete', style: 'destructive', onPress: () => {
          Alert.alert('Delete List', `Delete "${item.name}" and all its items?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => { deleteList(item.id!); loadLists(); } },
          ]);
        }
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) { Alert.alert('Required', 'Please enter a list name.'); return; }
    updateList(editTarget!.id!, editName.trim(), editStore.trim(), parseFloat(editBudget) || 0);
    setEditVisible(false);
    setEditTarget(null);
    loadLists();
  };

  const renderItem = ({ item }: { item: ListWithSummary }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('List', { listId: item.id, listName: item.name })}
      onLongPress={() => handleLongPress(item)}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardTotal}>₱{item.total.toFixed(2)}</Text>
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.cardSub}>{item.store ? `🏪 ${item.store}` : '🏪 No store set'}</Text>
        <Text style={styles.cardSub}>{item.count} item{item.count !== 1 ? 's' : ''}</Text>
      </View>
      <Text style={styles.cardDate}>📅 {formatDate(item.created_at)}</Text>
      {item.budget > 0 && (
        <View style={styles.budgetRow}>
          <Text style={[styles.budgetText, item.total > item.budget && styles.overBudget]}>
            Budget: ₱{item.budget.toFixed(2)}{item.total > item.budget ? ' ⚠️ Over!' : ''}
          </Text>
        </View>
      )}
      <Text style={styles.hint}>Long press to edit or delete</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛒 My Lists</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setCreateVisible(true)}>
          <Text style={styles.addBtnText}>+ New List</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={lists}
        keyExtractor={(item) => item.id!.toString()}
        renderItem={renderItem}
        contentContainerStyle={lists.length === 0 ? styles.emptyContainer : { paddingBottom: 10 }}
        ListEmptyComponent={
          <View>
            <Text style={styles.emptyText}>No lists yet.</Text>
            <Text style={styles.emptyHint}>Tap "+ New List" to get started!</Text>
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

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f0f4f0' },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#2e7d32' },
  headerTitle:    { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  addBtn:         { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  addBtnText:     { color: '#2e7d32', fontWeight: 'bold', fontSize: 13 },
  card:           { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 12, borderRadius: 12, padding: 16, elevation: 2 },
  cardTop:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cardName:       { fontSize: 16, fontWeight: 'bold', color: '#1b5e20', flex: 1 },
  cardTotal:      { fontSize: 16, fontWeight: 'bold', color: '#2e7d32' },
  cardBottom:     { flexDirection: 'row', justifyContent: 'space-between' },
  cardSub:        { fontSize: 12, color: '#777' },
  budgetRow:      { marginTop: 6 },
  budgetText:     { fontSize: 12, color: '#555' },
  overBudget:     { color: '#c62828', fontWeight: 'bold' },
  hint:           { fontSize: 10, color: '#bbb', marginTop: 6, textAlign: 'right' },
  cardDate:       { fontSize: 11, color: '#bbb', marginTop: 5 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText:      { fontSize: 18, color: '#aaa', marginBottom: 8 },
  emptyHint:      { fontSize: 13, color: '#bbb' },
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox:       { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle:     { fontSize: 18, fontWeight: 'bold', color: '#1b5e20', marginBottom: 16 },
  label:          { fontSize: 13, color: '#555', marginBottom: 4, marginTop: 10 },
  input:          { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: '#fafafa' },
  modalBtns:      { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalBtn:       { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelBtn:      { backgroundColor: '#f0f0f0' },
  cancelText:     { color: '#555', fontWeight: 'bold' },
  createBtn:      { backgroundColor: '#2e7d32' },
  createText:     { color: '#fff', fontWeight: 'bold' },
});