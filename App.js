import React, { useEffect } from 'react';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useStore } from './src/store/useStore';
import { Linking, Alert } from 'react-native';
import { checkForUpdates, shouldCheckForUpdate, saveUpdateCheckTimestamp, skipVersion, DEFAULT_UPDATE_URL } from './src/utils/updateChecker';
import { auth } from './src/config/firebase';
import NetInfo from '@react-native-community/netinfo';

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#A52A2E',
    onPrimary: '#FFFFFF', // White text on burgundy
    secondary: '#03dac6',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#ac9423',
    onPrimary: '#000000', // Black text on gold/yellow
    secondary: '#03dac6',
  },
};

function AppContent() {
  const isDarkMode = useStore((state) => state.isDarkMode);
  const importData = useStore((state) => state.importData);
  const shopInfo = useStore((state) => state.shopInfo);
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Check for app updates
  const checkForAppUpdates = async () => {
    try {
      const updateUrl = shopInfo.updateCheckUrl || DEFAULT_UPDATE_URL;

      const shouldCheck = await shouldCheckForUpdate();
      if (!shouldCheck) return; // Too soon since last check

      const updateInfo = await checkForUpdates(updateUrl);
      await saveUpdateCheckTimestamp();

      if (updateInfo) {
        showUpdateDialog(updateInfo);
      }
    } catch (error) {
      console.error('Update check failed:', error);
      // Silently fail - don't bother user with update check errors
    }
  };

  // Show update dialog
  const showUpdateDialog = (updateInfo) => {
    const buttons = updateInfo.forceUpdate
      ? [
        {
          text: 'Update Now',
          onPress: () => Linking.openURL(updateInfo.downloadUrl),
        },
      ]
      : [
        {
          text: 'Later',
          style: 'cancel',
        },
        {
          text: 'Skip This Version',
          onPress: () => skipVersion(updateInfo.newVersion),
        },
        {
          text: 'Update Now',
          onPress: () => Linking.openURL(updateInfo.downloadUrl),
        },
      ];

    Alert.alert(
      'Update Available',
      `Version ${updateInfo.newVersion} is now available!\n\n${updateInfo.releaseNotes}\n\nCurrent version: ${updateInfo.currentVersion}`,
      buttons,
      { cancelable: !updateInfo.forceUpdate }
    );
  };

  useEffect(() => {
    const handleUrl = (url) => {
      if (!url) return;
      try {
        // format: invoicingapp://import?url=...&type=...
        const parts = url.split('://');
        if (parts.length < 2) return;

        const pathAndQuery = parts[1];
        if (pathAndQuery.startsWith('import')) {
          const queryParts = pathAndQuery.split('?');
          if (queryParts.length > 1) {
            const queryString = queryParts[1];
            const params = {};
            queryString.split('&').forEach(param => {
              const [key, value] = param.split('=');
              if (key && value) {
                params[key] = decodeURIComponent(value);
              }
            });

            if (params.url && params.type) {
              Alert.alert(
                'Import Data',
                `Do you want to import ${params.type} from external link?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Import',
                    onPress: async () => {
                      try {
                        const response = await fetch(params.url);
                        if (!response.ok) throw new Error('Network error');
                        const json = await response.json();
                        importData(json, params.type);
                        Alert.alert('Success', 'Data imported successfully');
                      } catch (e) {
                        Alert.alert('Error', 'Import failed: ' + e.message);
                      }
                    }
                  }
                ]
              );
            }
          }
        }
      } catch (e) {
        console.error('Deep link error', e);
      }
    };

    const handleDeepLink = (event) => {
      handleUrl(event.url);
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, [importData]);

  // Check for updates and sync data on app launch
  useEffect(() => {
    checkForAppUpdates();

    // Listen for Firebase Auth state changes
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in to Firebase
        console.log('Firebase Auth Restored:', user.uid);

        // Now check if Zustand is hydrated
        const state = useStore.getState();
        if (state._hasHydrated) {
          // Safe to sync now
          state.syncData();
        } else {
          // Wait for hydration
          const unsubHydrate = useStore.subscribe((s) => {
            if (s._hasHydrated) {
              s.syncData();
              unsubHydrate(); // Run once
            }
          });
        }
      } else {
        console.log('Firebase Auth: No user');
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Auto-sync when internet connection is restored
  useEffect(() => {
    const unsubscribeNet = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('Internet Restored: Triggering Sync...');
        const store = useStore.getState();
        if (store.user && store._hasHydrated) {
          store.syncData();
        }
      }
    });

    return () => {
      unsubscribeNet();
    };
  }, []);

  return (
    <PaperProvider theme={theme}>
      <AppNavigator />
    </PaperProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
