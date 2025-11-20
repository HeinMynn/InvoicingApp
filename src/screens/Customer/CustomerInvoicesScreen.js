import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { List, Text, IconButton } from 'react-native-paper';
import { useStore } from '../../store/useStore';

export default function CustomerInvoicesScreen({ route, navigation }) {
    const { customer } = route.params;
    const invoices = useStore((state) => state.invoices);

    const customerInvoices = invoices.filter(inv => inv.customerId === customer.id);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            title: `${customer.name}'s Invoices`,
        });
    }, [navigation, customer]);

    return (
        <View style={styles.container}>
            {customerInvoices.length === 0 ? (
                <Text style={styles.empty}>No invoices found for this customer</Text>
            ) : (
                <FlatList
                    data={customerInvoices}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <List.Item
                            title={`Invoice #${item.id.slice(-4)}`}
                            description={`Total: $${item.total} • ${new Date(item.date).toLocaleDateString()}`}
                            right={(props) => <List.Icon {...props} icon="chevron-right" />}
                            onPress={() => navigation.navigate('InvoicePreview', { invoice: item })}
                        />
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    empty: {
        textAlign: 'center',
        marginTop: 40,
        color: '#666',
        fontSize: 16,
    },
});
