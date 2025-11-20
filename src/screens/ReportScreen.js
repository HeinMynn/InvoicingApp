import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Keyboard } from 'react-native';
import { Text, Card, SegmentedButtons, DataTable, Button, Divider, useTheme, TextInput, Portal, Modal, List } from 'react-native-paper';
import { useStore } from '../store/useStore';
import { useCurrency } from '../hooks/useCurrency';

export default function ReportScreen() {
    const invoices = useStore((state) => state.invoices);
    const theme = useTheme();
    const currency = useCurrency();
    const [view, setView] = useState('overview'); // 'overview' | 'items' | 'customers'
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showMonthMenu, setShowMonthMenu] = useState(false);
    const [showYearMenu, setShowYearMenu] = useState(false);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const yearList = [];
        for (let i = 0; i < 5; i++) {
            yearList.push(currentYear - i);
        }
        return yearList;
    }, []);

    // Filter Invoices based on Month and Year
    const filteredInvoices = useMemo(() => {
        const start = new Date(selectedYear, selectedMonth, 1);
        const end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

        return invoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= start && invDate <= end;
        });
    }, [invoices, selectedMonth, selectedYear]);

    // Calculate Metrics
    const metrics = useMemo(() => {
        const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const totalInvoices = filteredInvoices.length;
        const aov = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;
        return { totalRevenue, totalInvoices, aov };
    }, [filteredInvoices]);

    // Monthly Data
    const monthlyData = useMemo(() => {
        const grouped = {};
        filteredInvoices.forEach(inv => {
            const date = new Date(inv.date);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            if (!grouped[key]) {
                grouped[key] = { count: 0, revenue: 0, month: date.getMonth(), year: date.getFullYear() };
            }
            grouped[key].count++;
            grouped[key].revenue += inv.total;
        });
        return Object.keys(grouped).map(key => ({
            key,
            monthLabel: `${months[grouped[key].month]} ${grouped[key].year}`,
            count: grouped[key].count,
            revenue: grouped[key].revenue
        })).sort((a, b) => b.key.localeCompare(a.key));
    }, [filteredInvoices]);

    // Item Data
    const itemData = useMemo(() => {
        const itemMap = {};
        filteredInvoices.forEach(inv => {
            inv.items.forEach(item => {
                // Create a unique key based on name and sorted attributes to ensure consistency
                // Clone attributes to avoid mutating the original array
                const attributesKey = item.attributes
                    ? JSON.stringify([...item.attributes].sort((a, b) => a.key.localeCompare(b.key)).map(a => ({ ...a, value: a.value.trim() })))
                    : '';
                const key = `${item.name.trim()}|${attributesKey}`;

                if (!itemMap[key]) {
                    // Format name with attributes for display
                    let displayName = item.name;
                    if (item.attributes && item.attributes.length > 0) {
                        const attrString = item.attributes.map(a => a.value).join(', ');
                        displayName = `${item.name} (${attrString})`;
                    }

                    itemMap[key] = { name: displayName, quantity: 0, revenue: 0 };
                }
                itemMap[key].quantity += item.quantity;
                itemMap[key].revenue += (item.price * item.quantity) + parseFloat(item.extraCharges || 0) - parseFloat(item.discount || 0);
            });
        });
        return Object.values(itemMap).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
    }, [filteredInvoices]);

    // Customer Data
    const customerData = useMemo(() => {
        const customerMap = {};
        filteredInvoices.forEach(inv => {
            if (!customerMap[inv.customerName]) {
                customerMap[inv.customerName] = { name: inv.customerName, count: 0, revenue: 0 };
            }
            customerMap[inv.customerName].count++;
            customerMap[inv.customerName].revenue += inv.total;
        });
        return Object.values(customerMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    }, [filteredInvoices]);

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Date Filter Section */}
            <View style={styles.filterSection}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <View style={{ flex: 1, marginRight: 5 }}>
                        <TextInput
                            label="Month"
                            value={months[selectedMonth]}
                            mode="outlined"
                            editable={false}
                            right={<TextInput.Icon icon="menu-down" />}
                            onPressIn={() => {
                                Keyboard.dismiss();
                                setShowMonthMenu(true);
                            }}
                        />
                        <Portal>
                            <Modal
                                visible={showMonthMenu}
                                onDismiss={() => setShowMonthMenu(false)}
                                contentContainerStyle={styles.modalContainer}
                            >
                                <Card>
                                    <Card.Title title="Select Month" />
                                    <Card.Content>
                                        {months.map((month, index) => (
                                            <List.Item
                                                key={month}
                                                title={month}
                                                onPress={() => { setSelectedMonth(index); setShowMonthMenu(false); }}
                                            />
                                        ))}
                                    </Card.Content>
                                    <Card.Actions>
                                        <Button onPress={() => setShowMonthMenu(false)}>Cancel</Button>
                                    </Card.Actions>
                                </Card>
                            </Modal>
                        </Portal>
                    </View>

                    <View style={{ flex: 1, marginLeft: 5 }}>
                        <TextInput
                            label="Year"
                            value={String(selectedYear)}
                            mode="outlined"
                            editable={false}
                            right={<TextInput.Icon icon="menu-down" />}
                            onPressIn={() => {
                                Keyboard.dismiss();
                                setShowYearMenu(true);
                            }}
                        />
                        <Portal>
                            <Modal
                                visible={showYearMenu}
                                onDismiss={() => setShowYearMenu(false)}
                                contentContainerStyle={styles.modalContainer}
                            >
                                <Card>
                                    <Card.Title title="Select Year" />
                                    <Card.Content>
                                        {years.map((year) => (
                                            <List.Item
                                                key={year}
                                                title={String(year)}
                                                onPress={() => { setSelectedYear(year); setShowYearMenu(false); }}
                                            />
                                        ))}
                                    </Card.Content>
                                    <Card.Actions>
                                        <Button onPress={() => setShowYearMenu(false)}>Cancel</Button>
                                    </Card.Actions>
                                </Card>
                            </Modal>
                        </Portal>
                    </View>
                </View>
            </View>

            {/* Summary Cards */}
            <View style={styles.summaryRow}>
                <Card style={styles.summaryCard}>
                    <Card.Content>
                        <Text variant="labelSmall" style={styles.cardLabel}>Total Sales</Text>
                        <Text variant="titleLarge" style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>
                            {metrics.totalRevenue.toLocaleString()}
                        </Text>
                    </Card.Content>
                </Card>
                <Card style={styles.summaryCard}>
                    <Card.Content>
                        <Text variant="labelSmall" style={styles.cardLabel}>Invoices</Text>
                        <Text variant="titleLarge" style={styles.cardValue}>{metrics.totalInvoices}</Text>
                    </Card.Content>
                </Card>
            </View>

            <SegmentedButtons
                value={view}
                onValueChange={setView}
                buttons={[
                    { value: 'overview', label: 'Overview' },
                    { value: 'items', label: 'Items' },
                    { value: 'customers', label: 'Customers' },
                ]}
                style={styles.segment}
            />

            {view === 'overview' && (
                <Card style={styles.card}>
                    <Card.Title title="Monthly Trend" />
                    <Card.Content>
                        <DataTable>
                            <DataTable.Header>
                                <DataTable.Title>Month</DataTable.Title>
                                <DataTable.Title numeric>Invoices</DataTable.Title>
                                <DataTable.Title numeric>Sales</DataTable.Title>
                            </DataTable.Header>
                            {monthlyData.map((item) => (
                                <DataTable.Row key={item.key}>
                                    <DataTable.Cell>{item.monthLabel}</DataTable.Cell>
                                    <DataTable.Cell numeric>{item.count}</DataTable.Cell>
                                    <DataTable.Cell numeric>
                                        <Text numberOfLines={1} adjustsFontSizeToFit>
                                            {item.revenue.toLocaleString()}
                                        </Text>
                                    </DataTable.Cell>
                                </DataTable.Row>
                            ))}
                            {monthlyData.length === 0 && <Text style={styles.emptyText}>No data for selected period</Text>}
                        </DataTable>
                    </Card.Content>
                </Card>
            )}

            {view === 'items' && (
                <Card style={styles.card}>
                    <Card.Title title="Top Selling Items" />
                    <Card.Content>
                        <DataTable>
                            <DataTable.Header>
                                <DataTable.Title style={{ flex: 2 }}>Product</DataTable.Title>
                                <DataTable.Title numeric>Sold</DataTable.Title>
                                <DataTable.Title numeric>Sales</DataTable.Title>
                            </DataTable.Header>
                            {itemData.map((item, index) => (
                                <DataTable.Row key={index}>
                                    <DataTable.Cell style={{ flex: 2 }}>{item.name}</DataTable.Cell>
                                    <DataTable.Cell numeric>{item.quantity}</DataTable.Cell>
                                    <DataTable.Cell numeric>
                                        <Text numberOfLines={1} adjustsFontSizeToFit>
                                            {item.revenue.toLocaleString()}
                                        </Text>
                                    </DataTable.Cell>
                                </DataTable.Row>
                            ))}
                            {itemData.length === 0 && <Text style={styles.emptyText}>No data for selected period</Text>}
                        </DataTable>
                    </Card.Content>
                </Card>
            )}

            {view === 'customers' && (
                <Card style={styles.card}>
                    <Card.Title title="Top Customers" />
                    <Card.Content>
                        <DataTable>
                            <DataTable.Header>
                                <DataTable.Title style={{ flex: 2 }}>Customer</DataTable.Title>
                                <DataTable.Title numeric>Orders</DataTable.Title>
                                <DataTable.Title numeric>Sales</DataTable.Title>
                            </DataTable.Header>
                            {customerData.map((item, index) => (
                                <DataTable.Row key={index}>
                                    <DataTable.Cell style={{ flex: 2 }}>{item.name}</DataTable.Cell>
                                    <DataTable.Cell numeric>{item.count}</DataTable.Cell>
                                    <DataTable.Cell numeric>
                                        <Text numberOfLines={1} adjustsFontSizeToFit>
                                            {item.revenue.toLocaleString()}
                                        </Text>
                                    </DataTable.Cell>
                                </DataTable.Row>
                            ))}
                            {customerData.length === 0 && <Text style={styles.emptyText}>No data for selected period</Text>}
                        </DataTable>
                    </Card.Content>
                </Card>
            )}
            <View style={{ height: 50 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
    },
    filterSection: {
        marginBottom: 15,
    },
    summaryRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    summaryCard: {
        flex: 1,
        marginHorizontal: 4,
        elevation: 2,
    },
    cardLabel: {
        color: '#666',
        marginBottom: 4,
    },
    cardValue: {
        fontWeight: 'bold',
        color: '#6200ee',
    },
    segment: {
        marginBottom: 15,
    },
    card: {
        marginBottom: 20,
        elevation: 2,
    },
    emptyText: {
        textAlign: 'center',
        padding: 20,
        color: '#888',
        fontStyle: 'italic',
    },
    modalContainer: {
        padding: 20,
        margin: 20,
    },
});
