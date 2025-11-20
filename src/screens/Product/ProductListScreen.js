import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { List, FAB, Text, useTheme, Divider } from 'react-native-paper';
import { useStore } from '../../store/useStore';
import { useCurrency } from '../../hooks/useCurrency';

export default function ProductListScreen({ navigation }) {
    const products = useStore((state) => state.products);
    const theme = useTheme();
    const currency = useCurrency();

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <FlatList
                data={products}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <List.Item
                        title={item.name}
                        description={`Price: ${item.price} ${currency} | Variables: ${item.variables ? item.variables.length : 0}`}
                        right={(props) => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => navigation.navigate('ProductForm', { product: item })}
                    />
                )}
                ListEmptyComponent={<Text style={styles.empty}>No products found</Text>}
                ItemSeparatorComponent={() => <Divider />}
            />
            <FAB
                style={styles.fab}
                icon="plus"
                onPress={() => navigation.navigate('ProductForm')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
});
