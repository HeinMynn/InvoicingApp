import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Keyboard, Dimensions, Platform } from 'react-native';
import { Text, Card, SegmentedButtons, DataTable, Button, Divider, useTheme, TextInput, Portal, Modal, List, IconButton, Chip } from 'react-native-paper';
import { useStore } from '../store/useStore';
import { useCurrency } from '../hooks/useCurrency';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const screenWidth = Dimensions.get('window').width;

export default function ReportScreen() {
    const invoices = useStore((state) => state.invoices);
    const products = useStore((state) => state.products);
    const categories = useStore((state) => state.categories);
    const theme = useTheme();
    const currency = useCurrency();
    const [view, setView] = useState('overview'); // 'overview' | 'items' | 'customers' | 'trends'

    // Date Filtering
    const [dateRange, setDateRange] = useState('thisMonth'); // 'today', 'yesterday', 'last7', 'last30', 'thisMonth', 'lastMonth', 'custom'
    const [customMonth, setCustomMonth] = useState(new Date().getMonth());
    const [customYear, setCustomYear] = useState(new Date().getFullYear());
    const [showMonthMenu, setShowMonthMenu] = useState(false);
    const [showYearMenu, setShowYearMenu] = useState(false);

    // Chart Metric Toggle
    const [chartMetric, setChartMetric] = useState('revenue'); // 'revenue' | 'quantity'

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();

        // Find the oldest invoice year
        let oldestYear = currentYear;
        if (invoices.length > 0) {
            oldestYear = Math.min(...invoices.map(inv => new Date(inv.date).getFullYear()));
        }

        // Generate years from oldest to current
        const yearList = [];
        for (let year = currentYear; year >= oldestYear; year--) {
            yearList.push(year);
        }

        return yearList;
    }, [invoices]);

    // Filter Invoices based on Date Range
    const filteredInvoices = useMemo(() => {
        const now = new Date();
        let start, end;

        switch (dateRange) {
            case 'today':
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                break;
            case 'yesterday':
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
                break;
            case 'last7':
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                break;
            case 'last30':
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                break;
            case 'thisMonth':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
                break;
            case 'lastMonth':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
                break;
            case 'custom':
                start = new Date(customYear, customMonth, 1);
                end = new Date(customYear, customMonth + 1, 0, 23, 59, 59);
                break;
            default:
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        }

        return invoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= start && invDate <= end;
        });
    }, [invoices, dateRange, customMonth, customYear]);

    // Calculate Metrics
    const metrics = useMemo(() => {
        const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
        const totalInvoices = filteredInvoices.length;
        const totalItemsSold = filteredInvoices.reduce((sum, inv) => sum + inv.items.reduce((isum, item) => isum + item.quantity, 0), 0);
        return { totalRevenue, totalInvoices, totalItemsSold };
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

    // Chart Data (Category Sales Trend)
    const chartData = useMemo(() => {
        if (filteredInvoices.length === 0) return null;

        // 1. Identify all unique dates in the range (for labels)
        const dateSet = new Set();
        filteredInvoices.forEach(inv => {
            const date = new Date(inv.date);
            dateSet.add(`${date.getDate()}/${date.getMonth() + 1}`);
        });
        // Sort dates? Ideally yes, but for now let's rely on invoice order or simple sort
        const labels = Array.from(dateSet).sort((a, b) => {
            const [d1, m1] = a.split('/').map(Number);
            const [d2, m2] = b.split('/').map(Number);
            return m1 === m2 ? d1 - d2 : m1 - m2;
        }).slice(-7); // Last 7 days/points

        // 2. Initialize datasets for each category
        const categoryMap = {}; // { categoryId: { name, dataMap: { dateLabel: revenue } } }

        // Helper to get category name
        const getCategoryName = (catId) => {
            if (!catId) return 'Uncategorized';
            const cat = categories.find(c => c.id === catId);
            return cat ? cat.name : 'Uncategorized';
        };

        // 3. Aggregate Data
        filteredInvoices.forEach(inv => {
            const date = new Date(inv.date);
            const dateLabel = `${date.getDate()}/${date.getMonth() + 1}`;

            if (!labels.includes(dateLabel)) return; // Skip if outside our label range (though filteredInvoices should match)

            inv.items.forEach(item => {
                // Find product to get category
                const product = products.find(p => p.id === item.productId);
                const catId = product ? product.categoryId : null;
                const catName = getCategoryName(catId);

                if (!categoryMap[catName]) {
                    categoryMap[catName] = { name: catName, dataMap: {} };
                    labels.forEach(l => categoryMap[catName].dataMap[l] = 0); // Init all dates to 0
                }

                const itemRevenue = (item.price * item.quantity) + parseFloat(item.extraCharges || 0) - parseFloat(item.discount || 0);

                if (chartMetric === 'revenue') {
                    categoryMap[catName].dataMap[dateLabel] += itemRevenue;
                } else {
                    categoryMap[catName].dataMap[dateLabel] += item.quantity;
                }
            });
        });

        // 4. Format for ChartKit
        const datasets = Object.values(categoryMap).map((cat, index) => {
            const data = labels.map(label => cat.dataMap[label]);
            // Generate color based on index
            const colors = [
                (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,    // Red
                (opacity = 1) => `rgba(0, 255, 0, ${opacity})`,    // Green
                (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,    // Blue
                (opacity = 1) => `rgba(255, 255, 0, ${opacity})`,  // Yellow
                (opacity = 1) => `rgba(128, 0, 128, ${opacity})`,  // Purple
                (opacity = 1) => `rgba(255, 165, 0, ${opacity})`,  // Orange
                (opacity = 1) => `rgba(0, 255, 255, ${opacity})`,  // Cyan
                (opacity = 1) => `rgba(255, 192, 203, ${opacity})`, // Pink
            ];
            const color = colors[index % colors.length];

            return {
                data,
                color,
                strokeWidth: 2,
                legend: cat.name // Add legend
            };
        });

        if (datasets.length === 0) return null;

        return {
            labels,
            datasets,
            legend: datasets.map(ds => ds.legend) // Explicit legend array for some chart configs
        };
    }, [filteredInvoices, products, categories, chartMetric]);

    // Item Data
    const itemData = useMemo(() => {
        const itemMap = {};
        filteredInvoices.forEach(inv => {
            inv.items.forEach(item => {
                const attributesKey = item.attributes
                    ? JSON.stringify([...item.attributes].sort((a, b) => a.key.localeCompare(b.key)).map(a => ({ ...a, value: a.value.trim() })))
                    : '';
                const key = `${item.name.trim()}|${attributesKey}`;

                if (!itemMap[key]) {
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
        return Object.values(itemMap).sort((a, b) => b.quantity - a.quantity);
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

    // Product Trends Data (Drill-down)
    const [selectedProductForTrend, setSelectedProductForTrend] = useState(null);
    const productTrendData = useMemo(() => {
        if (!selectedProductForTrend) return null;

        const grouped = {};
        filteredInvoices.forEach(inv => {
            const date = new Date(inv.date);
            // Group by Day if range is short, Month if range is long? 
            // For simplicity, let's stick to Day for now as requested "by day of month"
            const key = `${date.getDate()}/${date.getMonth() + 1}`;

            inv.items.forEach(item => {
                // Simple name match for now, ignoring attributes for aggregate trend unless we want specific variant
                if (item.name.includes(selectedProductForTrend.split('(')[0].trim())) {
                    if (!grouped[key]) grouped[key] = 0;
                    grouped[key] += item.quantity;
                }
            });
        });

        const labels = Object.keys(grouped);
        const data = Object.values(grouped);

        if (data.length === 0) return null;

        return {
            labels,
            datasets: [{ data }]
        };
    }, [filteredInvoices, selectedProductForTrend]);

    const exportToCSV = async () => {
        let csvContent = "Date,Invoice ID,Customer,Items,Total\n";
        filteredInvoices.forEach(inv => {
            const itemsString = inv.items.map(i => `${i.quantity}x ${i.name}`).join('; ');
            csvContent += `${new Date(inv.date).toLocaleDateString()},${inv.id},${inv.customerName},"${itemsString}",${inv.total}\n`;
        });

        const fileName = `${FileSystem.documentDirectory}sales_report.csv`;
        await FileSystem.writeAsStringAsync(fileName, csvContent);
        await Sharing.shareAsync(fileName);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Date Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {['today', 'yesterday', 'last7', 'last30', 'thisMonth', 'lastMonth', 'custom'].map(range => (
                    <Chip
                        key={range}
                        selected={dateRange === range}
                        onPress={() => setDateRange(range)}
                        style={styles.chip}
                        showSelectedOverlay
                    >
                        {range === 'today' ? 'Today' :
                            range === 'yesterday' ? 'Yesterday' :
                                range === 'last7' ? 'Last 7 Days' :
                                    range === 'last30' ? 'Last 30 Days' :
                                        range === 'thisMonth' ? 'This Month' :
                                            range === 'lastMonth' ? 'Last Month' : 'Custom'}
                    </Chip>
                ))}
            </ScrollView>

            {dateRange === 'custom' && (
                <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                    <Button onPress={() => setShowMonthMenu(true)} mode="outlined" style={{ flex: 1, marginRight: 5 }}>
                        {months[customMonth]}
                    </Button>
                    <Button onPress={() => setShowYearMenu(true)} mode="outlined" style={{ flex: 1, marginLeft: 5 }}>
                        {customYear}
                    </Button>
                </View>
            )}

            {/* Custom Date Pickers */}
            <Portal>
                <Modal visible={showMonthMenu} onDismiss={() => setShowMonthMenu(false)} contentContainerStyle={styles.modalContainer}>
                    <Card>
                        <Card.Title title="Select Month" />
                        <Card.Content>
                            <ScrollView style={{ maxHeight: 300 }}>
                                {months.map((month, index) => (
                                    <List.Item key={month} title={month} onPress={() => { setCustomMonth(index); setShowMonthMenu(false); }} />
                                ))}
                            </ScrollView>
                        </Card.Content>
                    </Card>
                </Modal>
                <Modal visible={showYearMenu} onDismiss={() => setShowYearMenu(false)} contentContainerStyle={styles.modalContainer}>
                    <Card>
                        <Card.Title title="Select Year" />
                        <Card.Content>
                            {years.map((year) => (
                                <List.Item key={year} title={String(year)} onPress={() => { setCustomYear(year); setShowYearMenu(false); }} />
                            ))}
                        </Card.Content>
                    </Card>
                </Modal>
            </Portal>

            {/* Summary Cards */}
            {/* Summary Cards */}
            <View style={styles.summarySection}>
                <Card style={[styles.summaryCard, { backgroundColor: '#e3f2fd', marginBottom: 10, width: '100%' }]}>
                    <Card.Content>
                        <Text variant="labelSmall" style={styles.cardLabel}>Total Revenue</Text>
                        <Text variant="headlineSmall" style={{ color: '#1565c0', fontWeight: 'bold' }}>
                            {metrics.totalRevenue.toLocaleString()} {currency}
                        </Text>
                    </Card.Content>
                </Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Card style={[styles.summaryCard, { backgroundColor: '#e8f5e9', flex: 1, marginRight: 5 }]}>
                        <Card.Content>
                            <Text variant="labelSmall" style={styles.cardLabel}>Invoices</Text>
                            <Text variant="headlineSmall" style={{ color: '#2e7d32', fontWeight: 'bold' }}>{metrics.totalInvoices}</Text>
                        </Card.Content>
                    </Card>
                    <Card style={[styles.summaryCard, { backgroundColor: '#fff3e0', flex: 1, marginLeft: 5 }]}>
                        <Card.Content>
                            <Text variant="labelSmall" style={styles.cardLabel}>Items Sold</Text>
                            <Text variant="headlineSmall" style={{ color: '#ef6c00', fontWeight: 'bold' }}>{metrics.totalItemsSold}</Text>
                        </Card.Content>
                    </Card>
                </View>
            </View>

            {/* Revenue/Qty Chart */}
            {chartData && (
                <Card style={styles.card}>
                    <Card.Title title="Sale Trend" />
                    <Card.Content>
                        <View style={{ marginBottom: 10 }}>
                            <SegmentedButtons
                                value={chartMetric}
                                onValueChange={setChartMetric}
                                buttons={[
                                    { value: 'revenue', label: 'Money' },
                                    { value: 'quantity', label: 'Qty' },
                                ]}
                                density="small"
                            />
                        </View>
                        <LineChart
                            data={chartData}
                            width={screenWidth - 60}
                            height={220}
                            chartConfig={{
                                backgroundColor: theme.colors.surface,
                                backgroundGradientFrom: theme.colors.surface,
                                backgroundGradientTo: theme.colors.surface,
                                decimalPlaces: 0,
                                color: (opacity = 1) => theme.dark ? `rgba(172, 148, 35, ${opacity})` : `rgba(165, 42, 46, ${opacity})`,
                                labelColor: (opacity = 1) => theme.dark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                                style: { borderRadius: 16 },
                                propsForDots: { r: "6", strokeWidth: "2", stroke: "#ffa726" }
                            }}
                            bezier
                            style={{ marginVertical: 8, borderRadius: 16 }}
                        />
                    </Card.Content>
                </Card>
            )}

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
                <View>
                    <Button icon="download" mode="contained" onPress={exportToCSV} style={{ marginBottom: 20 }}>
                        Export Report to CSV
                    </Button>
                </View>
            )}

            {view === 'items' && (
                <View>
                    {/* Product Trend Drill Down */}
                    {selectedProductForTrend && productTrendData && (
                        <Card style={[styles.card, { borderColor: theme.colors.primary, borderWidth: 1 }]}>
                            <Card.Title
                                title={`Sales Trend: ${selectedProductForTrend}`}
                                right={(props) => <IconButton {...props} icon="close" onPress={() => setSelectedProductForTrend(null)} />}
                            />
                            <Card.Content>
                                <BarChart
                                    data={productTrendData}
                                    width={screenWidth - 60}
                                    height={220}
                                    yAxisLabel=""
                                    chartConfig={{
                                        backgroundColor: theme.colors.surface,
                                        backgroundGradientFrom: theme.colors.surface,
                                        backgroundGradientTo: theme.colors.surface,
                                        decimalPlaces: 0,
                                        color: (opacity = 1) => `rgba(255, 111, 0, ${opacity})`, // Orange for items
                                        labelColor: (opacity = 1) => theme.dark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                                    }}
                                    style={{ marginVertical: 8, borderRadius: 16 }}
                                />
                            </Card.Content>
                        </Card>
                    )}

                    <Card style={styles.card}>
                        <Card.Title title="Top Selling Items" subtitle="Tap item to see sales trend" />
                        <Card.Content>
                            <DataTable>
                                <DataTable.Header>
                                    <DataTable.Title style={{ flex: 2 }}>Product</DataTable.Title>
                                    <DataTable.Title numeric>Sold</DataTable.Title>
                                    <DataTable.Title numeric>Revenue</DataTable.Title>
                                </DataTable.Header>
                                {itemData.map((item, index) => (
                                    <DataTable.Row key={index} onPress={() => setSelectedProductForTrend(item.name)}>
                                        <DataTable.Cell style={{ flex: 2 }}>
                                            <Text numberOfLines={2}>{item.name}</Text>
                                        </DataTable.Cell>
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
                </View>
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
    filterScroll: {
        marginBottom: 15,
        flexGrow: 0,
    },
    chip: {
        marginRight: 8,
    },
    summarySection: {
        marginBottom: 20,
    },
    summaryCard: {
        elevation: 2,
        justifyContent: 'center',
        alignItems: 'center'
    },
    cardLabel: {
        color: '#666',
        marginBottom: 4,
        textAlign: 'center'
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
