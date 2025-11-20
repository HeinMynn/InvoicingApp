import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useStore } from '../../store/useStore';

export default function CustomerFormScreen({ navigation, route }) {
    const { customer } = route.params || {};
    const addCustomer = useStore((state) => state.addCustomer);
    const updateCustomer = useStore((state) => state.updateCustomer);
    const deleteCustomer = useStore((state) => state.deleteCustomer);

    const [name, setName] = useState(customer?.name || '');
    const [phone, setPhone] = useState(customer?.phone || '');
    const [address, setAddress] = useState(customer?.address || '');

    const handleSave = () => {
        if (customer) {
            updateCustomer(customer.id, { name, phone, address });
        } else {
            addCustomer({ name, phone, address });
        }
        navigation.goBack();
    };

    const handleDelete = () => {
        deleteCustomer(customer.id);
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
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
            <Button mode="contained" onPress={handleSave} style={styles.button}>
                Save Customer
            </Button>
            {customer && (
                <Button mode="outlined" onPress={handleDelete} style={[styles.button, styles.deleteButton]}>
                    Delete Customer
                </Button>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    input: {
        marginBottom: 15,
    },
    button: {
        marginTop: 10,
    },
    deleteButton: {
        borderColor: 'red',
        marginTop: 20,
    },
});
