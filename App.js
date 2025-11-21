import React, { useEffect } from 'react';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useStore } from './src/store/useStore';
import { Linking, Alert } from 'react-native';

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
  const theme = isDarkMode ? darkTheme : lightTheme;

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
