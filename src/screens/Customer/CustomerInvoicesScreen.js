import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { List, Text, IconButton, useTheme } from 'react-native-paper';
import { useStore } from '../../store/useStore';
import { useCurrency } from '../../hooks/useCurrency';

export default function CustomerInvoicesScreen({ route, navigation }) {
    const { customer } = route.params;
    const invoices = useStore((state) => state.invoices);
    const theme = useTheme();
    const currency = useCurrency();

    const customerInvoices = invoices.filter(inv => inv.customerId === customer.id);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <FlatList
                data={customerInvoices}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <List.Item
                        title={`Invoice #${item.id}`}
                        description={`Total: ${item.total} ${currency} | Date: ${new Date(item.date).toLocaleDateString()}`}
                        right={(props) => (
                            <IconButton {...props} icon="chevron-right" onPress={() => navigation.navigate('InvoicePreview', { invoice: item })} />
                        )}
                        onPress={() => navigation.navigate('InvoicePreview', { invoice: item })}
                    />
                )}
                ListEmptyComponent={<Text style={styles.empty}>No invoices for this customer</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    empty: {
        textAlign: 'center',
        marginTop: 20,
        color: '#666',
    },
});
