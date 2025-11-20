import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { List, FAB, Text } from 'react-native-paper';
import { useStore } from '../../store/useStore';

export default function ProductListScreen({ navigation }) {
    const products = useStore((state) => state.products);

    return (
        <View style={styles.container}>
            <FlatList
                data={products}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <List.Item
                        title={item.name}
                        description={`Price: ${item.price} | Variables: ${item.variables ? item.variables.length : 0}`}
                        right={(props) => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => navigation.navigate('ProductForm', { product: item })}
                    />
                )}
                ListEmptyComponent={<Text style={styles.empty}>No products found</Text>}
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
});
