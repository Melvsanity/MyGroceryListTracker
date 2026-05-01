import db from './db';

export interface GroceryList {
  id?: number;
  name: string;
  store: string;
  budget: number;
  created_at?: string;
}

export const getLists = (): GroceryList[] => {
  return db.getAllSync(
    `SELECT * FROM lists WHERE archived = 0 ORDER BY created_at DESC`
  ) as GroceryList[];
};

export const archiveList = (id: number): void => {
  db.runSync(`UPDATE lists SET archived = 1 WHERE id = ?`, [id]);
};

export const createList = (name: string, store: string, budget: number): number => {
  const result = db.runSync(
    `INSERT INTO lists (name, store, budget) VALUES (?, ?, ?)`,
    [name, store, budget]
  );
  return result.lastInsertRowId;
};

export const updateList = (id: number, name: string, store: string, budget: number): void => {
  db.runSync(
    `UPDATE lists SET name=?, store=?, budget=? WHERE id=?`,
    [name, store, budget, id]
  );
};

export const deleteList = (id: number): void => {
  db.runSync(`DELETE FROM lists WHERE id=?`, [id]);
};

export const getListSummary = (listId: number): { count: number; total: number } => {
  const row = db.getFirstSync(
    `SELECT COUNT(*) as count, COALESCE(SUM(price * quantity), 0) as total
     FROM items WHERE list_id = ?`,
    [listId]
  ) as { count: number; total: number };
  return row ?? { count: 0, total: 0 };
};