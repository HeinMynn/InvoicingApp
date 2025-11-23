import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Button, IconButton, useTheme } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function BarcodeScanner({ visible, onDismiss, onScan }) {
    const [permission, requestPermission] = useCameraPermissions();
    const theme = useTheme();
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        if (visible) {
            setScanned(false);
        }
    }, [visible]);

    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    if (!permission.granted) {
        return (
            <Modal visible={visible} animationType="slide" transparent={false}>
                <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                    <Text style={{ textAlign: 'center', marginBottom: 20 }}>We need your permission to show the camera</Text>
                    <Button mode="contained" onPress={requestPermission}>Grant Permission</Button>
                    <Button mode="text" onPress={onDismiss} style={{ marginTop: 10 }}>Cancel</Button>
                </View>
            </Modal>
        );
    }

    const handleBarCodeScanned = ({ type, data }) => {
        if (scanned) return;
        setScanned(true);
        // Play sound or vibrate here if desired
        onScan(data);
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
            <View style={styles.container}>
                <CameraView
                    style={styles.camera}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr", "ean13", "ean8", "upc_e", "code128", "code39", "pdf417", "aztec", "datamatrix"],
                    }}
                >
                    <View style={styles.overlay}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Scan Barcode</Text>
                            <IconButton icon="close" iconColor="white" size={30} onPress={onDismiss} />
                        </View>
                        <View style={styles.centerRow}>
                            <View style={styles.sideOverlay} />
                            <View style={styles.scanFrame}>
                                <View style={[styles.corner, styles.topLeft]} />
                                <View style={[styles.corner, styles.topRight]} />
                                <View style={[styles.corner, styles.bottomLeft]} />
                                <View style={[styles.corner, styles.bottomRight]} />
                            </View>
                            <View style={styles.sideOverlay} />
                        </View>
                        <View style={styles.bottomOverlay}>
                            <Text style={styles.instruction}>Align barcode within the frame</Text>
                        </View>
                    </View>
                </CameraView>
            </View>
        </Modal>
    );
}

const { width } = Dimensions.get('window');
const frameSize = width * 0.7;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        height: 100,
    },
    title: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    centerRow: {
        flex: 1,
        flexDirection: 'row',
    },
    sideOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    scanFrame: {
        width: frameSize,
        height: frameSize,
        backgroundColor: 'transparent',
        position: 'relative',
    },
    bottomOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    instruction: {
        color: 'white',
        fontSize: 16,
        marginTop: -50,
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#00FF00',
        borderWidth: 4,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderBottomWidth: 0,
        borderRightWidth: 0,
    },
    topRight: {
        top: 0,
        right: 0,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderTopWidth: 0,
        borderRightWidth: 0,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderTopWidth: 0,
        borderLeftWidth: 0,
    },
});
