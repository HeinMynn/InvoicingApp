import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useStore } from '../store/useStore';
import Icon from 'react-native-paper/src/components/Icon';
import { IconButton, useTheme } from 'react-native-paper';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
    const theme = useTheme();
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
                tabBarStyle: {
                    backgroundColor: theme.colors.elevation.level2,
                    borderTopColor: theme.colors.outline,
                },
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

const linking = {
    prefixes: ['invoicingapp://'],
    config: {
        screens: {
            Main: {
                screens: {
                    Dashboard: 'dashboard',
                    Invoices: 'invoices',
                    Products: 'products',
                    Customers: 'customers',
                },
            },
            CreateInvoice: 'invoice/create',
            Reports: 'reports',
            GeneralSettings: 'settings',
            ShopSettings: 'shop-settings',
            ProductForm: 'product/form',
            CustomerForm: 'customer/form',
        },
    },
};

export default function AppNavigator() {
    const user = useStore((state) => state.user);
    const theme = useTheme();

    return (
        <NavigationContainer linking={linking} theme={theme}>
            <Stack.Navigator
                screenOptions={{
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: theme.colors.surface,
                    },
                    headerTintColor: theme.colors.onSurface,
                    headerBackTitleStyle: {
                        fontSize: 12,
                    },
                }}
            >
                {!user ? (
                    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                ) : (
                    <>
                        <Stack.Screen
                            name="Main"
                            component={MainTabs}
                            options={({ navigation }) => ({
                                headerShown: true,
                                title: 'ShopKeeper',
                                headerRight: () => (
                                    <>
                                        <IconButton
                                            icon="cog"
                                            iconColor={theme.colors.primary}
                                            onPress={() => navigation.navigate('GeneralSettings')}
                                        />
                                        <IconButton
                                            icon="store"
                                            iconColor={theme.colors.primary}
                                            onPress={() => navigation.navigate('ShopSettings')}
                                        />
                                    </>
                                ),
                            })}
                        />
                        <Stack.Screen name="CustomerInvoices" getComponent={() => require('../screens/Customer/CustomerInvoicesScreen').default} />
                        <Stack.Screen name="CustomerForm" getComponent={() => require('../screens/Customer/CustomerFormScreen').default} />
                        <Stack.Screen name="ProductForm" getComponent={() => require('../screens/Product/ProductFormScreen').default} />
                        <Stack.Screen name="CreateInvoice" getComponent={() => require('../screens/Invoice/CreateInvoiceScreen').default} />
                        <Stack.Screen name="InvoicePreview" getComponent={() => require('../screens/Invoice/InvoicePreviewScreen').default} />
                        <Stack.Screen name="ShopSettings" getComponent={() => require('../screens/ShopSettingsScreen').default} options={{ title: 'Shop Settings' }} />
                        <Stack.Screen name="GeneralSettings" getComponent={() => require('../screens/GeneralSettingsScreen').default} options={{ title: 'General Settings' }} />

                        <Stack.Screen name="CategoryList" getComponent={() => require('../screens/Category/CategoryListScreen').default} options={{ title: 'Categories' }} />
                        <Stack.Screen name="CategoryForm" getComponent={() => require('../screens/Category/CategoryFormScreen').default} options={{ title: 'Category' }} />

                        <Stack.Screen name="AttributeList" getComponent={() => require('../screens/Attribute/AttributeListScreen').default} options={{ title: 'Attributes' }} />
                        <Stack.Screen name="AttributeForm" getComponent={() => require('../screens/Attribute/AttributeFormScreen').default} options={{ title: 'Attribute' }} />
                        <Stack.Screen name="Reports" getComponent={() => require('../screens/ReportScreen').default} options={{ title: 'Sales Reports' }} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
