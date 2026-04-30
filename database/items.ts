import db from './db';

export interface GroceryItem {
  id?: number;
  list_id: number;
  name: string;
  price: number;
  quantity: number;
  category: string;
  notes: string;
  checked: number;
}

export const getItems = (listId: number): GroceryItem[] => {
  return db.getAllSync(
    `SELECT * FROM items WHERE list_id = ? ORDER BY category, name`,
    [listId]
  ) as GroceryItem[];
};

export const addItem = (item: GroceryItem): number => {
  const result = db.runSync(
    `INSERT INTO items (list_id, name, price, quantity, category, notes, checked)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [item.list_id, item.name, item.price, item.quantity, item.category, item.notes]
  );
  return result.lastInsertRowId;
};

export const updateItem = (item: GroceryItem): void => {
  db.runSync(
    `UPDATE items SET name=?, price=?, quantity=?, category=?, notes=?
     WHERE id=?`,
    [item.name, item.price, item.quantity, item.category, item.notes, item.id!]
  );
};

export const toggleChecked = (id: number, checked: number): void => {
  db.runSync(
    `UPDATE items SET checked=? WHERE id=?`,
    [checked, id]
  );
};

export const deleteItem = (id: number): void => {
  db.runSync(`DELETE FROM items WHERE id=?`, [id]);
};

export const getAllItemNames = (): { name: string; price: number; category: string }[] => {
  return db.getAllSync(
    `SELECT name, price, category FROM items
     GROUP BY name ORDER BY COUNT(*) DESC LIMIT 100`
  ) as { name: string; price: number; category: string }[];
};