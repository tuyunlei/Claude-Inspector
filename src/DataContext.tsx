
import { createContext, useContext } from 'react';
import { DataStore } from './model/datastore';

export const DataContext = createContext<{ data: DataStore } | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataContext');
  return context;
};