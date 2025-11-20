import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { List, FAB, IconButton, Text, useTheme } from 'react-native-paper';
import { useStore } from '../../store/useStore';

export default function CategoryListScreen({ navigation }) {
    const categories = useStore((state) => state.categories);
    const deleteCategory = useStore((state) => state.deleteCategory);
    const theme = useTheme();

    const renderItem = ({ item }) => (
        <List.Item
            title={item.name}
            description={item.description}
            left={(props) => <List.Icon {...props} icon="shape" />}
            right={(props) => (
                <View style={{ flexDirection: 'row' }}>
                    <IconButton icon="pencil" onPress={() => navigation.navigate('CategoryForm', { category: item })} />
                    <IconButton icon="delete" iconColor="red" onPress={() => deleteCategory(item.id)} />
                </View>
            )}
        />
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {categories.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text variant="bodyLarge">No categories found.</Text>
                    <Text variant="bodyMedium">Add a category to organize your products.</Text>
                </View>
            ) : (
                <FlatList
                    data={categories}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                />
            )}
            <FAB
                style={styles.fab}
                icon="plus"
                onPress={() => navigation.navigate('CategoryForm')}
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
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
