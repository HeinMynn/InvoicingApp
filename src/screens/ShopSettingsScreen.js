import React, { useState } from 'react';
import { View, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Divider, useTheme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../store/useStore';

export default function ShopSettingsScreen({ navigation }) {
    const shopInfo = useStore((state) => state.shopInfo);
    const updateShopInfo = useStore((state) => state.updateShopInfo);
    const theme = useTheme();

    const [name, setName] = useState(shopInfo.name || '');
    const [nameBurmese, setNameBurmese] = useState(shopInfo.nameBurmese || '');
    const [tagline, setTagline] = useState(shopInfo.tagline || '');
    const [address, setAddress] = useState(shopInfo.address || '');
    const [phone, setPhone] = useState(shopInfo.phone || '');
    const [logo, setLogo] = useState(shopInfo.logo || null);
    const [newDeliveryOption, setNewDeliveryOption] = useState('');

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setLogo(result.assets[0].uri);
        }
    };

    const handleSave = () => {
        updateShopInfo({ name, nameBurmese, tagline, address, phone, logo });
        Alert.alert('Success', 'Shop information saved successfully');
    };

    const handleAddDeliveryOption = () => {
        if (newDeliveryOption.trim()) {
            const currentOptions = shopInfo.deliveryOptions || [];
            if (!currentOptions.includes(newDeliveryOption.trim())) {
                updateShopInfo({ deliveryOptions: [...currentOptions, newDeliveryOption.trim()] });
                setNewDeliveryOption('');
            } else {
                Alert.alert('Duplicate', 'This delivery option already exists');
            }
        }
    };

    return (
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Shop Information</Text>
                <View style={styles.logoContainer}>
                    {logo ? (
                        <Image source={{ uri: logo }} style={styles.logo} />
                    ) : (
                        <View style={styles.placeholderLogo}>
                            <Text>No Logo</Text>
                        </View>
                    )}
                    <Button onPress={pickImage}>Select Logo</Button>
                </View>

                <TextInput
                    label="Shop Name"
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                    mode="outlined"
                />
                <TextInput
                    label="Shop Name (Burmese)"
                    value={nameBurmese}
                    onChangeText={setNameBurmese}
                    style={styles.input}
                    mode="outlined"
                />
                <TextInput
                    label="Tagline"
                    value={tagline}
                    onChangeText={setTagline}
                    style={styles.input}
                    mode="outlined"
                    placeholder="e.g., Quality Products Since 2020"
                />
                <TextInput
                    label="Address"
                    value={address}
                    onChangeText={setAddress}
                    style={styles.input}
                    mode="outlined"
                    multiline
                />
                <TextInput
                    label="Phone"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    style={styles.input}
                    mode="outlined"
                />
                <Button mode="contained" onPress={handleSave} style={styles.saveButton}>
                    Save Shop Information
                </Button>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Delivery Options</Text>
                <Text variant="bodySmall" style={{ marginBottom: 15, color: theme.colors.onSurfaceVariant }}>
                    Manage delivery service options that appear in invoice creation
                </Text>

                {(shopInfo.deliveryOptions || []).map((option, index) => (
                    <View key={index} style={[styles.deliveryOptionItem, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <Text style={{ flex: 1, color: theme.colors.onSurface }}>{option}</Text>
                        <Button
                            mode="text"
                            textColor="red"
                            onPress={() => {
                                const newOptions = shopInfo.deliveryOptions.filter((_, i) => i !== index);
                                updateShopInfo({ deliveryOptions: newOptions });
                            }}
                            compact
                        >
                            Delete
                        </Button>
                    </View>
                ))}

                <View style={styles.addDeliveryOption}>
                    <TextInput
                        label="New Delivery Option"
                        value={newDeliveryOption}
                        onChangeText={setNewDeliveryOption}
                        mode="outlined"
                        style={{ flex: 1, marginRight: 10 }}
                        dense
                        onSubmitEditing={handleAddDeliveryOption}
                    />
                    <Button
                        mode="contained"
                        onPress={handleAddDeliveryOption}
                        disabled={!newDeliveryOption.trim()}
                        compact
                    >
                        Add
                    </Button>
                </View>
            </View>

            <View style={{ height: 50 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flexGrow: 1,
    },
    section: {
        marginBottom: 10,
    },
    sectionTitle: {
        marginBottom: 15,
        fontWeight: 'bold',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
    },
    placeholderLogo: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    input: {
        marginBottom: 15,
    },
    saveButton: {
        marginTop: 10,
    },
    button: {
        marginBottom: 10,
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 20,
    },
    deliveryOptionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    addDeliveryOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
});
