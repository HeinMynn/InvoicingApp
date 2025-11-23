import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../config/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, updateDoc, deleteDoc, query, where, writeBatch } from 'firebase/firestore';

export const useStore = create(
  persist(
    (set, get) => ({
      // Auth State
      user: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;

          set({
            user: {
              uid: user.uid,
              email: user.email,
              name: user.displayName || 'Admin',
              role: 'admin'
            },
            isLoading: false
          });

          // Trigger data sync after login
          await get().syncData();
          return true;
        } catch (error) {
          console.error('Login error:', error);
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      logout: async () => {
        try {
          await signOut(auth);
          set({ user: null, customers: [], products: [], invoices: [], categories: [], attributes: [] });
        } catch (error) {
          console.error('Logout error:', error);
        }
      },

      // Data Synchronization
      syncData: async () => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true });
        try {
          const userId = user.uid;
          console.log('Starting sync for user:', userId);
          const localState = get();

          // Helper to fetch collection and merge local data
          const syncCollection = async (collectionName, localData) => {
            const q = query(collection(db, `users/${userId}/${collectionName}`));
            const querySnapshot = await getDocs(q);
            const remoteData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const batch = writeBatch(db);
            let hasChanges = false;

            // Helper to sanitize object for Firestore (remove undefined, handle NaN)
            const sanitize = (obj) => {
              return JSON.parse(JSON.stringify(obj, (key, value) => {
                if (value === undefined) return null;
                if (typeof value === 'number' && isNaN(value)) return 0; // Convert NaN to 0
                return value;
              }));
            };

            // 1. Identify items to upload (New or Modified)
            const mergedData = localData.map(localItem => {
              const remoteItem = remoteData.find(r => r.id.toString() === localItem.id.toString());

              if (!remoteItem) {
                // New Item: Upload
                const docRef = doc(db, `users/${userId}/${collectionName}`, localItem.id.toString());
                const cleanItem = sanitize(localItem);
                batch.set(docRef, cleanItem);
                hasChanges = true;
                return localItem;
              } else {
                // Existing Item: Check for changes
                // Simple comparison: JSON stringify (sufficient for this app)
                const localStr = JSON.stringify(localItem);
                const remoteStr = JSON.stringify(remoteItem);

                if (localStr !== remoteStr) {
                  // Local is different (assume newer): Upload
                  const docRef = doc(db, `users/${userId}/${collectionName}`, localItem.id.toString());
                  const cleanItem = sanitize(localItem);
                  batch.set(docRef, cleanItem);
                  hasChanges = true;
                  return localItem; // Keep local version
                } else {
                  return remoteItem; // Keep remote (same)
                }
              }
            });

            // 2. Identify items in Remote that are NOT in Local (Downloaded)
            // Union Merge: We want [A, B, C] (Local) + [D] (Remote) = [A, B, C, D]
            const localIds = new Set(localData.map(i => i.id.toString()));
            const newFromRemote = remoteData.filter(r => !localIds.has(r.id.toString()));

            // Add missing remote items to the final list
            const finalData = [...mergedData, ...newFromRemote];

            if (hasChanges) {
              console.log(`Syncing changes for ${collectionName}...`);
              await batch.commit();
            }

            return finalData;
          };

          // Sync all collections with isolation
          const syncSafe = async (name, data) => {
            try {
              return await syncCollection(name, data);
            } catch (err) {
              console.error(`Failed to sync ${name}:`, err);
              // Return local data as fallback so we don't lose UI state
              return data;
            }
          };

          const [customers, products, invoices, categories, attributes] = await Promise.all([
            syncSafe('customers', localState.customers),
            syncSafe('products', localState.products),
            syncSafe('invoices', localState.invoices),
            syncSafe('categories', localState.categories),
            syncSafe('attributes', localState.attributes),
          ]);

          // Sync Shop Info
          const shopInfoRef = doc(db, `users/${userId}/shopInfo`, 'settings');
          const shopInfoSnap = await getDocs(query(collection(db, `users/${userId}/shopInfo`)));

          let shopInfoData = localState.shopInfo;

          if (shopInfoSnap.empty) {
            // Migrate Shop Info
            await setDoc(shopInfoRef, localState.shopInfo);
          } else {
            // Use Firestore Shop Info
            const remoteShopInfo = shopInfoSnap.docs[0]?.data();
            if (remoteShopInfo) {
              shopInfoData = { ...localState.shopInfo, ...remoteShopInfo };
            }
          }

          set({
            customers,
            products,
            invoices,
            categories,
            attributes,
            shopInfo: shopInfoData,
            isLoading: false
          });

          return true; // Success
        } catch (error) {
          console.error('Sync error:', error);
          set({ error: error.message, isLoading: false });
          return false; // Failed
        }
      },

      // Customers
      customers: [],
      addCustomer: async (customer) => {
        const newCustomer = { ...customer, id: customer.id || Date.now().toString() };
        set((state) => ({ customers: [...state.customers, newCustomer] }));

        const { user } = get();
        if (user) {
          try {
            await setDoc(doc(db, `users/${user.uid}/customers`, newCustomer.id), newCustomer);
          } catch (e) { console.error('Error adding customer to DB', e); }
        }
      },
      updateCustomer: async (id, data) => {
        set((state) => ({
          customers: state.customers.map(c => c.id === id ? { ...c, ...data } : c)
        }));

        const { user } = get();
        if (user) {
          try {
            await updateDoc(doc(db, `users/${user.uid}/customers`, id), data);
          } catch (e) { console.error('Error updating customer in DB', e); }
        }
      },
      deleteCustomer: async (id) => {
        set((state) => ({
          customers: state.customers.filter(c => c.id !== id)
        }));

        const { user } = get();
        if (user) {
          try {
            await deleteDoc(doc(db, `users/${user.uid}/customers`, id));
          } catch (e) { console.error('Error deleting customer from DB', e); }
        }
      },

      // Products
      products: [],
      addProduct: async (product) => {
        const newProduct = { ...product, id: Date.now().toString() };
        set((state) => ({ products: [...state.products, newProduct] }));

        const { user } = get();
        if (user) {
          try {
            await setDoc(doc(db, `users/${user.uid}/products`, newProduct.id), newProduct);
          } catch (e) { console.error('Error adding product to DB', e); }
        }
      },
      updateProduct: async (id, data) => {
        set((state) => ({
          products: state.products.map(p => p.id === id ? { ...p, ...data } : p)
        }));

        const { user } = get();
        if (user) {
          try {
            await updateDoc(doc(db, `users/${user.uid}/products`, id), data);
          } catch (e) { console.error('Error updating product in DB', e); }
        }
      },
      deleteProduct: async (id) => {
        set((state) => ({
          products: state.products.filter(p => p.id !== id)
        }));

        const { user } = get();
        if (user) {
          try {
            await deleteDoc(doc(db, `users/${user.uid}/products`, id));
          } catch (e) { console.error('Error deleting product from DB', e); }
        }
      },

      // Invoices
      invoices: [],
      // Invoices
      invoices: [],
      addInvoice: async (invoice) => {
        let newInvoice = null;

        set((state) => {
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

          newInvoice = {
            ...invoice,
            id: invoiceNumber,
            date: invoice.date || new Date().toISOString(),
            total: Math.round(invoice.total)
          };

          return {
            invoices: [...state.invoices, newInvoice]
          };
        });

        const { user } = get();
        if (user && newInvoice) {
          try {
            // Sanitize before writing to Firestore
            const cleanInvoice = JSON.parse(JSON.stringify(newInvoice, (key, value) => {
              if (value === undefined) return null;
              if (typeof value === 'number' && isNaN(value)) return 0;
              return value;
            }));
            await setDoc(doc(db, `users/${user.uid}/invoices`, newInvoice.id), cleanInvoice);
          } catch (e) { console.error('Error adding invoice to DB', e); }
        }
      },
      updateInvoice: async (id, data) => {
        set((state) => ({
          invoices: state.invoices.map(inv =>
            inv.id === id ? { ...inv, ...data, total: Math.round(data.total) } : inv
          )
        }));

        const { user } = get();
        if (user) {
          try {
            // Sanitize before updating Firestore
            const cleanData = JSON.parse(JSON.stringify(data, (key, value) => {
              if (value === undefined) return null;
              if (typeof value === 'number' && isNaN(value)) return 0;
              return value;
            }));
            await updateDoc(doc(db, `users/${user.uid}/invoices`, id), cleanData);
          } catch (e) { console.error('Error updating invoice in DB', e); }
        }
      },
      deleteInvoice: async (id) => {
        set((state) => ({
          invoices: state.invoices.filter(i => i.id !== id)
        }));

        const { user } = get();
        if (user) {
          try {
            await deleteDoc(doc(db, `users/${user.uid}/invoices`, id));
          } catch (e) { console.error('Error deleting invoice from DB', e); }
        }
      },

      // Shop Info
      shopInfo: {
        name: '',
        address: '',
        phone: '',
        logo: null,
        currency: 'MMK',
        deliveryOptions: ['Royal Express', 'ကားဂိတ်ချ', 'Bee Express', 'Icare Delivery', 'Ninja Van'],
        updateCheckUrl: 'https://gist.githubusercontent.com/HeinMynn/199fa70bb75f48a7b9d03b5ccc09d585/raw',
        labelSettings: {
          width: '50',
          height: '30',
          unit: 'mm'
        }
      },
      updateShopInfo: async (info) => {
        set((state) => ({
          shopInfo: { ...state.shopInfo, ...info }
        }));

        const { user, shopInfo } = get();
        if (user) {
          try {
            // We'll store shopInfo as a single doc 'settings' in 'shopInfo' collection, or just merge it into a doc
            // Let's use a subcollection 'shopInfo' with a doc 'settings' to be consistent with other collections
            // Or simpler: just update the user document itself? No, let's stick to subcollection for cleaner structure
            // Actually, in syncData I assumed `users/${userId}/shopInfo` collection.
            // Let's save it as doc `settings` in `shopInfo` collection.
            await setDoc(doc(db, `users/${user.uid}/shopInfo`, 'settings'), { ...shopInfo, ...info }, { merge: true });
          } catch (e) { console.error('Error updating shop info in DB', e); }
        }
      },

      // Categories
      categories: [],
      addCategory: async (category) => {
        const newCategory = { ...category, id: Date.now().toString() };
        set((state) => ({ categories: [...state.categories, newCategory] }));

        const { user } = get();
        if (user) {
          try {
            await setDoc(doc(db, `users/${user.uid}/categories`, newCategory.id), newCategory);
          } catch (e) { console.error('Error adding category to DB', e); }
        }
      },
      updateCategory: async (id, data) => {
        set((state) => ({
          categories: state.categories.map(c => c.id === id ? { ...c, ...data } : c)
        }));

        const { user } = get();
        if (user) {
          try {
            await updateDoc(doc(db, `users/${user.uid}/categories`, id), data);
          } catch (e) { console.error('Error updating category in DB', e); }
        }
      },
      deleteCategory: async (id) => {
        set((state) => ({
          categories: state.categories.filter(c => c.id !== id)
        }));

        const { user } = get();
        if (user) {
          try {
            await deleteDoc(doc(db, `users/${user.uid}/categories`, id));
          } catch (e) { console.error('Error deleting category from DB', e); }
        }
      },

      // Attributes
      attributes: [], // [{ id, name, values: [] }]
      addAttribute: async (attribute) => {
        const newAttribute = { ...attribute, id: Date.now().toString() };
        set((state) => ({ attributes: [...state.attributes, newAttribute] }));

        const { user } = get();
        if (user) {
          try {
            await setDoc(doc(db, `users/${user.uid}/attributes`, newAttribute.id), newAttribute);
          } catch (e) { console.error('Error adding attribute to DB', e); }
        }
      },
      updateAttribute: async (id, data) => {
        set((state) => ({
          attributes: state.attributes.map(a => a.id === id ? { ...a, ...data } : a)
        }));

        const { user } = get();
        if (user) {
          try {
            await updateDoc(doc(db, `users/${user.uid}/attributes`, id), data);
          } catch (e) { console.error('Error updating attribute in DB', e); }
        }
      },
      deleteAttribute: async (id) => {
        set((state) => ({
          attributes: state.attributes.filter(a => a.id !== id)
        }));

        const { user } = get();
        if (user) {
          try {
            await deleteDoc(doc(db, `users/${user.uid}/attributes`, id));
          } catch (e) { console.error('Error deleting attribute from DB', e); }
        }
      },

      // Import Data
      importData: (data) => set((state) => ({
        ...state,
        ...data,
        shopInfo: { ...state.shopInfo, ...data.shopInfo }
      })),

      setDarkMode: (value) => set({ isDarkMode: value }),

      // Hydration State
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'invoicing-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state.setHasHydrated(true);
      },
    }
  )
);
