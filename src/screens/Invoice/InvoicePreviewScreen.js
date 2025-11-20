import React, { useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Image } from 'react-native';
import { Text, Button, Divider } from 'react-native-paper';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { useStore } from '../../store/useStore';

export default function InvoicePreviewScreen({ route, navigation }) {
    const { invoice } = route.params;
    const shopInfo = useStore((state) => state.shopInfo);
    const viewShotRef = useRef();
    const [saving, setSaving] = useState(false);
    const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);

        try {
            if (!permissionResponse || permissionResponse.status !== 'granted') {
                const { status } = await requestPermission();
                if (status !== 'granted') {
                    Alert.alert('Permission required', 'Please grant permission to save images to your gallery.');
                    setSaving(false);
                    return;
                }
            }

            const uri = await captureRef(viewShotRef, {
                format: 'png',
                quality: 0.8,
            });

            await MediaLibrary.saveToLibraryAsync(uri);
            Alert.alert('Success', 'Invoice saved to gallery!');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save invoice.');
        } finally {
            setSaving(false);
        }
    };

    const formatPrice = (price) => {
        return Math.round(parseFloat(price || 0)).toString();
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <ScrollView horizontal contentContainerStyle={{ flexGrow: 1 }}>
                    <ViewShot ref={viewShotRef} style={styles.invoiceContainer} options={{ format: 'png', quality: 0.9 }}>
                        {/* Shop Info Header */}
                        <View style={styles.shopHeader}>
                            {shopInfo.logo && <Image source={{ uri: shopInfo.logo }} style={styles.logo} />}
                            <View style={styles.shopDetails}>
                                <Text variant="headlineSmall" style={styles.shopName}>{shopInfo.name || 'My Shop'}</Text>
                                {shopInfo.address ? <Text style={styles.shopText}>{shopInfo.address}</Text> : null}
                                {shopInfo.phone ? <Text style={styles.shopText}>{shopInfo.phone}</Text> : null}
                            </View>
                        </View>

                        <Divider style={styles.divider} />

                        <View style={styles.row}>
                            <View>
                                <Text variant="titleMedium">Invoice #: {invoice.id.slice(-6)}</Text>
                                <Text>Date: {new Date(invoice.date).toLocaleDateString()}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text variant="titleMedium">Customer:</Text>
                                <Text>{invoice.customerName}</Text>
                            </View>
                        </View>

                        <Divider style={styles.divider} />

                        <View style={styles.tableHeader}>
                            <View style={styles.colName}>
                                <Text style={styles.bold}>Item</Text>
                            </View>
                            <View style={styles.colQty}>
                                <Text style={styles.bold}>Qty</Text>
                            </View>
                            <View style={styles.colPrice}>
                                <Text style={styles.bold}>Price</Text>
                            </View>
                            <View style={styles.colTotal}>
                                <Text style={styles.bold}>Total</Text>
                            </View>
                        </View>
                        <Divider />

                        {invoice.items.map((item, index) => {
                            // Merge variable attributes and selected options for unified display
                            const allAttributes = {
                                ...(item.variableAttributes || {}),
                                ...(item.selectedOptions || {})
                            };

                            const renderAttributes = (attributes) => {
                                if (!attributes) return null;

                                const entries = Object.entries(attributes);
                                if (entries.length === 0) return null;

                                // Case-insensitive lookup for Width and Height
                                const widthEntry = entries.find(([k]) => k.toLowerCase() === 'width');
                                const heightEntry = entries.find(([k]) => k.toLowerCase() === 'height');

                                const widthVal = widthEntry ? widthEntry[1]?.toString().trim() : null;
                                const heightVal = heightEntry ? heightEntry[1]?.toString().trim() : null;

                                let dimensionString = '';
                                if (widthVal && heightVal) {
                                    dimensionString = `${widthVal}x${heightVal}"`;
                                }

                                // Filter out Width/Height from other attributes ONLY if used in dimensionString
                                const otherAttributes = entries
                                    .filter(([k]) => {
                                        const key = k.toLowerCase();
                                        if (dimensionString && (key === 'width' || key === 'height')) {
                                            return false;
                                        }
                                        return true;
                                    })
                                    .map(([key, val]) => `${key}: ${val}`)
                                    .join(', ');

                                if (!dimensionString && !otherAttributes) return null;

                                return (
                                    <Text style={styles.attributeText}>
                                        {dimensionString}
                                        {dimensionString && otherAttributes ? ', ' : ''}
                                        {otherAttributes}
                                    </Text>
                                );
                            };

                            return (
                                <View key={index} style={styles.tableRow}>
                                    <View style={styles.colName}>
                                        <Text>{item.productName || item.name.split('(')[0].trim()}</Text>

                                        {/* Render Merged Attributes */}
                                        {renderAttributes(allAttributes)}

                                        {item.note ? <Text style={styles.note}>Note: {item.note}</Text> : null}
                                        {(parseFloat(item.extraCharges) > 0 || parseFloat(item.discount) > 0) && (
                                            <Text style={styles.note}>
                                                {parseFloat(item.extraCharges) > 0 ? `+Extras: ${formatPrice(item.extraCharges)} ` : ''}
                                                {parseFloat(item.discount) > 0 ? `-Disc: ${formatPrice(item.discount)}` : ''}
                                            </Text>
                                        )}
                                    </View>
                                    <View style={styles.colQty}>
                                        <Text>{item.quantity}</Text>
                                    </View>
                                    <View style={styles.colPrice}>
                                        <Text style={{ textAlign: 'right' }}>{formatPrice(item.price)}</Text>
                                    </View>
                                    <View style={styles.colTotal}>
                                        <Text style={{ textAlign: 'right' }}>
                                            {formatPrice((item.price * item.quantity) + parseFloat(item.extraCharges || 0) - parseFloat(item.discount || 0))}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}

                        <Divider style={styles.divider} />

                        <View style={styles.totalContainer}>
                            <Text variant="headlineSmall">Total: {formatPrice(invoice.total)}</Text>
                        </View>

                        {(invoice.note || invoice.deliveryInfo) && (
                            <View style={styles.footer}>
                                {invoice.note ? <Text>Note: {invoice.note}</Text> : null}
                                {invoice.deliveryInfo ? <Text>Delivery: {invoice.deliveryInfo}</Text> : null}
                            </View>
                        )}
                    </ViewShot>
                </ScrollView>
            </ScrollView>

            <View style={styles.actions}>
                <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving} icon="download">
                    Save as Image
                </Button>
            </View>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        padding: 20,
    },
    invoiceContainer: {
        backgroundColor: 'white',
        padding: 30, // Increased padding for "bigger" feel
        borderRadius: 8,
        elevation: 4,
        minWidth: 600, // Force a wider canvas if possible, though on mobile it's limited by screen. 
        // For "export", ViewShot captures the view. 
        // To make it "bigger" in export, we can increase the content size.
    },
    shopHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 80, // Bigger logo
        height: 80,
        borderRadius: 40,
        marginRight: 20,
    },
    shopDetails: {
        flex: 1,
    },
    shopName: {
        fontWeight: 'bold',
        fontSize: 24, // Bigger shop name
    },
    shopText: {
        fontSize: 14,
        color: '#555',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    divider: {
        marginVertical: 15,
        height: 2,
        backgroundColor: '#000',
    },
    tableHeader: {
        flexDirection: 'row',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingBottom: 5,
    },
    tableRow: {
        flexDirection: 'row',
        marginVertical: 8, // More spacing between rows
        alignItems: 'flex-start',
    },
    colName: { flex: 1, paddingRight: 10 },
    colQty: { width: 50, alignItems: 'center' },
    colPrice: { width: 80, alignItems: 'flex-end' },
    colTotal: { width: 80, alignItems: 'flex-end' },
    bold: { fontWeight: 'bold', fontSize: 16 },
    note: { fontSize: 12, color: '#666', fontStyle: 'italic', marginTop: 2 },
    attributeText: {
        fontSize: 12,
        color: '#888', // Light font color
        marginTop: 2,
    },
    totalContainer: {
        alignItems: 'flex-end',
        marginTop: 20,
    },
    footer: {
        marginTop: 30,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 15,
    },
    actions: {
        padding: 20,
        backgroundColor: 'white',
        elevation: 8,
    },
});
