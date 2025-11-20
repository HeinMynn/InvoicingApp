import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useStore = create(
  persist(
    (set, get) => ({
      // Auth State
      user: null,
      login: (username, password) => {
        // Mock Login
        if (username === 'admin' && password === 'admin') {
          set({ user: { name: 'Admin', role: 'admin' } });
          return true;
        }
        return false;
      },
      logout: () => set({ user: null }),

      // Customers
      customers: [],
      addCustomer: (customer) => set((state) => ({
        customers: [...state.customers, { ...customer, id: Date.now().toString() }]
      })),
      updateCustomer: (id, data) => set((state) => ({
        customers: state.customers.map(c => c.id === id ? { ...c, ...data } : c)
      })),
      deleteCustomer: (id) => set((state) => ({
        customers: state.customers.filter(c => c.id !== id)
      })),

      // Products
      products: [],
      addProduct: (product) => set((state) => ({
        products: [...state.products, { ...product, id: Date.now().toString() }]
      })),
      updateProduct: (id, data) => set((state) => ({
        products: state.products.map(p => p.id === id ? { ...p, ...data } : p)
      })),
      deleteProduct: (id) => set((state) => ({
        products: state.products.filter(p => p.id !== id)
      })),

      // Invoices
      invoices: [],
      addInvoice: (invoice) => set((state) => ({
        invoices: [...state.invoices, { ...invoice, id: Date.now().toString(), date: new Date().toISOString() }]
      })),
      updateInvoice: (id, invoice) => set((state) => ({
        invoices: state.invoices.map(i => i.id === id ? { ...i, ...invoice } : i)
      })),
      deleteInvoice: (id) => set((state) => ({
        invoices: state.invoices.filter(i => i.id !== id)
      })),

      // Shop Info
      shopInfo: {
        name: '',
        address: '',
        phone: '',
        logo: null,
      },
      updateShopInfo: (info) => set((state) => ({
        shopInfo: { ...state.shopInfo, ...info }
      })),
    }),
    {
      name: 'invoicing-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
