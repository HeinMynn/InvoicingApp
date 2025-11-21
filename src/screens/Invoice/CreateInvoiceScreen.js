import React, { useState, useMemo, useEffect } from 'react';
import { View, ScrollView, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Keyboard, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Card, IconButton, Menu, Divider, Portal, Modal, List, HelperText, useTheme } from 'react-native-paper';
import { useStore } from '../../store/useStore';
import { useCurrency } from '../../hooks/useCurrency';

export default function CreateInvoiceScreen({ navigation, route }) {
    const customers = useStore((state) => state.customers);
    const products = useStore((state) => state.products);
    const addInvoice = useStore((state) => state.addInvoice);
    const updateInvoice = useStore((state) => state.updateInvoice);
    const addCustomer = useStore((state) => state.addCustomer); // Add this
    const shopInfo = useStore((state) => state.shopInfo);
    const theme = useTheme();
    const currency = useCurrency();

    const editingInvoice = route.params?.invoice; // If provided, we're editing

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [note, setNote] = useState('');
    const [deliveryInfo, setDeliveryInfo] = useState('');
    const [gateName, setGateName] = useState('');
    const [deposit, setDeposit] = useState('0');
    const [discount, setDiscount] = useState('0');
    const [deliveryMenuVisible, setDeliveryMenuVisible] = useState(false);

    useEffect(() => {
        if (editingInvoice) {
            const customer = customers.find(c => c.id === editingInvoice.customerId);
            setSelectedCustomer(customer || null);
            setSelectedProducts(editingInvoice.items || []);
            setNote(editingInvoice.note || '');
            setDeliveryInfo(editingInvoice.deliveryInfo || '');
            setGateName(editingInvoice.gateName || '');
            setDeposit(editingInvoice.deposit ? String(editingInvoice.deposit) : '0');
            setDiscount(editingInvoice.discount ? String(editingInvoice.discount) : '0');
        }
    }, [editingInvoice]);

    // Modal States
    const [customerModalVisible, setCustomerModalVisible] = useState(false);
    const [newCustomerModalVisible, setNewCustomerModalVisible] = useState(false); // New modal state
    const [customerSearchQuery, setCustomerSearchQuery] = useState(''); // Search state
    const [productModalVisible, setProductModalVisible] = useState(false);
    const [productSearchQuery, setProductSearchQuery] = useState('');

    // New Customer Form State
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    const [newCustomerAddress, setNewCustomerAddress] = useState('');

    // Filtered Customers
    const filteredCustomers = useMemo(() => {
        if (!customerSearchQuery) return customers;
        return customers.filter(c =>
            c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
            (c.phone && c.phone.includes(customerSearchQuery))
        );
    }, [customers, customerSearchQuery]);

    // Duplicate Check
    const possibleDuplicates = useMemo(() => {
        if (!newCustomerName.trim() && !newCustomerPhone.trim()) return [];
        return customers.filter(c =>
            (newCustomerName.trim() && c.name.toLowerCase().includes(newCustomerName.trim().toLowerCase())) ||
            (newCustomerPhone.trim() && c.phone.includes(newCustomerPhone.trim()))
        );
    }, [newCustomerName, newCustomerPhone, customers]);

    const handleCreateCustomer = () => {
        if (!newCustomerName.trim()) {
            alert('Customer name is required');
            return;
        }

        const newCustomer = {
            name: newCustomerName.trim(),
            phone: newCustomerPhone.trim(),
            address: newCustomerAddress.trim()
        };

        addCustomer(newCustomer);

        // Find the newly added customer (it will have an ID generated in store)
        setTimeout(() => {
            const allCustomers = useStore.getState().customers;
            const created = allCustomers.find(c => c.name === newCustomer.name && c.phone === newCustomer.phone);
            if (created) {
                setSelectedCustomer(created);
            }
        }, 50);

        setNewCustomerModalVisible(false);
        setNewCustomerName('');
        setNewCustomerPhone('');
        setNewCustomerAddress('');
    };

    const filteredProducts = useMemo(() => {
        if (!productSearchQuery) return products;
        return products.filter(p =>
            p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
            (p.variables && p.variables.some(v => v.name && v.name.toLowerCase().includes(productSearchQuery.toLowerCase())))
        );
    }, [products, productSearchQuery]);

    const [editingItem, setEditingItem] = useState(null); // Copy of the item being edited
    const [editItemModalVisible, setEditItemModalVisible] = useState(false);

    // Static Options Selection
    const [optionsModalVisible, setOptionsModalVisible] = useState(false);
    const [pendingProduct, setPendingProduct] = useState(null); // { product, variable }
    const [selectedOptions, setSelectedOptions] = useState({}); // { 'Color': 'Red' }

    const total = useMemo(() => {
        return selectedProducts.reduce((sum, item) => {
            const lineTotal = (parseFloat(item.price) * item.quantity) + (parseFloat(item.extraCharges || 0)) - (parseFloat(item.discount || 0));
            return sum + lineTotal;
        }, 0);
    }, [selectedProducts]);

    const initiateAddProduct = (product, variable = null) => {
        if (product.staticOptions && product.staticOptions.length > 0) {
            // Auto-select options with only one value
            const autoSelected = {};
            const needsSelection = [];

            product.staticOptions.forEach(opt => {
                if (opt.values && opt.values.length === 1) {
                    autoSelected[opt.name] = opt.values[0];
                } else if (opt.values && opt.values.length > 1) {
                    needsSelection.push(opt);
                }
            });

            // If all options have only one value, add directly
            if (needsSelection.length === 0) {
                addProductToInvoice(product, variable, autoSelected);
                setProductModalVisible(false);
                return;
            }

            // Otherwise, show modal with pre-selected single-value options
            setPendingProduct({ product, variable });
            setSelectedOptions(autoSelected);
            setOptionsModalVisible(true);
            setProductModalVisible(false);
        } else {
            addProductToInvoice(product, variable, {});
            setProductModalVisible(false);
        }
    };

    const confirmAddProductWithOptions = () => {
        // Validate that all options are selected
        const missingOptions = pendingProduct.product.staticOptions.filter(opt => !selectedOptions[opt.name]);
        if (missingOptions.length > 0) {
            alert(`Please select ${missingOptions.map(o => o.name).join(', ')}`);
            return;
        }
        addProductToInvoice(pendingProduct.product, pendingProduct.variable, selectedOptions);
        setOptionsModalVisible(false);
        setPendingProduct(null);
    };

    const addProductToInvoice = (product, variable, options) => {
        const price = variable ? (variable.salePrice || variable.price) : (product.salePrice || product.price);
        let name = variable ? `${product.name} (${variable.name})` : product.name;

        // Append options to name
        const optionString = Object.entries(options).map(([key, value]) => `${key}: ${value}`).join(', ');
        if (optionString) {
            name += ` [${optionString}]`;
        }

        // Collect static attributes (non-variation attributes from product)
        const staticAttributes = {};
        if (product.selectedAttributes) {
            product.selectedAttributes.forEach(attr => {
                if (!attr.useAsVariation && attr.selectedValues && attr.selectedValues.length > 0) {
                    // For non-variation attributes, use the first selected value
                    staticAttributes[attr.name] = attr.selectedValues[0];
                }
            });
        }

        // Check if the same product+variable+options already exists
        const existingItemIndex = selectedProducts.findIndex(item =>
            item.productId === product.id &&
            item.variableId === variable?.id &&
            JSON.stringify(item.selectedOptions) === JSON.stringify(options)
        );

        if (existingItemIndex !== -1) {
            // Item exists, increment quantity
            const updatedProducts = [...selectedProducts];
            updatedProducts[existingItemIndex] = {
                ...updatedProducts[existingItemIndex],
                quantity: updatedProducts[existingItemIndex].quantity + 1
            };
            setSelectedProducts(updatedProducts);
        } else {
            // Item doesn't exist, add new
            setSelectedProducts([...selectedProducts, {
                id: Date.now().toString(), // unique id for this line item
                productId: product.id,
                variableId: variable?.id,
                name,
                price: price || '0',
                quantity: 1,
                discount: '0',
                extraCharges: '0',
                note: '',
                selectedOptions: { ...options, ...staticAttributes }, // Merge manual options with static attributes
                variableAttributes: variable?.attributes, // Store attributes for formatting (e.g. Width, Height)
                productName: product.name // Store original product name to avoid parsing issues in preview
            }]);
        }
    };

    const updateLineItem = (id, field, value) => {
        setSelectedProducts(selectedProducts.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const removeLineItem = (id) => {
        setSelectedProducts(selectedProducts.filter(item => item.id !== id));
    };

    const openEditModal = (item) => {
        setEditingItem({ ...item });
        setEditItemModalVisible(true);
    };

    const saveEditedItem = () => {
        setSelectedProducts(selectedProducts.map(item => item.id === editingItem.id ? editingItem : item));
        setEditItemModalVisible(false);
        setEditingItem(null);
    };

    const handleSave = () => {
        if (!selectedCustomer) {
            alert('Please select a customer');
            return;
        }
        if (selectedProducts.length === 0) {
            alert('Please add at least one product');
            return;
        }

        const invoiceData = {
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            customerAddress: selectedCustomer.address || '',
            customerPhone: selectedCustomer.phone || '',
            items: selectedProducts,
            total,
            note,
            deliveryInfo,
            gateName: deliveryInfo === 'ကားဂိတ်ချ' ? gateName : '',
            deposit: parseFloat(deposit || 0),
            discount: parseFloat(discount || 0)
        };

        if (editingInvoice) {
            updateInvoice(editingInvoice.id, invoiceData);
        } else {
            addInvoice(invoiceData);
        }
        navigation.goBack();
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1, backgroundColor: theme.colors.background }}
                keyboardVerticalOffset={100}
            >
                <ScrollView contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}>
                    {/* Customer Section */}
                    <Card style={styles.card}>
                        <Card.Title title="Customer" />
                        <Card.Content>
                            {selectedCustomer ? (
                                <View>
                                    <Text variant="titleMedium">{selectedCustomer.name}</Text>
                                    <Text>{selectedCustomer.phone}</Text>
                                    <Text>{selectedCustomer.address}</Text>
                                    <View style={{ flexDirection: 'row', marginTop: 10 }}>
                                        <Button mode="outlined" onPress={() => setCustomerModalVisible(true)} style={{ marginRight: 10, flex: 1 }}>
                                            Change (Existing)
                                        </Button>
                                        <Button mode="contained" onPress={() => setNewCustomerModalVisible(true)} style={{ flex: 1 }}>
                                            New Customer
                                        </Button>
                                    </View>
                                </View>
                            ) : (
                                <View style={{ flexDirection: 'row' }}>
                                    <Button mode="outlined" onPress={() => setCustomerModalVisible(true)} style={{ marginRight: 10, flex: 1 }}>
                                        Existing Customer
                                    </Button>
                                    <Button mode="contained" onPress={() => setNewCustomerModalVisible(true)} style={{ flex: 1 }}>
                                        New Customer
                                    </Button>
                                </View>
                            )}
                        </Card.Content>
                    </Card>

                    {/* Products Section */}
                    <Card style={styles.card}>
                        <Card.Title title="Products" right={(props) => <Button onPress={() => setProductModalVisible(true)}>Add</Button>} />
                        <Card.Content>
                            {selectedProducts.map((item) => (
                                <View key={item.id}>
                                    <View style={styles.lineItem}>
                                        <View style={{ flex: 2 }}>
                                            <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
                                            <Text>Price: {item.price} {currency}</Text>
                                            {item.note ? <Text style={{ fontStyle: 'italic', color: '#666' }}>Note: {item.note}</Text> : null}
                                            {(parseFloat(item.extraCharges) > 0 || parseFloat(item.discount) > 0) && (
                                                <Text style={{ fontSize: 12, color: '#666' }}>
                                                    {parseFloat(item.extraCharges) > 0 ? `+ Extras: ${item.extraCharges} ${currency} ` : ''}
                                                    {parseFloat(item.discount) > 0 ? `- Disc: ${item.discount} ${currency}` : ''}
                                                </Text>
                                            )}
                                        </View>
                                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                                            <IconButton icon="minus" size={20} onPress={() => updateLineItem(item.id, 'quantity', Math.max(1, item.quantity - 1))} />
                                            <Text>{item.quantity}</Text>
                                            <IconButton icon="plus" size={20} onPress={() => updateLineItem(item.id, 'quantity', item.quantity + 1)} />
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={{ fontWeight: 'bold' }}>
                                                {Math.round((item.price * item.quantity) + parseFloat(item.extraCharges || 0) - parseFloat(item.discount || 0))} {currency}
                                            </Text>
                                            <View style={{ flexDirection: 'row' }}>
                                                <IconButton icon="pencil" size={20} onPress={() => openEditModal(item)} />
                                                <IconButton icon="delete" size={20} iconColor="red" onPress={() => removeLineItem(item.id)} />
                                            </View>
                                        </View>
                                    </View>
                                    <Divider />
                                </View>
                            ))}
                            <View style={styles.totalRow}>
                                <Text variant="titleLarge">Total:</Text>
                                <Text variant="titleLarge">{total} {currency}</Text>
                            </View>
                        </Card.Content>
                    </Card>

                    {/* Additional Info */}
                    <Card style={styles.card}>
                        <Card.Content>
                            <TextInput
                                label="Deposit Amount"
                                value={deposit}
                                onChangeText={setDeposit}
                                keyboardType="numeric"
                                mode="outlined"
                                style={styles.input}
                            />
                            <TextInput
                                label="Discount Amount"
                                value={discount}
                                onChangeText={setDiscount}
                                keyboardType="numeric"
                                mode="outlined"
                                style={styles.input}
                            />
                            <TextInput
                                label="Note (Optional)"
                                value={note}
                                onChangeText={setNote}
                                mode="outlined"
                                style={styles.input}
                            />

                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => {
                                    Keyboard.dismiss();
                                    setDeliveryMenuVisible(true);
                                }}
                                style={[styles.input, {
                                    borderWidth: 1,
                                    borderColor: theme.colors.outline,
                                    borderRadius: 4,
                                    padding: 16,
                                    backgroundColor: theme.colors.surface,
                                    justifyContent: 'center',
                                    minHeight: 56,
                                }]}
                            >
                                <Text variant="bodySmall" style={{ color: deliveryInfo ? theme.colors.onSurface : theme.colors.onSurfaceVariant, marginBottom: deliveryInfo ? 4 : 0 }}>
                                    Delivery Service (Optional)
                                </Text>
                                {deliveryInfo && (
                                    <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                                        {deliveryInfo}
                                    </Text>
                                )}
                                <IconButton
                                    icon="menu-down"
                                    size={24}
                                    style={{ position: 'absolute', right: 0, top: 4 }}
                                    iconColor={theme.colors.onSurfaceVariant}
                                />
                            </TouchableOpacity>

                            <Portal>
                                <Modal
                                    visible={deliveryMenuVisible}
                                    onDismiss={() => setDeliveryMenuVisible(false)}
                                    contentContainerStyle={styles.modalContainer}
                                >
                                    <Card>
                                        <Card.Title title="Select Delivery Service" />
                                        <Card.Content>
                                            {(shopInfo.deliveryOptions || []).map((option, index) => (
                                                <List.Item
                                                    key={index}
                                                    title={option}
                                                    onPress={() => {
                                                        setDeliveryInfo(option);
                                                        setDeliveryMenuVisible(false);
                                                    }}
                                                />
                                            ))}
                                            <Divider />
                                            <List.Item title="Clear" onPress={() => { setDeliveryInfo(''); setGateName(''); setDeliveryMenuVisible(false); }} />
                                        </Card.Content>
                                        <Card.Actions>
                                            <Button onPress={() => setDeliveryMenuVisible(false)}>Cancel</Button>
                                        </Card.Actions>
                                    </Card>
                                </Modal>
                            </Portal>

                            {deliveryInfo === 'ကားဂိတ်ချ' && (
                                <TextInput
                                    label="ကားဂိတ်နာမည် (Optional)"
                                    value={gateName}
                                    onChangeText={setGateName}
                                    mode="outlined"
                                    style={styles.input}
                                />
                            )}
                        </Card.Content>
                    </Card>
                </ScrollView>
            </KeyboardAvoidingView>

            <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
                <Button mode="contained" onPress={handleSave} style={styles.saveButton}>
                    Create Invoice
                </Button>
            </View>

            {/* Customer Selection Modal */}
            <Portal>
                <Modal visible={customerModalVisible} onDismiss={() => setCustomerModalVisible(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface, width: '98%', height: '95%', margin: 0, marginTop: 20, alignSelf: 'center' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text variant="titleLarge">Select Customer</Text>
                        <IconButton icon="close" size={24} onPress={() => setCustomerModalVisible(false)} />
                    </View>
                    <TextInput
                        placeholder="Search Customer..."
                        value={customerSearchQuery}
                        onChangeText={setCustomerSearchQuery}
                        mode="outlined"
                        style={{ marginBottom: 10 }}
                        dense
                    />
                    <FlatList
                        data={filteredCustomers}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <List.Item
                                title={item.name}
                                description={`${item.phone || 'No phone'}${item.address ? '\n' + item.address : ''}`}
                                descriptionNumberOfLines={3}
                                onPress={() => {
                                    setSelectedCustomer(item);
                                    setCustomerModalVisible(false);
                                }}
                            />
                        )}
                    />
                </Modal>
            </Portal>


            {/* New Customer Modal */}
            <Portal>
                <Modal
                    visible={newCustomerModalVisible}
                    onDismiss={() => setNewCustomerModalVisible(false)}
                    contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface, width: '98%', height: '95%', margin: 0, marginTop: 20, alignSelf: 'center', justifyContent: 'flex-start' }]}
                >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                        <Text variant="titleLarge">Add New Customer</Text>
                        <IconButton icon="close" size={24} onPress={() => setNewCustomerModalVisible(false)} />
                    </View>

                    <TextInput
                        label="Name *"
                        value={newCustomerName}
                        onChangeText={setNewCustomerName}
                        mode="outlined"
                        style={styles.input}
                    />
                    <TextInput
                        label="Phone"
                        value={newCustomerPhone}
                        onChangeText={setNewCustomerPhone}
                        keyboardType="phone-pad"
                        mode="outlined"
                        style={styles.input}
                    />
                    <TextInput
                        label="Address"
                        value={newCustomerAddress}
                        onChangeText={setNewCustomerAddress}
                        mode="outlined"
                        style={styles.input}
                        multiline
                    />

                    {possibleDuplicates.length > 0 && (
                        <View style={{ marginTop: 10, flex: 1 }}>
                            <Text variant="titleSmall" style={{ marginBottom: 5 }}>
                                Similar customers found ({possibleDuplicates.length}):
                            </Text>
                            <Text variant="bodySmall" style={{ marginBottom: 5, color: theme.colors.outline }}>
                                Tap to select an existing customer instead:
                            </Text>
                            <FlatList
                                data={possibleDuplicates}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <List.Item
                                        title={item.name}
                                        description={`${item.phone || 'No phone'}${item.address ? ' • ' + item.address : ''}`}
                                        left={props => <List.Icon {...props} icon="account" color={theme.colors.primary} />}
                                        onPress={() => {
                                            setSelectedCustomer(item);
                                            setNewCustomerModalVisible(false);
                                            setNewCustomerName('');
                                            setNewCustomerPhone('');
                                            setNewCustomerAddress('');
                                        }}
                                        style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: 8, marginBottom: 5 }}
                                    />
                                )}
                            />
                        </View>
                    )}

                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                        <Button onPress={() => setNewCustomerModalVisible(false)} style={{ marginRight: 10 }}>Cancel</Button>
                        <Button mode="contained" onPress={handleCreateCustomer}>Save & Select</Button>
                    </View>
                </Modal>
            </Portal >

            {/* Product Selection Modal */}
            < Portal >
                <Modal visible={productModalVisible} onDismiss={() => setProductModalVisible(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface, width: '98%', height: '95%', margin: 0, marginTop: 20, alignSelf: 'center' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text variant="titleLarge">Select Product</Text>
                        <IconButton icon="close" size={24} onPress={() => setProductModalVisible(false)} />
                    </View>
                    <TextInput
                        placeholder="Search Products..."
                        value={productSearchQuery}
                        onChangeText={setProductSearchQuery}
                        mode="outlined"
                        style={{ marginBottom: 10 }}
                        dense
                    />
                    <FlatList
                        data={filteredProducts}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <List.Accordion
                                title={item.name}
                                description={`${item.price} ${currency}`}
                                onPress={() => {
                                    if (!item.variables || item.variables.length === 0) {
                                        initiateAddProduct(item);
                                    }
                                }}
                            >
                                {item.variables && item.variables.map(v => (
                                    <List.Item
                                        key={v.id}
                                        title={`${v.name} - ${v.salePrice || v.price} ${currency}`}
                                        onPress={() => initiateAddProduct(item, v)}
                                    />
                                ))}
                            </List.Accordion>
                        )}
                    />
                </Modal>
            </Portal >

            {/* Static Options Selection Modal */}
            < Portal >
                <Modal visible={optionsModalVisible} onDismiss={() => setOptionsModalVisible(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                    <Text variant="titleLarge" style={{ marginBottom: 10 }}>Select Options</Text>
                    <ScrollView>
                        {pendingProduct?.product.staticOptions?.map(option => (
                            <View key={option.id} style={{ marginBottom: 15 }}>
                                <Text variant="titleMedium">{option.name}</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                    {option.values.map(val => (
                                        <Button
                                            key={val}
                                            mode={selectedOptions[option.name] === val ? 'contained' : 'outlined'}
                                            onPress={() => setSelectedOptions({ ...selectedOptions, [option.name]: val })}
                                            style={{ marginRight: 5, marginBottom: 5 }}
                                            compact
                                        >
                                            {val}
                                        </Button>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                    <Button mode="contained" onPress={confirmAddProductWithOptions} style={{ marginTop: 10 }}>
                        Confirm
                    </Button>
                </Modal>
            </Portal >

            {/* Edit Line Item Modal */}
            < Portal >
                <Modal visible={editItemModalVisible} onDismiss={() => setEditItemModalVisible(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                    <Text variant="titleLarge" style={{ marginBottom: 10 }}>Customize Item</Text>
                    {editingItem && (
                        <View>
                            <Text style={{ marginBottom: 10, fontWeight: 'bold' }}>{editingItem.name}</Text>
                            <TextInput
                                label="Discount ($)"
                                value={String(editingItem.discount)}
                                onChangeText={(text) => setEditingItem({ ...editingItem, discount: text })}
                                keyboardType="numeric"
                                mode="outlined"
                                style={styles.input}
                            />
                            <TextInput
                                label="Extra Charges ($) (e.g. Embroidery)"
                                value={String(editingItem.extraCharges)}
                                onChangeText={(text) => setEditingItem({ ...editingItem, extraCharges: text })}
                                keyboardType="numeric"
                                mode="outlined"
                                style={styles.input}
                            />
                            <TextInput
                                label="Item Note"
                                value={editingItem.note}
                                onChangeText={(text) => setEditingItem({ ...editingItem, note: text })}
                                mode="outlined"
                                style={styles.input}
                            />
                            <Button mode="contained" onPress={saveEditedItem} style={{ marginTop: 10 }}>
                                Save Changes
                            </Button>
                        </View>
                    )}
                </Modal>
            </Portal >
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 10,
        paddingBottom: 80,
    },
    card: {
        marginBottom: 10,
    },
    input: {
        marginBottom: 10,
    },
    lineItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5,
        paddingVertical: 5,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 10,
        elevation: 4,
    },
    saveButton: {
        width: '100%',
    },
    modalContainer: {
        padding: 20,
        margin: 20,
    },
    modalContent: {
        padding: 20,
        margin: 10,
        borderRadius: 10,
        maxHeight: '90%',
        width: '95%',
        alignSelf: 'center',
    },
});
