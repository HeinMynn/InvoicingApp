import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, KeyboardAvoidingView, Platform, View } from 'react-native';
import { TextInput, Button, useTheme, Card, Text, List } from 'react-native-paper';
import { useStore } from '../../store/useStore';

export default function CustomerFormScreen({ navigation, route }) {
    const addCustomer = useStore((state) => state.addCustomer);
    const updateCustomer = useStore((state) => state.updateCustomer);
    const customers = useStore((state) => state.customers);
    const theme = useTheme();

    const editingCustomer = route.params?.customer;

    const [name, setName] = useState(editingCustomer?.name || '');
    const [phone, setPhone] = useState(editingCustomer?.phone || '');
    const [address, setAddress] = useState(editingCustomer?.address || '');

    // Find possible duplicate customers
    const possibleDuplicates = useMemo(() => {
        if ((!name.trim() && !phone.trim()) || editingCustomer) return [];

        return customers.filter(customer => {
            // Skip the customer being edited
            if (editingCustomer && customer.id === editingCustomer.id) return false;

            // Check name match (case-insensitive, partial match)
            const nameMatch = name.trim() && customer.name.toLowerCase().includes(name.toLowerCase());

            // Check phone match (exact or partial)
            const phoneMatch = phone.trim() && customer.phone.includes(phone);

            return nameMatch || phoneMatch;
        });
    }, [name, phone, customers, editingCustomer]);

    const handleSave = () => {
        if (!name || !phone) {
            alert('Name and phone are required');
            return;
        }

        const customerData = { name, phone, address };

        if (editingCustomer) {
            updateCustomer(editingCustomer.id, customerData);
        } else {
            addCustomer(customerData);
        }
        navigation.goBack();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: theme.colors.background }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <ScrollView
                style={{ flex: 1, backgroundColor: theme.colors.background }}
                contentContainerStyle={[styles.container, { flexGrow: 1, paddingBottom: 100 }]}
            >
                <TextInput
                    label="Name"
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                    mode="outlined"
                />
                <TextInput
                    label="Phone"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    style={styles.input}
                    mode="outlined"
                />
                <TextInput
                    label="Address"
                    value={address}
                    onChangeText={setAddress}
                    style={styles.input}
                    mode="outlined"
                    multiline
                />

                {/* Show possible duplicates */}
                {possibleDuplicates.length > 0 && (
                    <Card style={styles.duplicatesCard}>
                        <Card.Content>
                            <Text variant="titleSmall" style={styles.duplicatesTitle}>
                                Similar customers found ({possibleDuplicates.length})
                            </Text>
                            {possibleDuplicates.map((customer) => (
                                <List.Item
                                    key={customer.id}
                                    title={customer.name}
                                    description={`${customer.phone}${customer.address ? ' • ' + customer.address : ''}`}
                                    left={(props) => <List.Icon {...props} icon="account" />}
                                    style={styles.duplicateItem}
                                    titleStyle={styles.duplicateTitle}
                                    descriptionStyle={styles.duplicateDescription}
                                />
                            ))}
                        </Card.Content>
                    </Card>
                )}

                <Button mode="contained" onPress={handleSave}>
                    Save
                </Button>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    input: {
        marginBottom: 15,
    },
    duplicatesCard: {
        marginBottom: 20,
        backgroundColor: '#f5f5f5',
        elevation: 0,
    },
    duplicatesTitle: {
        color: '#666',
        marginBottom: 8,
        fontWeight: '500',
    },
    duplicateItem: {
        paddingVertical: 2,
        paddingHorizontal: 0,
    },
    duplicateTitle: {
        fontSize: 14,
        color: '#333',
    },
    duplicateDescription: {
        fontSize: 12,
        color: '#888',
    },
});
