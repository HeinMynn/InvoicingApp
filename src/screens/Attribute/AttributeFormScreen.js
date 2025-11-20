import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Chip, IconButton, Text, useTheme } from 'react-native-paper';
import { useStore } from '../../store/useStore';

export default function AttributeFormScreen({ navigation, route }) {
    const { attribute } = route.params || {};
    const addAttribute = useStore((state) => state.addAttribute);
    const updateAttribute = useStore((state) => state.updateAttribute);
    const theme = useTheme();

    const [name, setName] = useState(attribute?.name || '');
    const [values, setValues] = useState(attribute?.values || []);
    const [newValue, setNewValue] = useState('');

    const handleAddValue = () => {
        if (newValue.trim() && !values.includes(newValue.trim())) {
            setValues([...values, newValue.trim()]);
            setNewValue('');
        }
    };

    const removeValue = (val) => {
        setValues(values.filter(v => v !== val));
    };

    const handleSave = () => {
        if (name.trim()) {
            const attributeData = { name, values };
            if (attribute) {
                updateAttribute(attribute.id, attributeData);
            } else {
                addAttribute(attributeData);
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
            <ScrollView
                style={{ flex: 1, backgroundColor: theme.colors.background }}
                contentContainerStyle={[styles.container, { flexGrow: 1, paddingBottom: 100 }]}
            >
                <TextInput
                    label="Attribute Name (e.g. Color)"
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                    mode="outlined"
                    autoFocus
                />

                <View style={styles.sectionHeader}>
                    <Text variant="titleMedium">Values</Text>
                </View>

                <View style={styles.inputRow}>
                    <TextInput
                        label="Add Value (e.g. Red)"
                        value={newValue}
                        onChangeText={setNewValue}
                        style={[styles.input, styles.flexInput]}
                        mode="outlined"
                        onSubmitEditing={handleAddValue}
                    />
                    <Button mode="contained" onPress={handleAddValue} style={styles.addButton}>Add</Button>
                </View>

                <View style={styles.chipContainer}>
                    {values.map((val) => (
                        <Chip key={val} onClose={() => removeValue(val)} style={styles.chip}>{val}</Chip>
                    ))}
                </View>

                <Button mode="contained" onPress={handleSave} style={styles.saveButton}>
                    Save Attribute
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
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    flexInput: {
        flex: 1,
        marginBottom: 0,
        marginRight: 10,
    },
    addButton: {
        justifyContent: 'center',
    },
    sectionHeader: {
        marginBottom: 10,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    chip: {
        marginRight: 5,
        marginBottom: 5,
    },
    saveButton: {
        marginTop: 10,
    },
});
