import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { List, FAB, IconButton, Text, Chip, useTheme } from 'react-native-paper';
import { useStore } from '../../store/useStore';

export default function AttributeListScreen({ navigation }) {
    const attributes = useStore((state) => state.attributes);
    const deleteAttribute = useStore((state) => state.deleteAttribute);
    const theme = useTheme();

    const renderItem = ({ item }) => (
        <List.Item
            title={item.name}
            description={() => (
                <View style={styles.chipContainer}>
                    {item.values.map((val, index) => (
                        <Chip key={index} style={styles.chip} textStyle={{ fontSize: 10 }}>{val}</Chip>
                    ))}
                </View>
            )}
            left={(props) => <List.Icon {...props} icon="tag-multiple" />}
            right={(props) => (
                <View style={{ flexDirection: 'row' }}>
                    <IconButton icon="pencil" onPress={() => navigation.navigate('AttributeForm', { attribute: item })} />
                    <IconButton icon="delete" iconColor="red" onPress={() => deleteAttribute(item.id)} />
                </View>
            )}
        />
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {attributes.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text variant="bodyLarge">No attributes found.</Text>
                    <Text variant="bodyMedium">Add attributes like Color or Size.</Text>
                </View>
            ) : (
                <FlatList
                    data={attributes}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                />
            )}
            <FAB
                style={styles.fab}
                icon="plus"
                onPress={() => navigation.navigate('AttributeForm')}
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
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 5,
    },
    chip: {
        marginRight: 4,
        marginBottom: 4,
        height: 24,
    },
});
