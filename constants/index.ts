// ─── Currency ─────────────────────────────────────────────
export const CURRENCY = '₱';

// ─── Categories ───────────────────────────────────────────
export const CATEGORIES = [
  'General', 'Produce', 'Meat', 'Dairy',
  'Beverages', 'Snacks', 'Frozen', 'Household', 'Personal Care',
];

// ─── Colors ───────────────────────────────────────────────
export const Colors = {
  // ── Brand greens ──
  primary:          '#2e7d32',   // header bg, main buttons, FAB
  primaryDark:      '#1b5e20',   // card names, item names, modal titles, toast bg
  primaryMedium:    '#4caf50',   // checkboxes, budget fill bar, row accent
  primaryLight:     '#a5d6a7',   // header subtitle text, chip borders
  primaryXLight:    '#e8f5e9',   // back button bg, price chip bg
  primaryBorder:    '#c8e6c9',   // back button border

  // ── Screen & surface ──
  screenBg:         '#f0f4f0',   // all screen backgrounds
  surface:          '#ffffff',   // cards, rows
  surfaceAlt:       '#fafafa',   // input backgrounds
  surfaceModal:     '#f5f5f0',   // bottom sheet background
  surfaceMuted:     '#f5f5f5',   // done chip, muted surfaces
  surfaceInput:     '#f0f0f0',   // cancel button, category chip bg

  // ── Select / destructive (red) ──
  selectHeader:     '#b71c1c',   // select mode header bg
  selectAccent:     '#e53935',   // selected checkbox bg, budget over fill
  danger:           '#c62828',   // delete text, over-budget text
  dangerBg:         '#ffebee',   // delete button bg
  dangerBorder:     '#ffcdd2',   // delete button border
  dangerCardBg:     '#fff5f5',   // selected card bg
  dangerCardBorder: '#ef9a9a',   // selected card border (My Lists)

  // ── Reuse / info (blue) ──
  infoBg:           '#e3f2fd',   // reuse button bg
  infoBorder:       '#bbdefb',   // reuse button border
  infoText:         '#1565c0',   // reuse button text

  // ── Amber (no-price / warning) ──
  amberAccent:      '#ffd54f',   // no-price left border
  amberBg:          '#fff8e1',   // amber chip bg
  amberBorder:      '#ffe082',   // amber chip border
  amberText:        '#b8860b',   // amber chip text

  // ── Neutral text & borders ──
  textPrimary:      '#111111',
  textSecondary:    '#555555',
  textMuted:        '#777777',
  textHint:         '#888888',
  textLight:        '#aaaaaa',
  textXLight:       '#bbbbbb',
  textGhost:        '#cccccc',
  border:           '#dddddd',
  borderLight:      '#eeeeee',
  borderMuted:      '#f0f0f0',
  closeBtnBg:       '#eeeeee',   // ✕ close button background
};