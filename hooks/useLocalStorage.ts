// FIX: Import `React` to make the `React` namespace available for types like `React.SetStateAction`.
import React, { useState } from 'react';

// A generic hook for persisting state to localStorage
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: React.SetStateAction<T>) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: React.SetStateAction<T>) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Could not save value for key "${key}" to localStorage`, error);
    }
  };

  return [storedValue, setValue];
}