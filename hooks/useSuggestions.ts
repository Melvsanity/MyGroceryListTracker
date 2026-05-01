import { useState, useEffect, useRef } from 'react';
import { getAllItemNames } from '../database/items';

export interface Suggestion {
  name: string;
  price: number;
  category: string;
}

export function useSuggestions(query: string) {
  const [allItems, setAllItems] = useState<Suggestion[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const dismissed = useRef(false);
  const lastAccepted = useRef('');

  useEffect(() => {
    try {
      setAllItems(getAllItemNames());
    } catch (e) {
      console.warn('useSuggestions: could not load items', e);
    }
  }, []);

  useEffect(() => {
    if (dismissed.current && query !== lastAccepted.current) {
      dismissed.current = false;
    }

    const trimmed = query.trim().toLowerCase();
    if (trimmed.length < 1 || dismissed.current) {
      setSuggestions([]);
      return;
    }

    const matches = allItems
      .filter((item) => item.name.toLowerCase().includes(trimmed))
      .slice(0, 6);
    setSuggestions(matches);
  }, [query, allItems]);

  const dismiss = (acceptedName: string) => {
    dismissed.current = true;
    lastAccepted.current = acceptedName;
    setSuggestions([]);
  };

  return { suggestions, dismiss };
}