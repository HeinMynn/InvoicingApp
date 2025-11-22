import React, { useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Image } from 'react-native';
import { Text, Button, Divider } from 'react-native-paper';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { useStore } from '../../store/useStore';

export default function InvoicePreviewScreen({ route, navigation }) {
    const { invoice } = route.params;
    const shopInfo = useStore((state) => state.shopInfo);
    const customers = useStore((state) => state.customers);
    const viewShotRef = useRef();
    const [saving, setSaving] = useState(false);
    const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

    // Get customer phone - fallback to customer data if not in invoice
    const getCustomerPhone = () => {
        if (invoice.customerPhone) return invoice.customerPhone;
        const customer = customers.find(c => c.id === invoice.customerId);
        return customer?.phone || '';
    };

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
                                <Text variant="headlineMedium" style={styles.shopName}>{shopInfo.name || 'My Shop'}</Text>
                                {shopInfo.nameBurmese && <Text style={styles.shopNameBurmese}>{shopInfo.nameBurmese}</Text>}
                                {shopInfo.tagline && <Text style={styles.shopSubtext}>{shopInfo.tagline}</Text>}
                            </View>
                        </View>

                        {/* Contact Info Box */}
                        <View style={styles.contactBox}>
                            <Text style={styles.contactText}>
                                {shopInfo.address && shopInfo.phone ? `${shopInfo.address} - ${shopInfo.phone}` : shopInfo.address || shopInfo.phone}
                            </Text>
                        </View>

                        {/* Customer and Date Row */}
                        <View style={styles.customerDateRow}>
                            <View style={styles.customerInfo}>
                                <Text style={styles.customerName}>{invoice.customerName}</Text>
                                {invoice.customerAddress && <Text style={styles.customerDetail}>{invoice.customerAddress}</Text>}
                                {getCustomerPhone() && <Text style={styles.customerDetail}>{getCustomerPhone()}</Text>}
                            </View>
                            <View style={styles.dateInfo}>
                                <View style={{ flexDirection: 'row' }}>
                                    <Text style={styles.label}>Date: </Text>
                                    <Text style={styles.value}>{new Date(invoice.date).toLocaleDateString()}</Text>
                                </View>
                                <View style={{ flexDirection: 'row' }}>
                                    <Text style={styles.label}>Invoice: </Text>
                                    <Text style={styles.value}>{invoice.id}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Table */}
                        <View style={styles.table}>
                            {/* Table Header */}
                            <View style={styles.tableHeaderRow}>
                                <View style={[styles.tableCell, styles.tableCellName, styles.tableHeaderCell]}>
                                    <Text style={styles.tableHeaderText}>Item</Text>
                                </View>
                                <View style={[styles.tableCell, styles.tableCellQty, styles.tableHeaderCell]}>
                                    <Text style={styles.tableHeaderText}>Qty</Text>
                                </View>
                                <View style={[styles.tableCell, styles.tableCellPrice, styles.tableHeaderCell]}>
                                    <Text style={styles.tableHeaderText}>Price</Text>
                                </View>
                                <View style={[styles.tableCell, styles.tableCellTotal, styles.tableHeaderCell]}>
                                    <Text style={styles.tableHeaderText}>Total</Text>
                                </View>
                            </View>

                            {/* Table Rows */}
                            {invoice.items.map((item, index) => {
                                const allAttributes = {
                                    ...(item.variableAttributes || {}),
                                    ...(item.selectedOptions || {})
                                };

                                const renderAttributes = (attributes) => {
                                    if (!attributes) return null;
                                    const entries = Object.entries(attributes);
                                    if (entries.length === 0) return null;

                                    // Check for Width (English or Burmese: အကျယ်)
                                    const widthEntry = entries.find(([k]) => {
                                        const key = k.toLowerCase();
                                        return key === 'width' || k === 'အကျယ်';
                                    });

                                    // Check for Height (English or Burmese: အရှည်)
                                    const heightEntry = entries.find(([k]) => {
                                        const key = k.toLowerCase();
                                        return key === 'height' || k === 'အရှည်';
                                    });

                                    const widthVal = widthEntry ? widthEntry[1]?.toString().trim() : null;
                                    const heightVal = heightEntry ? heightEntry[1]?.toString().trim() : null;

                                    let dimensionString = '';
                                    if (widthVal || heightVal) {
                                        // Show dimension if at least one is available
                                        const w = widthVal || '';
                                        const h = heightVal || '';
                                        dimensionString = `${w}×${h}`;
                                    }

                                    // Get other attributes without labels, just values separated by comma
                                    const otherAttributes = entries
                                        .filter(([k]) => {
                                            const key = k.toLowerCase();
                                            // Filter out width/height in both English and Burmese
                                            if (key === 'width' || key === 'height' || k === 'အကျယ်' || k === 'အရှည်') {
                                                return false;
                                            }
                                            return true;
                                        })
                                        .map(([key, val]) => val) // Only return value, not key
                                        .join(', ');

                                    return { dimensionString, otherAttributes };
                                };

                                const attrs = renderAttributes(allAttributes);

                                return (
                                    <View key={index} style={styles.tableDataRow}>
                                        <View style={[styles.tableCell, styles.tableCellName]}>
                                            <Text style={styles.tableCellText}>
                                                {item.productName || item.name.split('(')[0].trim()}
                                                {attrs?.dimensionString && ` - ${attrs.dimensionString}`}
                                            </Text>
                                            {attrs?.otherAttributes && (
                                                <Text style={styles.attributeText}>{attrs.otherAttributes}</Text>
                                            )}
                                            {item.note ? <Text style={styles.itemNote}>Note: {item.note}</Text> : null}
                                            {(parseFloat(item.extraCharges) > 0 || parseFloat(item.discount) > 0) && (
                                                <Text style={styles.itemNote}>
                                                    {parseFloat(item.extraCharges) > 0 ? `+Extras: ${formatPrice(item.extraCharges)} ` : ''}
                                                    {parseFloat(item.discount) > 0 ? `-Discount: ${formatPrice(item.discount)}` : ''}
                                                </Text>
                                            )}
                                        </View>
                                        <View style={[styles.tableCell, styles.tableCellQty]}>
                                            <Text style={styles.tableCellText}>{item.quantity}</Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.tableCellPrice]}>
                                            <Text style={[styles.tableCellText, styles.alignRight]}>{formatPrice(item.price)}</Text>
                                        </View>
                                        <View style={[styles.tableCell, styles.tableCellTotal]}>
                                            <Text style={[styles.tableCellText, styles.alignRight]}>
                                                {formatPrice((item.price * item.quantity) + parseFloat(item.extraCharges || 0) - parseFloat(item.discount || 0))}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}

                            {/* Delivery Fee Row */}
                            {parseFloat(invoice.deliveryFee || 0) > 0 && (
                                <View style={styles.tableDataRow}>
                                    <View style={[styles.tableCell, styles.tableCellName]}>
                                        <Text style={styles.tableCellText}>Delivery Fee</Text>
                                    </View>
                                    <View style={[styles.tableCell, styles.tableCellQty]} />
                                    <View style={[styles.tableCell, styles.tableCellPrice]} />
                                    <View style={[styles.tableCell, styles.tableCellTotal]}>
                                        <Text style={[styles.tableCellText, styles.alignRight]}>{formatPrice(invoice.deliveryFee)}</Text>
                                    </View>
                                </View>
                            )}

                            {/* Subtotal Row */}
                            <View style={styles.tableDataRow}>
                                <View style={[styles.tableCell, styles.tableCellName]} />
                                <View style={[styles.tableCell, styles.tableCellQty]} />
                                <View style={[styles.tableCell, styles.tableCellPrice]}>
                                    <Text style={[styles.tableCellText, styles.boldText]}>Subtotal:</Text>
                                </View>
                                <View style={[styles.tableCell, styles.tableCellTotal]}>
                                    <Text style={[styles.tableCellText, styles.alignRight, styles.boldText]}>{formatPrice(invoice.total + parseFloat(invoice.deliveryFee || 0))}</Text>
                                </View>
                            </View>

                            {/* Deposit Row */}
                            <View style={styles.tableDataRow}>
                                <View style={[styles.tableCell, styles.tableCellName]} />
                                <View style={[styles.tableCell, styles.tableCellQty]} />
                                <View style={[styles.tableCell, styles.tableCellPrice]}>
                                    <Text style={[styles.tableCellText, styles.boldText]}>Deposit:</Text>
                                </View>
                                <View style={[styles.tableCell, styles.tableCellTotal]}>
                                    <Text style={[styles.tableCellText, styles.alignRight, styles.boldText]}>{formatPrice(invoice.deposit || 0)}</Text>
                                </View>
                            </View>

                            {/* Discount Row */}
                            {parseFloat(invoice.discount || 0) > 0 && (
                                <View style={styles.tableDataRow}>
                                    <View style={[styles.tableCell, styles.tableCellName]} />
                                    <View style={[styles.tableCell, styles.tableCellQty]} />
                                    <View style={[styles.tableCell, styles.tableCellPrice]}>
                                        <Text style={[styles.tableCellText, styles.boldText]}>Discount:</Text>
                                    </View>
                                    <View style={[styles.tableCell, styles.tableCellTotal]}>
                                        <Text style={[styles.tableCellText, styles.alignRight, styles.boldText]}>{formatPrice(invoice.discount || 0)}</Text>
                                    </View>
                                </View>
                            )}

                            {/* Grand Total Row */}
                            <View style={styles.tableDataRow}>
                                <View style={[styles.tableCell, styles.tableCellName, { justifyContent: 'center', alignItems: 'center' }]}>
                                    {parseFloat(invoice.deliveryFee || 0) > 0 && (
                                        <View style={styles.inlineStamp}>
                                            <Text style={styles.stampText}>Deli ရှင်းပြီး</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={[styles.tableCell, styles.tableCellQty]} />
                                <View style={[styles.tableCell, styles.tableCellPrice]}>
                                    <Text style={[styles.tableCellText, styles.boldText]}>Grand Total:</Text>
                                </View>
                                <View style={[styles.tableCell, styles.tableCellTotal]}>
                                    <Text style={[styles.tableCellText, styles.alignRight, styles.boldText]}>
                                        {formatPrice(invoice.total + parseFloat(invoice.deliveryFee || 0) - (invoice.deposit || 0) - (invoice.discount || 0))}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Signature Line */}
                        <View style={styles.signatureSection}>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureLabel}>Signature</Text>
                        </View>

                        {/* Notes */}
                        {(invoice.note || invoice.deliveryInfo) && (
                            <View style={styles.notesSection}>
                                {invoice.note ? <Text style={styles.noteText}>Note: {invoice.note}</Text> : null}
                                {invoice.deliveryInfo ? (
                                    <Text style={styles.noteText}>
                                        Delivery: {invoice.deliveryInfo}
                                        {invoice.gateName ? ` (${invoice.gateName})` : ''}
                                    </Text>
                                ) : null}
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
        </View>
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
        padding: 30,
        borderRadius: 8,
        elevation: 4,
        minWidth: 800,
        position: 'relative', // For absolute positioning of stamp
    },
    // ... (existing styles)
    inlineStamp: {
        borderWidth: 3,
        borderColor: '#d32f2f',
        paddingHorizontal: 10,
        paddingVertical: 5,
        transform: [{ rotate: '-10deg' }],
        borderRadius: 5,
    },
    stampText: {
        color: '#d32f2f',
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    shopHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    logo: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginRight: 15,
    },
    shopDetails: {
        flex: 1,
    },
    shopName: {
        fontWeight: 'bold',
        fontSize: 22,
        color: '#8B0000', // Dark red color like in reference
    },
    shopNameBurmese: {
        fontWeight: '600',
        fontSize: 18,
        color: '#8B0000',
        marginTop: 2,
    },
    shopSubtext: {
        fontSize: 13,
        color: '#555',
        marginTop: 2,
    },
    contactBox: {
        borderWidth: 2,
        borderColor: '#D4AF37', // Gold color
        backgroundColor: '#FFFACD', // Light yellow
        padding: 10,
        marginBottom: 20,
        borderRadius: 4,
        alignItems: 'center',
    },
    contactText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    customerDateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingBottom: 10,
    },
    customerInfo: {
        flex: 2,
    },
    customerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 2,
    },
    customerDetail: {
        fontSize: 13,
        color: '#666',
    },
    dateInfo: {
        flex: 1,
        alignItems: 'flex-end',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    value: {
        fontSize: 14,
        color: '#000',
    },
    table: {
        borderWidth: 1,
        borderColor: '#000',
        marginBottom: 30,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#1e3a5f', // Dark blue
    },
    tableHeaderCell: {
        padding: 10,
        borderRightWidth: 1,
        borderRightColor: '#fff',
    },
    tableHeaderText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    tableDataRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#000',
    },
    tableCell: {
        padding: 10,
        borderRightWidth: 1,
        borderRightColor: '#000',
        justifyContent: 'center',
    },
    tableCellName: {
        flex: 2,
    },
    tableCellQty: {
        width: 80,
        alignItems: 'center',
    },
    tableCellPrice: {
        width: 100,
    },
    tableCellTotal: {
        width: 120,
        borderRightWidth: 0, // No border on the last column
    },
    tableCellText: {
        fontSize: 13,
        color: '#000',
    },
    attributeText: {
        fontSize: 11,
        color: '#666',
        marginTop: 3,
    },
    itemNote: {
        fontSize: 11,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 3,
    },
    alignRight: {
        textAlign: 'right',
    },
    boldText: {
        fontWeight: 'bold',
    },
    signatureSection: {
        marginTop: 40,
        marginBottom: 20,
        paddingLeft: 30,
    },
    signatureLine: {
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        width: 200,
        marginBottom: 5,
    },
    signatureLabel: {
        fontSize: 12,
        color: '#000',
    },
    notesSection: {
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
    },
    noteText: {
        fontSize: 12,
        color: '#000',
        marginBottom: 5,
    },
    actions: {
        padding: 20,
        backgroundColor: 'white',
        elevation: 8,
    },
});
