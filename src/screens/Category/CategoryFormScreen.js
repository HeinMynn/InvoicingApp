import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, useTheme } from 'react-native-paper';
import { useStore } from '../../store/useStore';

export default function CategoryFormScreen({ navigation, route }) {
    const { category } = route.params || {};
    const addCategory = useStore((state) => state.addCategory);
    const updateCategory = useStore((state) => state.updateCategory);
    const theme = useTheme();

    const [name, setName] = useState(category?.name || '');
    const [description, setDescription] = useState(category?.description || '');

    const handleSave = () => {
        if (name.trim()) {
            const categoryData = { name, description };
            if (category) {
                updateCategory(category.id, categoryData);
            } else {
                addCategory(categoryData);
            }
            navigation.goBack();
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: theme.colors.background }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <ScrollView contentContainerStyle={[styles.container, { flexGrow: 1, paddingBottom: 100 }]}>
                <TextInput
                    label="Category Name"
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                    mode="outlined"
                    autoFocus
                />
                <TextInput
                    label="Description"
                    value={description}
                    onChangeText={setDescription}
                    style={styles.input}
                    mode="outlined"
                    multiline
                    numberOfLines={3}
                />
                <Button mode="contained" onPress={handleSave} style={styles.button}>
                    Save Category
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
    button: {
        marginTop: 10,
    },
});
