import React from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { List, FAB, Text, IconButton, useTheme, Divider, Button, Portal, Modal, Card } from 'react-native-paper';
import { Swipeable } from 'react-native-gesture-handler';
import { useStore } from '../../store/useStore';
import { useCurrency } from '../../hooks/useCurrency';

export default function InvoiceListScreen({ navigation }) {
    const invoices = useStore((state) => state.invoices);
    const deleteInvoice = useStore((state) => state.deleteInvoice);
    const theme = useTheme();
    const currency = useCurrency();

    // Filter State
    const [selectedMonth, setSelectedMonth] = React.useState(null); // null = All
    const [selectedYear, setSelectedYear] = React.useState(null); // null = All
    const [monthMenuVisible, setMonthMenuVisible] = React.useState(false);
    const [yearMenuVisible, setYearMenuVisible] = React.useState(false);

    const months = [
        { label: 'All Months', value: null },
        { label: 'January', value: 0 }, { label: 'February', value: 1 },
        { label: 'March', value: 2 }, { label: 'April', value: 3 },
        { label: 'May', value: 4 }, { label: 'June', value: 5 },
        { label: 'July', value: 6 }, { label: 'August', value: 7 },
        { label: 'September', value: 8 }, { label: 'October', value: 9 },
        { label: 'November', value: 10 }, { label: 'December', value: 11 }
    ];

    const years = React.useMemo(() => {
        const currentYear = new Date().getFullYear();

        // Find the oldest invoice year
        let oldestYear = currentYear;
        if (invoices.length > 0) {
            oldestYear = Math.min(...invoices.map(inv => new Date(inv.date).getFullYear()));
        }

        // Generate years from oldest to current
        const yearList = [{ label: 'All Years', value: null }];
        for (let year = currentYear; year >= oldestYear; year--) {
            yearList.push({ label: year.toString(), value: year });
        }

        return yearList;
    }, [invoices]);

    const filteredInvoices = React.useMemo(() => {
        return invoices.filter(inv => {
            const d = new Date(inv.date);
            const matchMonth = selectedMonth === null || d.getMonth() === selectedMonth;
            const matchYear = selectedYear === null || d.getFullYear() === selectedYear;
            return matchMonth && matchYear;
        }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date desc
    }, [invoices, selectedMonth, selectedYear]);

    const handleDelete = (id) => {
        Alert.alert(
            'Delete Invoice',
            'Are you sure you want to delete this invoice?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteInvoice(id) },
            ]
        );
    };

    let rowRefs = new Map();

    const closeRow = (id) => {
        [...rowRefs.entries()].forEach(([key, ref]) => {
            if (key !== id && ref) ref.close();
        });
    };

    const renderRightActions = (item, ref) => {
        return (
            <View style={styles.swipeActions}>
                <View style={styles.editAction}>
                    <IconButton
                        icon="pencil"
                        iconColor="white"
                        onPress={() => {
                            ref.close();
                            navigation.navigate('CreateInvoice', { invoice: item });
                        }}
                    />
                </View>
                <View style={styles.deleteAction}>
                    <IconButton
                        icon="delete"
                        iconColor="white"
                        onPress={() => {
                            ref.close();
                            handleDelete(item.id);
                        }}
                    />
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Filters */}
            <View style={styles.filterContainer}>
                <Button
                    mode="outlined"
                    onPress={() => setMonthMenuVisible(true)}
                    style={styles.filterButton}
                >
                    {selectedMonth === null ? 'All Months' : months.find(m => m.value === selectedMonth)?.label}
                </Button>
                <Button
                    mode="outlined"
                    onPress={() => setYearMenuVisible(true)}
                    style={styles.filterButton}
                >
                    {selectedYear === null ? 'All Years' : selectedYear}
                </Button>
            </View>

            <FlatList
                data={filteredInvoices}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <Swipeable
                        ref={(ref) => {
                            if (ref && !rowRefs.get(item.id)) {
                                rowRefs.set(item.id, ref);
                            }
                        }}
                        onSwipeableWillOpen={() => closeRow(item.id)}
                        renderRightActions={() => renderRightActions(item, rowRefs.get(item.id))}
                    >
                        <List.Item
                            title={`Invoice #${item.id}`}
                            description={`Customer: ${item.customerName} | Total: ${item.total} ${currency}`}
                            right={(props) => <Text {...props} style={{ alignSelf: 'center' }}>{new Date(item.date).toLocaleDateString()}</Text>}
                            onPress={() => navigation.navigate('InvoicePreview', { invoice: item })}
                        />
                    </Swipeable>
                )}
                ListEmptyComponent={<Text style={styles.empty}>No invoices found</Text>}
                ItemSeparatorComponent={() => <Divider />}
            />
            <FAB
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                icon="plus"
                color={theme.colors.onPrimary}
                onPress={() => navigation.navigate('CreateInvoice')}
            />

            {/* Month Modal */}
            <Portal>
                <Modal visible={monthMenuVisible} onDismiss={() => setMonthMenuVisible(false)} contentContainerStyle={styles.modalContainer}>
                    <Card>
                        <Card.Title title="Select Month" />
                        <Card.Content>
                            {months.map((m) => (
                                <List.Item
                                    key={m.label}
                                    title={m.label}
                                    onPress={() => {
                                        setSelectedMonth(m.value);
                                        setMonthMenuVisible(false);
                                    }}
                                    right={props => selectedMonth === m.value ? <List.Icon {...props} icon="check" /> : null}
                                />
                            ))}
                        </Card.Content>
                    </Card>
                </Modal>
            </Portal>

            {/* Year Modal */}
            <Portal>
                <Modal visible={yearMenuVisible} onDismiss={() => setYearMenuVisible(false)} contentContainerStyle={styles.modalContainer}>
                    <Card>
                        <Card.Title title="Select Year" />
                        <Card.Content>
                            {years.map((y) => (
                                <List.Item
                                    key={y.label}
                                    title={y.label}
                                    onPress={() => {
                                        setSelectedYear(y.value);
                                        setYearMenuVisible(false);
                                    }}
                                    right={props => selectedYear === y.value ? <List.Icon {...props} icon="check" /> : null}
                                />
                            ))}
                        </Card.Content>
                    </Card>
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
    },
    filterButton: {
        flex: 1,
        marginHorizontal: 5,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    empty: {
        textAlign: 'center',
        marginTop: 20,
        color: '#666',
    },
    swipeActions: {
        flexDirection: 'row',
    },
    editAction: {
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
    },
    deleteAction: {
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
    },
    modalContainer: {
        padding: 20,
        maxHeight: '80%',
    },
});
