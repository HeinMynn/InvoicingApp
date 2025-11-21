// handleCreateNewAttribute and handleAddValueToAttribute functions
const handleCreateNewAttribute = () => {
    if (newAttributeName.trim()) {
        const newAttr = { name: newAttributeName.trim(), values: [] };
        addAttribute(newAttr);

        // Auto-add to product after creation
        setTimeout(() => {
            const createdAttr = globalAttributes.find(attr => attr.name === newAttr.name);
            if (createdAttr && !selectedAttributes.find(a => a.id === createdAttr.id)) {
                setSelectedAttributes([...selectedAttributes, { ...createdAttr, useAsVariation: true, selectedValues: [] }]);
            }
        }, 100);

        setNewAttributeName('');
        setAttributeDialogVisible(false);
    }
};

const handleAddValueToAttribute = (attrId) => {
    const valueToAdd = attributeValueInputs[attrId];
    if (valueToAdd && valueToAdd.trim()) {
        const attr = selectedAttributes.find(a => a.id === attrId);
        if (attr) {
            const updatedValues = [...(attr.values || []), valueToAdd.trim()];

            // Update in global store with correct signature (id, data)
            const updateAttribute = useStore.getState().updateAttribute;
            updateAttribute(attr.id, { values: updatedValues });

            // Update in selected attributes
            setSelectedAttributes(selectedAttributes.map(a =>
                a.id === attrId ? { ...a, values: updatedValues } : a
            ));

            // Clear input
            setAttributeValueInputs({ ...attributeValueInputs, [attrId]: '' });
        }
    }
};
