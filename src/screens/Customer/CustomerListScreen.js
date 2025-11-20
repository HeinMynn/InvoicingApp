import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { List, FAB, Text, IconButton, Portal, Modal, Divider } from 'react-native-paper';
import { Swipeable } from 'react-native-gesture-handler';
import { useStore } from '../../store/useStore';

export default function CustomerListScreen({ navigation }) {
    const customers = useStore((state) => state.customers);
    const invoices = useStore((state) => state.invoices);
    const deleteCustomer = useStore((state) => state.deleteCustomer);

    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const getCustomerInvoices = (customerId) => {
        return invoices.filter(inv => inv.customerId === customerId);
    };

    const handleDelete = (customer) => {
        const customerInvoices = getCustomerInvoices(customer.id);
        if (customerInvoices.length > 0) {
            Alert.alert(
                'Cannot Delete Customer',
                `This customer has ${customerInvoices.length} invoice(s). Please delete the invoices first.`,
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

    const renderRightActions = (customer) => {
        return (
            <View style={styles.swipeActions}>
                <View style={styles.previewAction}>
                    <IconButton
                        icon="account"
                        iconColor="white"
                        onPress={() => handlePreview(customer)}
                    />
                </View>
                <View style={styles.editAction}>
                    <IconButton
                        icon="pencil"
                        iconColor="white"
                        onPress={() => navigation.navigate('CustomerForm', { customer })}
                    />
                </View>
                <View style={styles.deleteAction}>
                    <IconButton
                        icon="delete"
                        iconColor="white"
                        onPress={() => handleDelete(customer)}
                    />
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={customers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const customerInvoices = getCustomerInvoices(item.id);
                    return (
                        <Swipeable renderRightActions={() => renderRightActions(item)}>
                            <List.Item
                                title={item.name}
                                description={`${item.phone} - ${item.address}\n${customerInvoices.length} invoice(s)`}
                                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                                onPress={() => navigation.navigate('CustomerInvoices', { customer: item })}
                                style={{ backgroundColor: 'white' }}
                            />
                        </Swipeable>
                    );
                }}
                ListEmptyComponent={<Text style={styles.empty}>No customers found</Text>}
            />
            <FAB
                style={styles.fab}
                icon="plus"
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
        backgroundColor: '#fff',
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
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 10,
        maxHeight: '80%',
    },
});
