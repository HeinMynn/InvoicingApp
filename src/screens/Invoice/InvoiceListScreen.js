import React from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { List, FAB, Text, IconButton } from 'react-native-paper';
import { Swipeable } from 'react-native-gesture-handler';
import { useStore } from '../../store/useStore';

export default function InvoiceListScreen({ navigation }) {
    const invoices = useStore((state) => state.invoices);
    const deleteInvoice = useStore((state) => state.deleteInvoice);

    const handleDelete = (id) => {
        Alert.alert(
            'Delete Invoice',
            'Are you sure you want to delete this invoice?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteInvoice(id) },
            ]
        );
    };

    const renderRightActions = (item) => {
        return (
            <View style={styles.swipeActions}>
                <View style={styles.editAction}>
                    <IconButton
                        icon="pencil"
                        iconColor="white"
                        onPress={() => navigation.navigate('CreateInvoice', { invoice: item })}
                    />
                </View>
                <View style={styles.deleteAction}>
                    <IconButton
                        icon="delete"
                        iconColor="white"
                        onPress={() => handleDelete(item.id)}
                    />
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={invoices}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <Swipeable renderRightActions={() => renderRightActions(item)}>
                        <List.Item
                            title={`Invoice #${item.id.slice(-4)}`}
                            description={`Customer: ${item.customerName} | Total: $${item.total}`}
                            right={(props) => <Text {...props} style={{ alignSelf: 'center' }}>{new Date(item.date).toLocaleDateString()}</Text>}
                            onPress={() => navigation.navigate('InvoicePreview', { invoice: item })}
                            style={{ backgroundColor: 'white' }}
                        />
                    </Swipeable>
                )}
                ListEmptyComponent={<Text style={styles.empty}>No invoices found</Text>}
            />
            <FAB
                style={styles.fab}
                icon="plus"
                onPress={() => navigation.navigate('CreateInvoice')}
            />
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
});
