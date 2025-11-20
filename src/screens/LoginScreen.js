import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme } from 'react-native-paper';
import { useStore } from '../store/useStore';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const login = useStore((state) => state.login);
    const [error, setError] = useState('');
    const theme = useTheme();

    const handleLogin = () => {
        if (login(username, password)) {
            setError('');
        } else {
            setError('Invalid credentials');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
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
