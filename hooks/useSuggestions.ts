import { useState, useEffect, useRef } from 'react';
import { getAllItemNames, dismissSuggestion, getDismissedSuggestions } from '../database/items';

export interface Suggestion {
  name: string;
  price: number;
  category: string;
}

export function useSuggestions(query: string) {
  const [allItems, setAllItems] = useState<Suggestion[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const sessionDismissed = useRef(false);
  const lastAccepted = useRef('');

  // Load all items + permanently dismissed names on mount
  useEffect(() => {
    try {
      setAllItems(getAllItemNames());
      const names = getDismissedSuggestions();
      setDismissed(new Set(names));
    } catch (e) {
      console.warn('useSuggestions: could not load items', e);
    }
  }, []);

  useEffect(() => {
    if (sessionDismissed.current && query !== lastAccepted.current) {
      sessionDismissed.current = false;
    }

    const trimmed = query.trim().toLowerCase();
    if (trimmed.length < 1 || sessionDismissed.current) {
      setSuggestions([]);
      return;
    }

    const matches = allItems
      .filter((item) => !dismissed.has(item.name))           // filter out permanently dismissed
      .filter((item) => item.name.toLowerCase().includes(trimmed))
      .slice(0, 6);
    setSuggestions(matches);
  }, [query, allItems, dismissed]);

  // Session dismiss — user accepted a suggestion, hide dropdown
  const dismiss = (acceptedName: string) => {
    sessionDismissed.current = true;
    lastAccepted.current = acceptedName;
    setSuggestions([]);
  };

  // Permanent dismiss — user tapped ✕, never show this suggestion again
  const permanentDismiss = (name: string) => {
    dismissSuggestion(name);                                  // persist to DB
    setDismissed((prev) => new Set([...prev, name]));        // update local state
  };

  return { suggestions, dismiss, permanentDismiss };
}