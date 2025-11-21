import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Button, Card, useTheme } from 'react-native-paper';
import { useStore } from '../store/useStore';
import { useCurrency } from '../hooks/useCurrency';

export default function DashboardScreen({ navigation }) {
    const invoices = useStore((state) => state.invoices);
    const customers = useStore((state) => state.customers);
    const products = useStore((state) => state.products);
    const [showThisMonth, setShowThisMonth] = useState(true);
    const theme = useTheme();
    const currency = useCurrency();

    // Calculate statistics
    const stats = useMemo(() => {
        const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);
        const invoiceCount = invoices.length;
        const customerCount = customers.length;
        const productCount = products.length;

        // Get current month revenue
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthRevenue = invoices
            .filter(inv => new Date(inv.date) >= startOfMonth)
            .reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);

        return { totalRevenue, invoiceCount, customerCount, productCount, currentMonthRevenue };
    }, [invoices, customers, products]);

    // Get recent invoices
    const recentInvoices = useMemo(() => {
        return [...invoices]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
    }, [invoices]);

    // Simple bar chart data (last 7 days)
    const chartData = useMemo(() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayRevenue = invoices
                .filter(inv => {
                    const invDate = new Date(inv.date);
                    return invDate.toDateString() === date.toDateString();
                })
                .reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);

            days.push({
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                revenue: dayRevenue
            });
        }
        const maxRevenue = Math.max(...days.map(d => d.revenue), 1);
        return { days, maxRevenue };
    }, [invoices]);

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Text variant="headlineMedium" style={styles.title}>Dashboard</Text>

            {/* Statistics Cards */}
            <View style={styles.revenueRow}>
                <Card style={styles.card} onPress={() => setShowThisMonth(!showThisMonth)}>
                    <Card.Content>
                        <Text variant="titleMedium">
                            {showThisMonth ? 'This Month Revenue' : 'Total Revenue'}
                        </Text>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{currency}</Text>
                        <Text variant="displayMedium" style={styles.revenue} numberOfLines={1} adjustsFontSizeToFit>
                            {showThisMonth ? stats.currentMonthRevenue.toFixed(0) : stats.totalRevenue.toFixed(0)}
                        </Text>
                    </Card.Content>
                </Card>
            </View>

            <View style={styles.statsRow}>
                <Card style={styles.statCard}>
                    <Card.Content>
                        <Text variant="titleSmall" style={styles.statLabel}>Customers</Text>
                        <Text variant="headlineMedium" style={styles.statValue} numberOfLines={1}>{stats.customerCount}</Text>
                    </Card.Content>
                </Card>
                <Card style={styles.statCard}>
                    <Card.Content>
                        <Text variant="titleSmall" style={styles.statLabel}>Products</Text>
                        <Text variant="headlineMedium" style={styles.statValue} numberOfLines={1}>{stats.productCount}</Text>
                    </Card.Content>
                </Card>
            </View>

            {/* Revenue Chart */}
            <Card style={styles.chartCard}>
                <Card.Title title="Revenue (Last 7 Days)" />
                <Card.Content>
                    <View style={styles.chart}>
                        {chartData.days.map((day, index) => (
                            <View key={index} style={styles.barContainer}>
                                <Text style={[styles.barValue, { fontSize: 9 }]}>{currency}</Text>
                                <Text style={styles.barValue}>{day.revenue > 0 ? day.revenue.toFixed(0) : ''}</Text>
                                <View
                                    style={[
                                        styles.bar,
                                        { height: Math.max((day.revenue / chartData.maxRevenue) * 120, 2), backgroundColor: theme.colors.primary }
                                    ]}
                                />
                                <Text style={styles.barLabel}>{day.day}</Text>
                            </View>
                        ))}
                    </View>
                </Card.Content>
            </Card>

            {/* Recent Invoices */}
            <Card style={styles.recentCard}>
                <Card.Title title="Recent Invoices" titleVariant="titleMedium" />
                <Card.Content>
                    {recentInvoices.length === 0 ? (
                        <Text style={{ color: '#666' }}>No invoices yet</Text>
                    ) : (
                        recentInvoices.map((invoice) => (
                            <View key={invoice.id} style={styles.invoiceItem}>
                                <View style={{ flex: 1 }}>
                                    <Text variant="titleSmall">Invoice #{invoice.id.slice(-4)}</Text>
                                    <Text variant="bodySmall" style={{ color: '#666' }}>{invoice.customerName}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{currency}</Text>
                                    <Text variant="titleMedium" style={{ color: theme.colors.primary }} numberOfLines={1} adjustsFontSizeToFit>{Math.round(invoice.total)}</Text>
                                </View>
                            </View>
                        ))
                    )}
                </Card.Content>
            </Card>

            {/* Quick Actions */}
            <View style={styles.actionsContainer}>
                <Button mode="contained" onPress={() => navigation.navigate('CreateInvoice')} style={styles.button} icon="plus">
                    New Invoice
                </Button>
                <Button mode="outlined" onPress={() => navigation.navigate('Reports')} style={styles.button} icon="chart-bar">
                    View Full Reports
                </Button>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
        padding: 20,
        paddingBottom: 10,
        fontWeight: 'bold',
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    revenueRow: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    statCard: {
        flex: 1,
        marginHorizontal: 5,
    },
    statLabel: {
        color: '#666',
        marginBottom: 5,
    },
    statValue: {
        fontWeight: 'bold',
    },
    chartCard: {
        margin: 20,
        marginTop: 10,
    },
    chart: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 180,
        paddingTop: 30,
    },
    barContainer: {
        alignItems: 'center',
        flex: 1,
    },
    bar: {
        width: 30,
        borderRadius: 4,
        marginBottom: 5,
    },
    barLabel: {
        fontSize: 10,
        color: '#666',
        marginTop: 5,
    },
    barValue: {
        fontSize: 10,
        color: '#333',
        marginBottom: 5,
        height: 15,
    },
    recentCard: {
        margin: 20,
        marginTop: 0,
    },
    invoiceItem: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    actionsContainer: {
        padding: 20,
        paddingTop: 0,
    },
    button: {
        marginVertical: 5,
    },
    logoutButton: {
        marginTop: 20,
        borderColor: 'red',
    },
    revenue: {
        fontWeight: 'bold',
    }
});
