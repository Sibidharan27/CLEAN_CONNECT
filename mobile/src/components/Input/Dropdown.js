import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, textStyles, BorderRadius, Spacing, Shadows } from '../../theme';

const Dropdown = ({
  label,
  value,
  options = [],
  onSelect,
  placeholder = 'Select option',
  error,
  containerStyle,
}) => {
  const [visible, setVisible] = useState(false);

  const selected = options.find(o => o.value === value);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.trigger, error && styles.errorTrigger]}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.triggerContent}>
          {selected?.icon && (
            <MaterialCommunityIcons
              name={selected.icon}
              size={18}
              color={selected ? Colors.primary : Colors.placeholder}
              style={{ marginRight: 8 }}
            />
          )}
          <Text style={[styles.triggerText, !selected && styles.placeholder]}>
            {selected ? selected.label : placeholder}
          </Text>
        </View>
        <MaterialCommunityIcons
          name={visible ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Colors.textTertiary}
        />
      </TouchableOpacity>
      {error && (
        <View style={styles.errorRow}>
          <MaterialCommunityIcons name="alert-circle-outline" size={14} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label || 'Select'}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, item.value === value && styles.selectedOption]}
                  onPress={() => { onSelect(item.value); setVisible(false); }}
                >
                  {item.icon && (
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={20}
                      color={item.value === value ? Colors.primary : Colors.textSecondary}
                      style={{ marginRight: 12 }}
                    />
                  )}
                  <Text style={[styles.optionText, item.value === value && styles.selectedOptionText]}>
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <MaterialCommunityIcons name="check" size={18} color={Colors.primary} style={{ marginLeft: 'auto' }} />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.base },
  label: {
    ...textStyles.label,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  errorTrigger: { borderColor: Colors.danger },
  triggerContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  triggerText: { ...textStyles.body, color: Colors.textPrimary },
  placeholder: { color: Colors.placeholder },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  errorText: { ...textStyles.caption, color: Colors.danger, marginLeft: 4 },
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    maxHeight: '70%',
    paddingBottom: Spacing.xl,
    ...Shadows.xl,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  sheetTitle: { ...textStyles.h6, color: Colors.textPrimary },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  selectedOption: { backgroundColor: Colors.primarySurface },
  optionText: { ...textStyles.body, color: Colors.textPrimary },
  selectedOptionText: { color: Colors.primary, fontFamily: 'Poppins_600SemiBold' },
  separator: { height: 1, backgroundColor: Colors.divider },
});

export default Dropdown;
