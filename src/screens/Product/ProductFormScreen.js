import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { TextInput, Button, Text, IconButton, Card, Chip, Dialog, Portal } from 'react-native-paper';
import { useStore } from '../../store/useStore';

export default function ProductFormScreen({ navigation, route }) {
    const { product } = route.params || {};
    const addProduct = useStore((state) => state.addProduct);
    const updateProduct = useStore((state) => state.updateProduct);
    const deleteProduct = useStore((state) => state.deleteProduct);

    const [name, setName] = useState(product?.name || '');
    const [price, setPrice] = useState(product?.price || '');
    const [salePrice, setSalePrice] = useState(product?.salePrice || '');

    // Attributes: ['Color', 'Size']
    const [attributes, setAttributes] = useState(product?.attributes || []);
    const [newAttribute, setNewAttribute] = useState('');
    const [attributeDialogVisible, setAttributeDialogVisible] = useState(false);

    // Variables: [{ id, attributes: { Color: 'Red', Size: 'L' }, price, salePrice }]
    const [variables, setVariables] = useState(product?.variables || []);

    // Static Options: [{ id, name: 'Material', values: ['Silk', 'Cotton'] }]
    const [staticOptions, setStaticOptions] = useState(product?.staticOptions || []);
    const [newOptionName, setNewOptionName] = useState('');
    const [optionDialogVisible, setOptionDialogVisible] = useState(false);
    const [newOptionValue, setNewOptionValue] = useState({}); // { optionId: 'value' }

    const handleAddAttribute = () => {
        if (newAttribute.trim() && !attributes.includes(newAttribute.trim())) {
            setAttributes([...attributes, newAttribute.trim()]);
            setNewAttribute('');
            setAttributeDialogVisible(false);
        }
    };

    const removeAttribute = (attr) => {
        setAttributes(attributes.filter(a => a !== attr));
        // Also remove this attribute from existing variables to keep data clean
        setVariables(variables.map(v => {
            const newAttrs = { ...v.attributes };
            delete newAttrs[attr];
            return { ...v, attributes: newAttrs };
        }));
    };

    const handleAddVariable = () => {
        const initialAttributes = {};
        attributes.forEach(attr => initialAttributes[attr] = '');
        setVariables([...variables, {
            id: Date.now().toString(),
            attributes: initialAttributes,
            price: price,
            salePrice: salePrice
        }]);
    };

    const updateVariableAttribute = (id, attr, value) => {
        setVariables(variables.map(v => v.id === id ? {
            ...v,
            attributes: { ...v.attributes, [attr]: value }
        } : v));
    };

    const updateVariablePrice = (id, field, value) => {
        setVariables(variables.map(v => v.id === id ? { ...v, [field]: value } : v));
    };

    const removeVariable = (id) => {
        setVariables(variables.filter(v => v.id !== id));
    };

    const getVariableName = (v) => {
        // Generate a name like "Red / L"
        const parts = attributes.map(attr => v.attributes?.[attr]).filter(Boolean);
        return parts.length > 0 ? parts.join(' / ') : 'New Variant';
    };

    // Static Options Logic
    const addOptionGroup = () => {
        if (newOptionName.trim()) {
            setStaticOptions([...staticOptions, { id: Date.now().toString(), name: newOptionName.trim(), values: [] }]);
            setNewOptionName('');
            setOptionDialogVisible(false);
        }
    };

    const removeOptionGroup = (id) => {
        setStaticOptions(staticOptions.filter(o => o.id !== id));
    };

    const addOptionValue = (optionId) => {
        const val = newOptionValue[optionId];
        if (val && val.trim()) {
            setStaticOptions(staticOptions.map(o => {
                if (o.id === optionId && !o.values.includes(val.trim())) {
                    return { ...o, values: [...o.values, val.trim()] };
                }
                return o;
            }));
            setNewOptionValue({ ...newOptionValue, [optionId]: '' });
        }
    };

    const removeOptionValue = (optionId, value) => {
        setStaticOptions(staticOptions.map(o => {
            if (o.id === optionId) {
                return { ...o, values: o.values.filter(v => v !== value) };
            }
            return o;
        }));
    };

    const handleSave = () => {
        // Construct the final variables list with a generated 'name' for backward compatibility/display
        const finalVariables = variables.map(v => ({
            ...v,
            name: getVariableName(v)
        }));

        const productData = {
            name,
            price,
            salePrice,
            attributes,
            variables: finalVariables,
            staticOptions,
        };

        if (product) {
            updateProduct(product.id, productData);
        } else {
            addProduct(productData);
        }
        navigation.goBack();
    };

    const handleDelete = () => {
        deleteProduct(product.id);
        navigation.goBack();
    };

    return (
        <ScrollView style={styles.container}>
            <TextInput
                label="Product Name"
                value={name}
                onChangeText={setName}
                style={styles.input}
                mode="outlined"
            />
            <View style={styles.row}>
                <TextInput
                    label="Base Price"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    style={[styles.input, styles.flexInput]}
                    mode="outlined"
                />
                <TextInput
                    label="Sale Price"
                    value={salePrice}
                    onChangeText={setSalePrice}
                    keyboardType="numeric"
                    style={[styles.input, styles.flexInput]}
                    mode="outlined"
                />
            </View>

            <View style={styles.sectionHeader}>
                <Text variant="titleMedium">Attributes (Price Variables)</Text>
                <Button onPress={() => setAttributeDialogVisible(true)}>Add Attribute</Button>
            </View>
            <View style={styles.chipContainer}>
                {attributes.map(attr => (
                    <Chip key={attr} onClose={() => removeAttribute(attr)} style={styles.chip}>{attr}</Chip>
                ))}
                {attributes.length === 0 && <Text style={{ color: '#888' }}>No attributes defined (e.g. Color, Size)</Text>}
            </View>

            <View style={styles.sectionHeader}>
                <Text variant="titleMedium">Variables</Text>
                <Button onPress={handleAddVariable}>Add Variable</Button>
            </View>

            {variables.map((v, index) => (
                <Card key={v.id} style={styles.variableCard}>
                    <Card.Content>
                        {attributes.map(attr => (
                            <TextInput
                                key={attr}
                                label={attr}
                                value={v.attributes?.[attr] || ''}
                                onChangeText={(text) => updateVariableAttribute(v.id, attr, text)}
                                style={styles.input}
                                mode="outlined"
                                dense
                            />
                        ))}
                        <View style={styles.variableRow}>
                            <TextInput
                                label="Price"
                                value={v.price}
                                onChangeText={(text) => updateVariablePrice(v.id, 'price', text)}
                                keyboardType="numeric"
                                style={[styles.input, styles.flexInput]}
                                mode="outlined"
                                dense
                            />
                            <TextInput
                                label="Sale Price"
                                value={v.salePrice}
                                onChangeText={(text) => updateVariablePrice(v.id, 'salePrice', text)}
                                keyboardType="numeric"
                                style={[styles.input, styles.flexInput]}
                                mode="outlined"
                                dense
                            />
                            <IconButton icon="delete" iconColor="red" onPress={() => removeVariable(v.id)} />
                        </View>
                    </Card.Content>
                </Card>
            ))}

            <View style={styles.sectionHeader}>
                <Text variant="titleMedium">Static Options (No Price Change)</Text>
                <Button onPress={() => setOptionDialogVisible(true)}>Add Option</Button>
            </View>

            {staticOptions.map((option) => (
                <Card key={option.id} style={styles.variableCard}>
                    <Card.Title
                        title={option.name}
                        right={(props) => <IconButton {...props} icon="delete" onPress={() => removeOptionGroup(option.id)} />}
                    />
                    <Card.Content>
                        <View style={styles.chipContainer}>
                            {option.values.map(val => (
                                <Chip key={val} onClose={() => removeOptionValue(option.id, val)} style={styles.chip}>{val}</Chip>
                            ))}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TextInput
                                label="Add Value (e.g. Red)"
                                value={newOptionValue[option.id] || ''}
                                onChangeText={(text) => setNewOptionValue({ ...newOptionValue, [option.id]: text })}
                                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                mode="outlined"
                                dense
                            />
                            <Button onPress={() => addOptionValue(option.id)}>Add</Button>
                        </View>
                    </Card.Content>
                </Card>
            ))}

            <Button mode="contained" onPress={handleSave} style={styles.button}>
                Save Product
            </Button>
            {product && (
                <Button mode="outlined" onPress={handleDelete} style={[styles.button, styles.deleteButton]}>
                    Delete Product
                </Button>
            )}
            <View style={{ height: 50 }} />

            <Portal>
                <Dialog visible={attributeDialogVisible} onDismiss={() => setAttributeDialogVisible(false)}>
                    <Dialog.Title>Add Attribute</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Attribute Name (e.g. Color)"
                            value={newAttribute}
                            onChangeText={setNewAttribute}
                            mode="outlined"
                            autoFocus
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setAttributeDialogVisible(false)}>Cancel</Button>
                        <Button onPress={handleAddAttribute}>Add</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <Portal>
                <Dialog visible={optionDialogVisible} onDismiss={() => setOptionDialogVisible(false)}>
                    <Dialog.Title>Add Static Option</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Option Name (e.g. Material)"
                            value={newOptionName}
                            onChangeText={setNewOptionName}
                            mode="outlined"
                            autoFocus
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setOptionDialogVisible(false)}>Cancel</Button>
                        <Button onPress={addOptionGroup}>Add</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    input: {
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    flexInput: {
        flex: 1,
        marginRight: 5,
    },
    button: {
        marginTop: 10,
    },
    deleteButton: {
        borderColor: 'red',
        marginTop: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    chip: {
        marginRight: 5,
        marginBottom: 5,
    },
    variableCard: {
        marginBottom: 10,
        backgroundColor: '#f9f9f9',
    },
    variableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
});
