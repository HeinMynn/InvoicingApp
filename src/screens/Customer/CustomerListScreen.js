import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { List, FAB, Text, IconButton, Portal, Modal, Divider, useTheme, Searchbar } from 'react-native-paper';
import { Swipeable } from 'react-native-gesture-handler';
import { useStore } from '../../store/useStore';

export default function CustomerListScreen({ navigation }) {
    const customers = useStore((state) => state.customers);
    const invoices = useStore((state) => state.invoices);
    const deleteCustomer = useStore((state) => state.deleteCustomer);
    const theme = useTheme();

    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery)
    );

    const getCustomerInvoices = (customerId) => {
        return invoices.filter(inv => inv.customerId === customerId);
    };

    const handleDelete = (customer) => {
        const customerInvoices = getCustomerInvoices(customer.id);
        if (customerInvoices.length > 0) {
            Alert.alert(
                'Cannot Delete Customer',
                `This customer has ${customerInvoices.length} invoice(s).Please delete the invoices first.`,
                [{ text: 'OK' }]
            );
        } else {
            Alert.alert(
                'Delete Customer',
                `Are you sure you want to delete ${customer.name}?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteCustomer(customer.id) },
                ]
            );
        }
    };

    const handlePreview = (customer) => {
        setSelectedCustomer(customer);
        setPreviewModalVisible(true);
    };

    let rowRefs = new Map();

    const closeRow = (id) => {
        [...rowRefs.entries()].forEach(([key, ref]) => {
            if (key !== id && ref) ref.close();
        });
    };

    const renderRightActions = (customer, ref) => {
        return (
            <View style={styles.swipeActions}>
                <View style={styles.previewAction}>
                    <IconButton
                        icon="account"
                        iconColor="white"
                        onPress={() => {
                            ref.close();
                            handlePreview(customer);
                        }}
                    />
                </View>
                <View style={styles.editAction}>
                    <IconButton
                        icon="pencil"
                        iconColor="white"
                        onPress={() => {
                            ref.close();
                            navigation.navigate('CustomerForm', { customer });
                        }}
                    />
                </View>
                <View style={styles.deleteAction}>
                    <IconButton
                        icon="delete"
                        iconColor="white"
                        onPress={() => {
                            ref.close();
                            handleDelete(customer);
                        }}
                    />
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Searchbar
                placeholder="Search customers..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
            />
            <FlatList
                data={filteredCustomers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const customerInvoices = getCustomerInvoices(item.id);
                    return (
                        <Swipeable
                            ref={(ref) => {
                                if (ref && !rowRefs.get(item.id)) {
                                    rowRefs.set(item.id, ref);
                                }
                            }}
                            onSwipeableWillOpen={() => closeRow(item.id)}
                            renderRightActions={() => renderRightActions(item, rowRefs.get(item.id))}
                        >
                            <List.Item
                                title={item.name}
                                description={`${item.phone}${item.address ? ` - ${item.address}` : ''}\n${customerInvoices.length} invoice(s)`}
                                descriptionNumberOfLines={3}
                                left={(props) => <List.Icon {...props} icon="account" />}
                                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                                onPress={() => {
                                    // Close swipeable if open? Maybe not needed for simple press
                                    navigation.navigate('CustomerInvoices', { customer: item });
                                }}
                            />
                        </Swipeable>
                    );
                }}
                ListEmptyComponent={<Text style={styles.empty}>No customers found</Text>}
                ItemSeparatorComponent={() => <Divider />}
            />
            <FAB
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                icon="plus"
                color={theme.colors.onPrimary}
                onPress={() => navigation.navigate('CustomerForm')}
            />

            {/* Customer Info Preview Modal */}
            <Portal>
                <Modal
                    visible={previewModalVisible}
                    onDismiss={() => setPreviewModalVisible(false)}
                    contentContainerStyle={styles.modalContent}
                >
                    {selectedCustomer && (
                        <View>
                            <Text variant="titleLarge" style={{ marginBottom: 10 }}>
                                Customer Information
                            </Text>
                            <Divider style={{ marginBottom: 10 }} />
                            <Text variant="titleMedium" style={{ marginBottom: 5 }}>
                                {selectedCustomer.name}
                            </Text>
                            <Text style={{ marginBottom: 3 }}>
                                📞 {selectedCustomer.phone}
                            </Text>
                            <Text style={{ marginBottom: 10 }}>
                                📍 {selectedCustomer.address}
                            </Text>
                            <Divider style={{ marginVertical: 10 }} />
                            <Text style={{ color: '#666' }}>
                                Total Invoices: {getCustomerInvoices(selectedCustomer.id).length}
                            </Text>
                        </View>
                    )}
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchBar: {
        margin: 10,
        elevation: 2,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    empty: {
        textAlign: 'center',
        marginTop: 20,
        color: '#666',
    },
    swipeActions: {
        flexDirection: 'row',
    },
    previewAction: {
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
    },
    editAction: {
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
    },
    deleteAction: {
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
    },
    modalContent: {
        padding: 20,
        margin: 20,
        borderRadius: 10,
        maxHeight: '80%',
    },
});
