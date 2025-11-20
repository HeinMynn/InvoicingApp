import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useStore } from '../store/useStore';
import Icon from 'react-native-paper/src/components/Icon';
import { IconButton } from 'react-native-paper';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#6200ee',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            }}
        >
            <Tab.Screen
                name="Dashboard"
                getComponent={() => require('../screens/DashboardScreen').default}
                options={{
                    tabBarIcon: ({ color, size }) => <Icon source="view-dashboard" size={size} color={color} />,
                }}
            />
            <Tab.Screen
                name="Invoices"
                getComponent={() => require('../screens/Invoice/InvoiceListScreen').default}
                options={{
                    tabBarIcon: ({ color, size }) => <Icon source="file-document" size={size} color={color} />,
                }}
            />
            <Tab.Screen
                name="Products"
                getComponent={() => require('../screens/Product/ProductListScreen').default}
                options={{
                    tabBarIcon: ({ color, size }) => <Icon source="package-variant" size={size} color={color} />,
                }}
            />
            <Tab.Screen
                name="Customers"
                getComponent={() => require('../screens/Customer/CustomerListScreen').default}
                options={{
                    tabBarIcon: ({ color, size }) => <Icon source="account-multiple" size={size} color={color} />,
                }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const user = useStore((state) => state.user);

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: true }}>
                {!user ? (
                    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                ) : (
                    <>
                        <Stack.Screen
                            name="Main"
                            component={MainTabs}
                            options={({ navigation }) => ({
                                headerShown: true,
                                title: 'Invoicing App',
                                headerRight: () => (
                                    <IconButton
                                        icon="store"
                                        iconColor="#6200ee"
                                        onPress={() => navigation.navigate('ShopSettings')}
                                    />
                                ),
                            })}
                        />
                        <Stack.Screen name="CustomerInvoices" getComponent={() => require('../screens/Customer/CustomerInvoicesScreen').default} />
                        <Stack.Screen name="CustomerForm" getComponent={() => require('../screens/Customer/CustomerFormScreen').default} />
                        <Stack.Screen name="ProductForm" getComponent={() => require('../screens/Product/ProductFormScreen').default} />
                        <Stack.Screen name="CreateInvoice" getComponent={() => require('../screens/Invoice/CreateInvoiceScreen').default} />
                        <Stack.Screen name="InvoicePreview" getComponent={() => require('../screens/Invoice/InvoicePreviewScreen').default} />
                        <Stack.Screen name="ShopSettings" getComponent={() => require('../screens/ShopSettingsScreen').default} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
