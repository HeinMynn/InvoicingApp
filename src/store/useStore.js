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
        customers: [...state.customers, { ...customer, id: customer.id || Date.now().toString() }]
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
      addInvoice: (invoice) => set((state) => {
        // Generate invoice number in format YYYYMMDD000001
        const now = invoice.date ? new Date(invoice.date) : new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const datePrefix = `${year}${month}${day}`;

        // Find the highest invoice number for today
        const todayInvoices = state.invoices.filter(inv =>
          inv.id && inv.id.startsWith(datePrefix)
        );

        let nextNumber = 1;
        if (todayInvoices.length > 0) {
          const maxNumber = Math.max(...todayInvoices.map(inv => {
            const numPart = inv.id.substring(8); // Get the last 6 digits
            return parseInt(numPart) || 0;
          }));
          nextNumber = maxNumber + 1;
        }

        const invoiceNumber = `${datePrefix}${String(nextNumber).padStart(6, '0')}`;

        return {
          invoices: [...state.invoices, {
            ...invoice,
            id: invoiceNumber,
            date: invoice.date || new Date().toISOString(),
            total: Math.round(invoice.total)
          }]
        };
      }),
      updateInvoice: (id, data) => set((state) => ({
        invoices: state.invoices.map(inv =>
          inv.id === id ? { ...inv, ...data, total: Math.round(data.total) } : inv
        )
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
        currency: 'MMK',
        deliveryOptions: ['Royal Express', 'ကားဂိတ်ချ', 'Bee Express', 'Icare Delivery', 'Ninja Van'],
        updateCheckUrl: 'https://gist.githubusercontent.com/HeinMynn/199fa70bb75f48a7b9d03b5ccc09d585/raw',
      },
      updateShopInfo: (info) => set((state) => ({
        shopInfo: { ...state.shopInfo, ...info }
      })),

      // Categories
      categories: [],
      addCategory: (category) => set((state) => ({
        categories: [...state.categories, { ...category, id: Date.now().toString() }]
      })),
      updateCategory: (id, data) => set((state) => ({
        categories: state.categories.map(c => c.id === id ? { ...c, ...data } : c)
      })),
      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter(c => c.id !== id)
      })),

      // Attributes
      attributes: [], // [{ id, name, values: [] }]
      addAttribute: (attribute) => set((state) => ({
        attributes: [...state.attributes, { ...attribute, id: Date.now().toString() }]
      })),
      updateAttribute: (id, data) => set((state) => ({
        attributes: state.attributes.map(a => a.id === id ? { ...a, ...data } : a)
      })),
      deleteAttribute: (id) => set((state) => ({
        attributes: state.attributes.filter(a => a.id !== id)
      })),

      // Import Data
      importData: (data) => set((state) => ({
        ...state,
        ...data,
        shopInfo: { ...state.shopInfo, ...data.shopInfo }
      })),

      // Dark Mode
      isDarkMode: false,
      setDarkMode: (value) => set({ isDarkMode: value }),
    }),
    {
      name: 'invoicing-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
