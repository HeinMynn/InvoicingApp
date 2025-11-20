#!/usr/bin/env python3
"""
Script to batch apply theme background to all React Native screens.
This script will add useTheme and apply backgroundColor: theme.colors.background
to all View/ScrollView container components.
"""

screens_to_update = [
    {
        "path": "/Users/aungheinmynn/Dev/InvoicingApp/src/screens/Invoice/CreateInvoiceScreen.js",
        "container": "View",
        "line_approx": 200
    },
    {
        "path": "/Users/aungheinmynn/Dev/InvoicingApp/src/screens/Product/ProductFormScreen.js",
        "container": "ScrollView",
        "line_approx": 260
    },
    {
        "path": "/Users/aungheinmynn/Dev/InvoicingApp/src/screens/Customer/CustomerFormScreen.js",
        "container": "ScrollView",
        "line_approx": 30
    },
    {
        "path": "/Users/aungheinmynn/Dev/InvoicingApp/src/screens/Customer/CustomerInvoicesScreen.js",
        "container": "View",
        "line_approx": 25
    },
    {
        "path": "/Users/aungheinmynn/Dev/InvoicingApp/src/screens/Category/CategoryListScreen.js",
        "container": "View",
        "line_approx": 25
    },
    {
        "path": "/Users/aungheinmynn/Dev/InvoicingApp/src/screens/Category/CategoryFormScreen.js",
        "container": "ScrollView",
        "line_approx":30
    },
    {
        "path": "/Users/aungheinmynn/Dev/InvoicingApp/src/screens/Attribute/AttributeListScreen.js",
        "container": "View",
        "line_approx": 30
    },
    {
        "path": "/Users/aungheinmynn/Dev/InvoicingApp/src/screens/Attribute/AttributeFormScreen.js",
        "container": "ScrollView",
        "line_approx": 40
    },
    {
        "path": "/Users/aungheinmynn/Dev/InvoicingApp/src/screens/LoginScreen.js",
        "container": "View",
        "line_approx": 20
    }
]

print(f"Need to update {len(screens_to_update)} screens")
for screen in screens_to_update:
    print(f"  - {screen['path'].split('/')[-1]}")
