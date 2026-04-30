import db from './db';

export interface Receipt {
  id?: number;
  list_id: number;
  total: number;
  saved_at?: string;
  name?: string;
  store?: string;
}

export const saveReceipt = (listId: number, total: number): number => {
  const result = db.runSync(
    `INSERT INTO receipts (list_id, total) VALUES (?, ?)`,
    [listId, total]
  );
  return result.lastInsertRowId;
};

export const getAllReceipts = (): Receipt[] => {
  return db.getAllSync(
    `SELECT r.*, l.name, l.store
     FROM receipts r
     JOIN lists l ON r.list_id = l.id
     ORDER BY r.saved_at DESC`
  ) as Receipt[];
};

export const getReceiptWithItems = (receiptId: number) => {
  const receipt = db.getFirstSync(
    `SELECT r.*, l.name, l.store, l.budget
     FROM receipts r
     JOIN lists l ON r.list_id = l.id
     WHERE r.id = ?`,
    [receiptId]
  ) as Receipt & { budget: number };

  const items = db.getAllSync(
    `SELECT * FROM items WHERE list_id = ? ORDER BY category, name`,
    [receipt.list_id]
  );

  return { receipt, items };
};

export const deleteReceipt = (id: number): void => {
  db.runSync(`DELETE FROM receipts WHERE id=?`, [id]);
};