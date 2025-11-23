import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, Alert } from 'react-native';
import { TextInput, Button, Text, IconButton, Card, Chip, Dialog, Portal, List, Menu, useTheme } from 'react-native-paper';
import { useStore } from '../../store/useStore';
import { useHeaderHeight } from '@react-navigation/elements';
import BarcodeScanner from '../../components/BarcodeScanner';
import * as Print from 'expo-print';

export default function ProductFormScreen({ navigation, route }) {
    const { product } = route.params || {};
    const addProduct = useStore((state) => state.addProduct);
    const updateProduct = useStore((state) => state.updateProduct);
    const deleteProduct = useStore((state) => state.deleteProduct);
    const theme = useTheme();
    const scrollViewRef = useRef(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const headerHeight = useHeaderHeight();

    // Global Data
    const categories = useStore((state) => state.categories);
    const globalAttributes = useStore((state) => state.attributes);
    const addAttribute = useStore((state) => state.addAttribute);

    const [name, setName] = useState(product?.name || '');
    const [price, setPrice] = useState(product?.price || '');
    const [salePrice, setSalePrice] = useState(product?.salePrice || '');
    const [barcode, setBarcode] = useState(product?.barcode || ''); // Barcode State
    const [variablePrice, setVariablePrice] = useState('');
    const [variableSalePrice, setVariableSalePrice] = useState('');

    // Scanner State
    const [scannerVisible, setScannerVisible] = useState(false);

    // Keyboard listeners
    useEffect(() => {
        const keyboardWillShow = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => setKeyboardHeight(e.endCoordinates.height)
        );
        const keyboardWillHide = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardHeight(0)
        );

        return () => {
            keyboardWillShow.remove();
            keyboardWillHide.remove();
        };
    }, []);

    // Category
    const [categoryId, setCategoryId] = useState(product?.categoryId || '');
    const [categoryDialogVisible, setCategoryDialogVisible] = useState(false);

    // Selected Attributes for this product: [{ id, name, values: [], useAsVariation: true/false }]
    // We map global attributes to this structure.
    const [selectedAttributes, setSelectedAttributes] = useState(product?.selectedAttributes || []);
    const [attributeDialogVisible, setAttributeDialogVisible] = useState(false);
    const [newAttributeName, setNewAttributeName] = useState(''); // For creating new global attribute inline
    const [attributeValueInputs, setAttributeValueInputs] = useState({}); // { attributeId: 'value' }

    // Variables: [{ id, attributes: { Color: 'Red', Size: 'L' }, price, salePrice }]
    const [variables, setVariables] = useState(product?.variables || []);
    const [visibleMenu, setVisibleMenu] = useState(null); // { variableId: string, attributeName: string } | null

    // Barcode Logic
    const handleScan = (data) => {
        setBarcode(data);
        setScannerVisible(false);
    };

    const generateBarcode = () => {
        // Simple random 8-digit number
        const randomCode = Math.floor(10000000 + Math.random() * 90000000).toString();

        // Check for category prefix
        let prefix = '';
        if (categoryId) {
            const category = categories.find(c => c.id === categoryId);
            if (category && category.barcodePrefix) {
                prefix = category.barcodePrefix;
            }
        }

        setBarcode(prefix + randomCode);
    };

    const printLabel = async () => {
        if (!barcode) {
            Alert.alert("No Barcode", "Please generate or scan a barcode first.");
            return;
        }

        const shopInfo = useStore.getState().shopInfo;
        const { width, height, unit } = shopInfo.labelSettings || { width: '50', height: '30', unit: 'mm' };

        const html = `
            <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
                    <style>
                        @page {
                            size: ${width}${unit} ${height}${unit};
                            margin: 0;
                        }
                        body {
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            width: ${width}${unit};
                            height: ${height}${unit};
                            margin: 0;
                            font-family: sans-serif;
                            overflow: hidden;
                        }
                        .label {
                            text-align: center;
                            width: 100%;
                            height: 100%;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                        }
                        .product-name {
                            font-size: 12px;
                            font-weight: bold;
                            margin-bottom: 2px;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            max-width: 95%;
                        }
                        .price {
                            font-size: 10px;
                            margin-bottom: 2px;
                        }
                        svg {
                            max-width: 95%;
                            height: auto;
                        }
                    </style>
                </head>
                <body>
                    <div class="label">
                        <div class="product-name">${name || 'Product Name'}</div>
                        <div class="price">${price ? price + ' MMK' : ''}</div>
                        <svg id="barcode"></svg>
                    </div>
                    <script>
                        JsBarcode("#barcode", "${barcode}", {
                            format: "CODE128",
                            lineColor: "#000",
                            width: 2,
                            height: 30,
                            displayValue: true,
                            fontSize: 10,
                            margin: 0
                        });
                    </script>
                </body>
            </html>
        `;

        try {
            await Print.printAsync({
                html,
                width: unit === 'mm' ? parseInt(width) * 2.83465 : parseInt(width) * 72, // Approx conversion to points if needed, though @page usually handles it
                height: unit === 'mm' ? parseInt(height) * 2.83465 : parseInt(height) * 72,
            });
        } catch (error) {
            Alert.alert("Printing Error", "Could not print label: " + error.message);
        }
    };


    const handleAddAttributeToProduct = (globalAttr) => {
        if (!selectedAttributes.find(a => a.id === globalAttr.id)) {
            setSelectedAttributes([...selectedAttributes, { ...globalAttr, useAsVariation: true, selectedValues: [] }]);
        }
        setAttributeDialogVisible(false);
    };

    const handleCreateNewAttribute = () => {
        if (newAttributeName.trim()) {
            const newAttr = { name: newAttributeName.trim(), values: [] };
            addAttribute(newAttr);

            // Auto-add to product after creation
            setTimeout(() => {
                const createdAttr = globalAttributes.find(attr => attr.name === newAttr.name);
                if (createdAttr && !selectedAttributes.find(a => a.id === createdAttr.id)) {
                    setSelectedAttributes([...selectedAttributes, { ...createdAttr, useAsVariation: true, selectedValues: [] }]);
                }
            }, 100);

            setNewAttributeName('');
            setAttributeDialogVisible(false);
        }
    };

    const handleAddValueToAttribute = (attrId) => {
        const valueToAdd = attributeValueInputs[attrId];
        if (valueToAdd && valueToAdd.trim()) {
            const attr = selectedAttributes.find(a => a.id === attrId);
            if (attr) {
                // Check for duplicates
                if (attr.values && attr.values.includes(valueToAdd.trim())) {
                    // Value already exists, don't add it
                    setAttributeValueInputs({ ...attributeValueInputs, [attrId]: '' });
                    return;
                }

                const updatedValues = [...(attr.values || []), valueToAdd.trim()];

                // Update in global store with correct signature (id, data)
                const updateAttribute = useStore.getState().updateAttribute;
                updateAttribute(attr.id, { values: updatedValues });

                // Update in selected attributes
                setSelectedAttributes(selectedAttributes.map(a =>
                    a.id === attrId ? { ...a, values: updatedValues } : a
                ));

                // Clear input
                setAttributeValueInputs({ ...attributeValueInputs, [attrId]: '' });
            }
        }
    };

    const toggleVariation = (attrId) => {
        setSelectedAttributes(selectedAttributes.map(a =>
            a.id === attrId ? { ...a, useAsVariation: !a.useAsVariation } : a
        ));
    };

    const removeAttributeFromProduct = (attrId) => {
        setSelectedAttributes(selectedAttributes.filter(a => a.id !== attrId));
    };

    const toggleAttributeValue = (attrId, value) => {
        setSelectedAttributes(selectedAttributes.map(a => {
            if (a.id === attrId) {
                const currentValues = a.selectedValues || [];
                const newValues = currentValues.includes(value)
                    ? currentValues.filter(v => v !== value)
                    : [...currentValues, value];
                return { ...a, selectedValues: newValues };
            }
            return a;
        }));
    };

    const selectAllValues = (attrId) => {
        setSelectedAttributes(selectedAttributes.map(a =>
            a.id === attrId ? { ...a, selectedValues: [...a.values] } : a
        ));
    };

    const deselectAllValues = (attrId) => {
        setSelectedAttributes(selectedAttributes.map(a =>
            a.id === attrId ? { ...a, selectedValues: [] } : a
        ));
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
        const variationAttributes = selectedAttributes.filter(a => a.useAsVariation);
        const initialAttributes = {};
        variationAttributes.forEach(attr => initialAttributes[attr.name] = '');

        setVariables([...variables, {
            id: Date.now().toString(),
            attributes: initialAttributes,
            price: price,
            salePrice: salePrice
        }]);
    };

    const generateVariants = () => {
        const variationAttributes = selectedAttributes.filter(a => a.useAsVariation);
        if (variationAttributes.length === 0) return;

        // Get selected values for each variation attribute
        const arraysToCombine = variationAttributes.map(attr => {
            return (attr.selectedValues && attr.selectedValues.length > 0)
                ? attr.selectedValues.map(val => ({ name: attr.name, value: val }))
                : [];
        });

        // If any variation attribute has no selected values, we can't generate proper combinations
        if (arraysToCombine.some(arr => arr.length === 0)) {
            alert("Please select at least one value for each variation attribute.");
            return;
        }

        // Cartesian product helper
        const cartesian = (args) => {
            var r = [], max = args.length - 1;
            function helper(arr, i) {
                for (var j = 0, l = args[i].length; j < l; j++) {
                    var a = arr.slice(0); // clone arr
                    a.push(args[i][j]);
                    if (i == max) r.push(a);
                    else helper(a, i + 1);
                }
            }
            helper([], 0);
            return r;
        };

        const combinations = cartesian(arraysToCombine);

        const newVariables = combinations.map(combo => {
            const attributes = {};
            combo.forEach(item => {
                attributes[item.name] = item.value;
            });

            return {
                id: Date.now().toString() + Math.random().toString(), // Ensure unique ID
                attributes,
                price: price,
                salePrice: salePrice
            };
        });

        // Append to existing variables or replace? Usually replace or append. Let's append.
        // Filter out duplicates if needed? For now, just append.
        setVariables([...variables, ...newVariables]);
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
        const variationAttributes = selectedAttributes.filter(a => a.useAsVariation);
        const parts = variationAttributes.map(attr => v.attributes?.[attr.name]).filter(Boolean);
        return parts.length > 0 ? parts.join(' / ') : 'New Variant';
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
            barcode, // Save barcode
            categoryId,
            selectedAttributes, // Save the full config
            attributes: selectedAttributes.filter(a => a.useAsVariation).map(a => a.name), // Backward compat
            variables: finalVariables,
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
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: theme.colors.background }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? (headerHeight ? headerHeight + 75 : 175) : 0}
        >
            <ScrollView
                ref={scrollViewRef}
                style={{ flex: 1, backgroundColor: theme.colors.background }}
                contentContainerStyle={{ flexGrow: 1, padding: 10, paddingBottom: 300 }}
                keyboardShouldPersistTaps='handled'
                keyboardDismissMode='on-drag'
            >
                <TextInput
                    label="Product Name"
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                    mode="outlined"
                />

                {/* Barcode Section */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <TextInput
                        label="Barcode"
                        value={barcode}
                        onChangeText={setBarcode}
                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
                        mode="outlined"
                        right={<TextInput.Icon icon="barcode-scan" onPress={() => setScannerVisible(true)} />}
                    />
                    <View style={{ flexDirection: 'column', marginLeft: 10 }}>
                        <Button mode="contained" onPress={generateBarcode} compact style={{ marginBottom: 5 }}>
                            Generate
                        </Button>
                        <Button mode="outlined" onPress={printLabel} compact disabled={!barcode}>
                            Print
                        </Button>
                    </View>
                </View>

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
                    <Text variant="titleMedium">Category</Text>
                </View>
                <Button
                    mode="outlined"
                    onPress={() => {
                        Keyboard.dismiss();
                        setCategoryDialogVisible(true);
                    }}
                    style={{ marginBottom: 10 }}
                >
                    {categoryId ? categories.find(c => c.id === categoryId)?.name || 'Select Category' : 'Select Category'}
                </Button>

                <View style={styles.sectionHeader}>
                    <Text variant="titleMedium">Attributes</Text>
                    <Button onPress={() => {
                        Keyboard.dismiss();
                        setAttributeDialogVisible(true);
                    }}>Add Attribute</Button>
                </View>

                {selectedAttributes.map(attr => (
                    <Card key={attr.id} style={styles.attributeCard}>
                        <Card.Title
                            title={attr.name}
                            right={(props) => <IconButton {...props} icon="close" onPress={() => removeAttributeFromProduct(attr.id)} />}
                        />
                        <Card.Content>
                            <View style={styles.row}>
                                <Text>Use as Variation?</Text>
                                <Button
                                    mode={attr.useAsVariation ? "contained" : "outlined"}
                                    onPress={() => toggleVariation(attr.id)}
                                    compact
                                >
                                    {attr.useAsVariation ? "Yes" : "No"}
                                </Button>
                            </View>

                            <View style={{ marginTop: 10 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                    <Text>Select Values:</Text>
                                    <View style={{ flexDirection: 'row' }}>
                                        <Button compact onPress={() => {
                                            Keyboard.dismiss();
                                            selectAllValues(attr.id);
                                        }}>All</Button>
                                        <Button compact onPress={() => {
                                            Keyboard.dismiss();
                                            deselectAllValues(attr.id);
                                        }}>None</Button>
                                    </View>
                                </View>
                                <View style={styles.chipContainer}>
                                    {attr.values.map(val => (
                                        <Chip
                                            key={val}
                                            selected={attr.selectedValues?.includes(val)}
                                            onPress={() => {
                                                Keyboard.dismiss();
                                                toggleAttributeValue(attr.id, val);
                                            }}
                                            style={styles.chip}
                                            showSelectedOverlay
                                        >
                                            {val}
                                        </Chip>
                                    ))}
                                </View>
                                {attr.values.length === 0 && <Text style={{ color: '#888', fontStyle: 'italic' }}>No values defined for this attribute.</Text>}

                                {/* Add Value Input */}
                                <View style={{ flexDirection: 'row', marginTop: 10 }}>
                                    <TextInput
                                        label="Add New Value"
                                        value={attributeValueInputs[attr.id] || ''}
                                        onChangeText={(text) => setAttributeValueInputs({ ...attributeValueInputs, [attr.id]: text })}
                                        style={{ flex: 1, marginRight: 5 }}
                                        mode="outlined"
                                        dense
                                        onSubmitEditing={() => handleAddValueToAttribute(attr.id)}
                                    />
                                    <Button mode="contained" onPress={() => handleAddValueToAttribute(attr.id)} compact>Add</Button>
                                </View>
                            </View>
                        </Card.Content>
                    </Card >
                ))
                }

                <View style={styles.sectionHeader}>
                    <Text variant="titleMedium">Variables</Text>
                    <View style={{ flexDirection: 'row' }}>
                        <Button onPress={generateVariants}>Generate</Button>
                        <Button onPress={handleAddVariable}>Add Manual</Button>
                    </View>
                </View>

                {
                    variables.map((v, index) => (
                        <Card key={v.id} style={styles.variableCard}>
                            <Card.Content>
                                {selectedAttributes.filter(a => a.useAsVariation).map(attr => (
                                    <View key={attr.id} style={{ marginBottom: 10 }}>
                                        <Menu
                                            visible={visibleMenu?.variableId === v.id && visibleMenu?.attributeName === attr.name}
                                            onDismiss={() => setVisibleMenu(null)}
                                            anchor={
                                                <TextInput
                                                    label={attr.name}
                                                    value={v.attributes?.[attr.name] || ''}
                                                    onChangeText={(text) => updateVariableAttribute(v.id, attr.name, text)}
                                                    style={styles.input}
                                                    mode="outlined"
                                                    dense
                                                    right={<TextInput.Icon icon="menu-down" onPress={() => {
                                                        Keyboard.dismiss();
                                                        setTimeout(() => {
                                                            setVisibleMenu({ variableId: v.id, attributeName: attr.name });
                                                        }, 100);
                                                    }} />}
                                                />
                                            }
                                        >
                                            {attr.values.map(val => (
                                                <Menu.Item
                                                    key={val}
                                                    onPress={() => {
                                                        updateVariableAttribute(v.id, attr.name, val);
                                                        setVisibleMenu(null);
                                                    }}
                                                    title={val}
                                                />
                                            ))}
                                            {attr.values.length === 0 && <Menu.Item title="No values defined" disabled />}
                                        </Menu>
                                    </View>
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
                    ))
                }

                <Button mode="contained" onPress={handleSave} style={styles.button}>
                    Save Product
                </Button>
                {
                    product && (
                        <Button mode="outlined" onPress={handleDelete} style={[styles.button, styles.deleteButton]}>
                            Delete Product
                        </Button>
                    )
                }
                <View style={{ height: 50 }} />

                <Portal>
                    <Dialog visible={categoryDialogVisible} onDismiss={() => setCategoryDialogVisible(false)}>
                        <Dialog.Title>Select Category</Dialog.Title>
                        <Dialog.Content>
                            <ScrollView style={{ maxHeight: 300 }}>
                                {categories.map(cat => (
                                    <List.Item
                                        key={cat.id}
                                        title={cat.name}
                                        onPress={() => {
                                            setCategoryId(cat.id);
                                            setCategoryDialogVisible(false);
                                        }}
                                        left={props => <List.Icon {...props} icon={categoryId === cat.id ? "check" : "shape"} />}
                                    />
                                ))}
                                <Button onPress={() => {
                                    setCategoryDialogVisible(false);
                                    navigation.navigate('CategoryForm');
                                }}>Create New Category</Button>
                            </ScrollView>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setCategoryDialogVisible(false)}>Cancel</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>

                <Portal>
                    <Dialog visible={attributeDialogVisible} onDismiss={() => setAttributeDialogVisible(false)}>
                        <Dialog.Title>Add Attribute</Dialog.Title>
                        <Dialog.Content>
                            <ScrollView style={{ maxHeight: 300 }}>
                                <Text style={{ marginBottom: 10, fontWeight: 'bold' }}>Select Existing:</Text>
                                {globalAttributes.map(attr => (
                                    <List.Item
                                        key={attr.id}
                                        title={attr.name}
                                        onPress={() => handleAddAttributeToProduct(attr)}
                                        left={props => <List.Icon {...props} icon="tag" />}
                                    />
                                ))}
                                {globalAttributes.length === 0 && (
                                    <Text style={{ color: '#888', fontStyle: 'italic', marginBottom: 10 }}>No attributes created yet. Create one below.</Text>
                                )}
                                <View style={styles.divider} />
                                <Text style={{ marginBottom: 10, fontWeight: 'bold', marginTop: 10 }}>Or Create New:</Text>
                                <View style={{ flexDirection: 'row' }}>
                                    <TextInput
                                        label="Name"
                                        value={newAttributeName}
                                        onChangeText={setNewAttributeName}
                                        style={{ flex: 1, marginRight: 10 }}
                                        mode="outlined"
                                        dense
                                    />
                                    <Button mode="contained" onPress={handleCreateNewAttribute} compact>Create</Button>
                                </View>
                            </ScrollView>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setAttributeDialogVisible(false)}>Cancel</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>

                {/* Scanner Modal */}
                <BarcodeScanner
                    visible={scannerVisible}
                    onDismiss={() => setScannerVisible(false)}
                    onScan={handleScan}
                />

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
        marginTop: 10,
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
        padding: 10,
    },
    variableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
    attributeCard: {
        marginBottom: 10,
    },
    divider: {
        height: 1,
        marginVertical: 10,
    },
});
