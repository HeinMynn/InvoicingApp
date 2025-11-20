import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, ScrollView } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../store/useStore';

export default function ShopSettingsScreen({ navigation }) {
    const shopInfo = useStore((state) => state.shopInfo);
    const updateShopInfo = useStore((state) => state.updateShopInfo);

    const [name, setName] = useState(shopInfo.name || '');
    const [address, setAddress] = useState(shopInfo.address || '');
    const [phone, setPhone] = useState(shopInfo.phone || '');
    const [logo, setLogo] = useState(shopInfo.logo || null);

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
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
        updateShopInfo({ name, address, phone, logo });
        navigation.goBack();
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
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

            <Button mode="contained" onPress={handleSave} style={styles.button}>
                Save Settings
            </Button>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
        flexGrow: 1,
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
    button: {
        marginTop: 10,
    },
});
