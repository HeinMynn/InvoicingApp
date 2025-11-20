import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { useStore } from '../store/useStore';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const login = useStore((state) => state.login);
    const [error, setError] = useState('');

    const handleLogin = () => {
        if (login(username, password)) {
            setError('');
        } else {
            setError('Invalid credentials');
        }
    };

    return (
        <View style={styles.container}>
            <Surface style={styles.surface} elevation={4}>
                <Text variant="headlineMedium" style={styles.title}>Admin Login</Text>
                <TextInput
                    label="Username"
                    value={username}
                    onChangeText={setUsername}
                    style={styles.input}
                    mode="outlined"
                />
                <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={styles.input}
                    mode="outlined"
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Button mode="contained" onPress={handleLogin} style={styles.button}>
                    Login
                </Button>
            </Surface>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    surface: {
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    title: {
        marginBottom: 20,
        fontWeight: 'bold',
    },
    input: {
        width: '100%',
        marginBottom: 15,
    },
    button: {
        width: '100%',
        marginTop: 10,
    },
    error: {
        color: 'red',
        marginBottom: 10,
    },
});
