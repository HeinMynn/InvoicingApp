import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Share, Linking } from 'react-native';
import { TextInput, Button, Text, Switch, List, Divider, IconButton, useTheme, Portal, Dialog, RadioButton } from 'react-native-paper';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Application from 'expo-application';
import { useStore } from '../store/useStore';
import { checkForUpdates, saveUpdateCheckTimestamp, getLastUpdateCheck, DEFAULT_UPDATE_URL } from '../utils/updateChecker';

export default function GeneralSettingsScreen() {
    const shopInfo = useStore((state) => state.shopInfo);
    const updateShopInfo = useStore((state) => state.updateShopInfo);
    const isDarkMode = useStore((state) => state.isDarkMode);
    const setDarkMode = useStore((state) => state.setDarkMode);
    const products = useStore((state) => state.products);
    const invoices = useStore((state) => state.invoices);
    const customers = useStore((state) => state.customers);
    const importData = useStore((state) => state.importData);
    const syncData = useStore((state) => state.syncData);
    const isLoading = useStore((state) => state.isLoading);
    const theme = useTheme();

    const [currency, setCurrency] = useState(shopInfo.currency || 'MMK');
    const [currencySymbol, setCurrencySymbol] = useState(shopInfo.currencySymbol || '');
    const [urlDialogVisible, setUrlDialogVisible] = useState(false);
    const [importUrl, setImportUrl] = useState('');
    const [importType, setImportType] = useState('products');
    const [updateCheckUrl, setUpdateCheckUrl] = useState(shopInfo.updateCheckUrl || '');
    const [checkingUpdate, setCheckingUpdate] = useState(false);
    const [lastUpdateCheck, setLastUpdateCheck] = useState(null);

    const handleSaveCurrency = () => {
        updateShopInfo({ currency, currencySymbol });
        Alert.alert('Success', 'Currency saved successfully');
    };

    const handleDarkModeToggle = (value) => {
        setDarkMode(value);
    };

    const handleSaveUpdateUrl = () => {
        updateShopInfo({ updateCheckUrl });
        Alert.alert('Success', 'Update check URL saved successfully');
    };

    const handleSync = async () => {
        const success = await syncData();
        if (success) {
            Alert.alert('Success', 'Data synced with cloud successfully');
        } else {
            const error = useStore.getState().error;
            Alert.alert('Sync Failed', error || 'Unknown error occurred');
        }
    };

    const handleCheckForUpdates = async () => {
        const checkUrl = updateCheckUrl || DEFAULT_UPDATE_URL;

        setCheckingUpdate(true);
        try {
            const updateInfo = await checkForUpdates(checkUrl);
            await saveUpdateCheckTimestamp();

            const lastCheck = await getLastUpdateCheck();
            setLastUpdateCheck(lastCheck);

            if (updateInfo) {
                Alert.alert(
                    'Update Available',
                    `Version ${updateInfo.newVersion} is now available!\n\n${updateInfo.releaseNotes}\n\nCurrent version: ${updateInfo.currentVersion}`,
                    [
                        { text: 'Later', style: 'cancel' },
                        { text: 'Download', onPress: () => Linking.openURL(updateInfo.downloadUrl) }
                    ]
                );
            } else {
                Alert.alert('No Updates', 'You are using the latest version');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to check for updates. Please check your update URL.');
            console.error('Update check error:', error);
        } finally {
            setCheckingUpdate(false);
        }
    };

    const handleUrlImport = async () => {
        if (!importUrl) {
            Alert.alert('Error', 'Please enter a URL');
            return;
        }

        try {
            const response = await fetch(importUrl);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const json = await response.json();

            importData(json, importType);
            Alert.alert('Success', `${importType} imported successfully from URL`);
            setUrlDialogVisible(false);
            setImportUrl('');
        } catch (error) {
            Alert.alert('Import Failed', 'Could not fetch or parse JSON: ' + error.message);
        }
    };

    const exportData = async (type) => {
        let data = null;
        try {
            let filename = '';

            if (type === 'products') {
                data = JSON.stringify(products, null, 2);
                filename = 'products.json';
            } else if (type === 'invoices') {
                data = JSON.stringify(invoices, null, 2);
                filename = 'invoices.json';
            } else if (type === 'customers') {
                data = JSON.stringify(customers, null, 2);
                filename = 'customers.json';
            }

            if (data) {
                const fileUri = FileSystem.documentDirectory + filename;
                await FileSystem.writeAsStringAsync(fileUri, data);

                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(fileUri, {
                        mimeType: 'application/json',
                        dialogTitle: `Export ${type}`,
                        UTI: 'public.json' // for iOS
                    });
                } else {
                    Alert.alert('Error', 'Sharing is not available on this device');
                }
            }
        } catch (error) {
            console.error('Export Error:', error);
            // Fallback to sharing text if file creation fails
            if (data) {
                try {
                    await Share.share({
                        message: data,
                        title: `Export ${type}`
                    });
                } catch (shareError) {
                    Alert.alert('Export Failed', 'Could not share data: ' + shareError.message);
                }
            } else {
                Alert.alert('Export Failed', error.message);
            }
        }
    };

    const handleImport = async (type) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
            if (result.canceled) return;

            const fileUri = result.assets[0].uri;
            const fileContent = await FileSystem.readAsStringAsync(fileUri);
            const parsedData = JSON.parse(fileContent);

            if (type === 'products') {
                importData({ products: parsedData });
            } else if (type === 'invoices') {
                importData({ invoices: parsedData });
            } else if (type === 'customers') {
                importData({ customers: parsedData });
            }
            Alert.alert('Success', `${type} imported successfully`);
        } catch (error) {
            Alert.alert('Error', 'Failed to import data. Invalid JSON file.');
        }
    };

    return (
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Currency</Text>
                <TextInput
                    label="Currency Code (e.g. MMK, USD)"
                    value={currency}
                    onChangeText={setCurrency}
                    style={styles.input}
                    mode="outlined"
                />
                <TextInput
                    label="Short Sign (e.g. Ks, $)"
                    value={currencySymbol}
                    onChangeText={setCurrencySymbol}
                    style={styles.input}
                    mode="outlined"
                />
                <Button mode="contained" onPress={handleSaveCurrency} style={styles.saveButton}>
                    Save Currency
                </Button>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Appearance</Text>
                <View style={styles.row}>
                    <Text variant="bodyLarge">Dark Mode</Text>
                    <Switch value={isDarkMode} onValueChange={handleDarkModeToggle} />
                </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Data Management</Text>

                <Button
                    mode="contained"
                    onPress={handleSync}
                    style={{ marginBottom: 20 }}
                    icon="cloud-sync"
                    loading={isLoading}
                    disabled={isLoading}
                >
                    Sync Data with Cloud
                </Button>

                <List.Section>
                    <List.Subheader>Export Data</List.Subheader>
                    <List.Item
                        title="Export Products"
                        left={() => <List.Icon icon="package-variant" />}
                        right={() => <IconButton icon="export" onPress={() => exportData('products')} />}
                    />
                    <List.Item
                        title="Export Invoices"
                        left={() => <List.Icon icon="file-document" />}
                        right={() => <IconButton icon="export" onPress={() => exportData('invoices')} />}
                    />
                    <List.Item
                        title="Export Customers"
                        left={() => <List.Icon icon="account-multiple" />}
                        right={() => <IconButton icon="export" onPress={() => exportData('customers')} />}
                    />
                </List.Section>

                <List.Section>
                    <List.Subheader>Import Data</List.Subheader>
                    <List.Item
                        title="Import Products"
                        description="Replace/Merge existing products"
                        left={() => <List.Icon icon="package-variant" />}
                        right={() => <IconButton icon="import" onPress={() => handleImport('products')} />}
                    />
                    <List.Item
                        title="Import Invoices"
                        description="Replace/Merge existing invoices"
                        left={() => <List.Icon icon="file-document" />}
                        right={() => <IconButton icon="import" onPress={() => handleImport('invoices')} />}
                    />
                    <List.Item
                        title="Import Customers"
                        description="Replace/Merge existing customers"
                        left={() => <List.Icon icon="account-multiple" />}
                        right={() => <IconButton icon="import" onPress={() => handleImport('customers')} />}
                    />
                    <List.Item
                        title="Import from URL"
                        description="Download JSON from a direct link"
                        left={() => <List.Icon icon="web" />}
                        right={() => <IconButton icon="cloud-download" onPress={() => setUrlDialogVisible(true)} />}
                    />
                </List.Section>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>App Updates</Text>
                <Text variant="bodySmall" style={{ marginBottom: 15, color: theme.colors.onSurfaceVariant }}>
                    Current Version: {Application.nativeApplicationVersion || '1.0.0'}
                </Text>

                <TextInput
                    label="Update Check URL"
                    value={updateCheckUrl}
                    onChangeText={setUpdateCheckUrl}
                    mode="outlined"
                    style={styles.input}
                    placeholder={DEFAULT_UPDATE_URL}
                />
                <Button mode="contained" onPress={handleSaveUpdateUrl} style={styles.button}>
                    Save Update URL
                </Button>

                <Button
                    mode="outlined"
                    onPress={handleCheckForUpdates}
                    style={styles.button}
                    loading={checkingUpdate}
                    disabled={checkingUpdate}
                >
                    Check for Updates
                </Button>

                {lastUpdateCheck && (
                    <Text variant="bodySmall" style={{ marginTop: 10, color: theme.colors.onSurfaceVariant }}>
                        Last checked: {lastUpdateCheck.toLocaleString()}
                    </Text>
                )}
            </View>

            <Divider style={styles.divider} />

            <View style={styles.section}>
                <Button
                    mode="outlined"
                    onPress={() => {
                        Alert.alert(
                            'Logout',
                            'Are you sure you want to logout? Any unsynced data will be lost from this device.',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Logout', onPress: useStore.getState().logout, style: 'destructive' }
                            ]
                        );
                    }}
                    style={{ borderColor: 'red' }}
                    textColor="red"
                >
                    Logout
                </Button>
            </View>

            <View style={{ height: 50 }} />

            <Portal>
                <Dialog visible={urlDialogVisible} onDismiss={() => setUrlDialogVisible(false)}>
                    <Dialog.Title>Import from URL</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Direct JSON Link"
                            value={importUrl}
                            onChangeText={setImportUrl}
                            mode="outlined"
                            autoCapitalize="none"
                            keyboardType="url"
                        />
                        <View style={styles.radioContainer}>
                            <Text style={styles.radioLabel}>Data Type:</Text>
                            <RadioButton.Group onValueChange={setImportType} value={importType}>
                                <View style={styles.radioRow}>
                                    <RadioButton value="products" />
                                    <Text>Products</Text>
                                </View>
                                <View style={styles.radioRow}>
                                    <RadioButton value="invoices" />
                                    <Text>Invoices</Text>
                                </View>
                                <View style={styles.radioRow}>
                                    <RadioButton value="customers" />
                                    <Text>Customers</Text>
                                </View>
                            </RadioButton.Group>
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setUrlDialogVisible(false)}>Cancel</Button>
                        <Button onPress={handleUrlImport}>Import</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flexGrow: 1,
    },
    section: {
        marginBottom: 10,
    },
    sectionTitle: {
        marginBottom: 15,
        fontWeight: 'bold',
    },
    input: {
        marginBottom: 15,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    saveButton: {
        marginTop: 10,
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 20,
    },
    radioContainer: {
        marginTop: 15,
    },
    radioLabel: {
        marginBottom: 5,
        fontWeight: 'bold',
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
});
