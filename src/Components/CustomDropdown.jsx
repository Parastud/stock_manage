import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

// Add the getNestedValue function inside the CustomDropdown component
const getNestedValue = (obj, path) => {
  if (!obj || !path) return null;
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

const CustomDropdown = ({
  data = [],
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  onSelect,
  value,
  labelField,
  valueField,
  renderItem: customRenderItem,
  disabled = false,
  loading = false,
  search = true,
  style,
  dropdownStyle,
  maxHeight = 400,
  itemHeight = 60,
  error,
  errorStyle,
  containerStyle,
  placeholderStyle,
  selectedTextStyle,
  searchStyle,
  listStyle,
  itemTextStyle,
  noDataText = "No data available",
  autoClose = true,
  testID
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [dropdownLayout, setDropdownLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-10)).current;
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardDidHideListener?.remove();
      keyboardDidShowListener?.remove();
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -10,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, fadeAnim, slideAnim]);

  const filteredData = search && searchText
    ? data.filter(item => {
        try {
          const label = getNestedValue(item, labelField);
          return label?.toString().toLowerCase().includes(searchText.toLowerCase());
        } catch (error) {
          console.warn('Error filtering data:', error);
          return false;
        }
      })
    : data;

  const getSelectedLabel = () => {
    if (!value || loading) return placeholder;
    
    try {
      const selectedItem = data.find(item => {
        const itemValue = getNestedValue(item, valueField);
        return itemValue === value;
      });
      
      if (selectedItem) {
        return getNestedValue(selectedItem, labelField) || placeholder;
      }
    } catch (error) {
      console.warn('Error getting selected label:', error);
    }
    return placeholder;
  };

  const handleSelect = (item) => {
    try {
      onSelect?.(item);
      
      if (autoClose) {
        closeDropdown();
      }
    } catch (error) {
      console.warn('Error handling selection:', error);
    }
  };

  const openDropdown = () => {
    if (disabled || loading) return;
    
    dropdownRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setDropdownLayout({ x: pageX, y: pageY, width, height });
    });
    
    setIsVisible(true);
    setSearchText('');
  };

  const closeDropdown = () => {
    setIsVisible(false);
    setSearchText('');
    Keyboard.dismiss();
  };

  const calculateModalPosition = () => {
    const statusBarHeight = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight || 0;
    const availableHeight = screenHeight - keyboardHeight - statusBarHeight - 100;
    const dropdownBottom = dropdownLayout.y + dropdownLayout.height;
    const spaceBelow = screenHeight - dropdownBottom - keyboardHeight;
    const spaceAbove = dropdownLayout.y - statusBarHeight;
    
    let modalHeight = Math.min(maxHeight, filteredData.length * itemHeight + (search ? 60 : 0) + 20);
    
    if (spaceBelow >= modalHeight) {
      // Show below
      return {
        top: dropdownBottom + 5,
        maxHeight: Math.min(modalHeight, spaceBelow - 10),
        marginBottom: 0
      };
    } else if (spaceAbove >= modalHeight) {
      // Show above
      return {
        top: dropdownLayout.y - modalHeight - 5,
        maxHeight: Math.min(modalHeight, spaceAbove - 10),
        marginBottom: 0
      };
    } else {
      // Show in center with available space
      return {
        top: statusBarHeight + 50,
        maxHeight: availableHeight,
        marginBottom: 0
      };
    }
  };

  const renderDefaultItem = ({ item, index }) => {
    try {
      const label = getNestedValue(item, labelField);
      const isSelected = getNestedValue(item, valueField) === value;
      
      return (
        <TouchableOpacity
          style={[
            styles.defaultItem,
            { height: itemHeight },
            isSelected && styles.selectedItem,
            index === filteredData.length - 1 && styles.lastItem
          ]}
          onPress={() => handleSelect(item)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.defaultItemText,
            itemTextStyle,
            isSelected && styles.selectedItemText
          ]} numberOfLines={2}>
            {label || 'N/A'}
          </Text>
          {isSelected && (
            <Ionicons name="checkmark" size={20} color="#2563eb" style={styles.checkIcon} />
          )}
        </TouchableOpacity>
      );
    } catch (error) {
      console.warn('Error rendering default item:', error);
      return (
        <TouchableOpacity style={styles.defaultItem}>
          <Text style={styles.defaultItemText}>Error loading item</Text>
        </TouchableOpacity>
      );
    }
  };

  const renderItemComponent = ({ item, index }) => {
    if (customRenderItem) {
      return (
        <TouchableOpacity onPress={() => handleSelect(item)} activeOpacity={0.7}>
          {customRenderItem(item, index)}
        </TouchableOpacity>
      );
    }
    return renderDefaultItem({ item, index });
  };

  const modalPosition = isVisible ? calculateModalPosition() : {};

  return (
    <View style={[containerStyle]} testID={testID}>
      <TouchableOpacity
        ref={dropdownRef}
        style={[
          styles.dropdown,
          style,
          disabled && styles.disabled,
          loading && styles.loading,
          error && styles.errorBorder
        ]}
        onPress={openDropdown}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.selectedText,
          selectedTextStyle,
          (!value || loading) && [styles.placeholder, placeholderStyle],
          disabled && styles.disabledText
        ]} numberOfLines={1}>
          {loading ? 'Loading...' : getSelectedLabel()}
        </Text>
        
        <View style={styles.iconContainer}>
          {loading ? (
            <Ionicons name="refresh" size={20} color="#999" />
          ) : (
            <Ionicons 
              name={isVisible ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={disabled ? "#ccc" : "#666"} 
            />
          )}
        </View>
      </TouchableOpacity>

      {error && (
        <Text style={[styles.errorText, errorStyle]}>{error}</Text>
      )}

      <Modal
        visible={isVisible}
        transparent
        animationType="none"
        onRequestClose={closeDropdown}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeDropdown}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                left: 20,
                right: 20,
                width: screenWidth - 40,
                ...modalPosition
              },
              dropdownStyle,
              listStyle
            ]}
            onStartShouldSetResponder={() => true}
          >
            {search && (
              <View style={[styles.searchContainer, searchStyle]}>
                <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
                <TextInput
                  ref={searchInputRef}
                  style={styles.searchInput}
                  placeholder={searchPlaceholder}
                  value={searchText}
                  onChangeText={setSearchText}
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                />
                {searchText.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={18} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            <FlatList
              data={filteredData}
              keyExtractor={(item, index) => {
                try {
                  const itemValue = getNestedValue(item, valueField);
                  return itemValue?.toString() || `item_${index}`;
                } catch (error) {
                  return `item_${index}`;
                }
              }}
              renderItem={renderItemComponent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={true}
              getItemLayout={(data, index) => ({
                length: itemHeight,
                offset: itemHeight * index,
                index,
              })}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="folder-open-outline" size={32} color="#ccc" />
                  <Text style={styles.emptyText}>
                    {search && searchText ? 'No results found' : noDataText}
                  </Text>
                </View>
              }
              style={styles.flatList}
            />
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdown: {
    height: 50,
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  disabled: {
    backgroundColor: '#f9fafb',
    opacity: 0.7,
  },
  loading: {
    opacity: 0.8,
  },
  errorBorder: {
    borderColor: '#ef4444',
    borderWidth: 1.5,
  },
  selectedText: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
    fontWeight: '400',
  },
  placeholder: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  disabledText: {
    color: '#d1d5db',
  },
  iconContainer: {
    marginLeft: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#f9fafb',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#1f2937',
    paddingHorizontal: 8,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  flatList: {
    maxHeight: 300,
  },
  defaultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  selectedItem: {
    backgroundColor: '#eff6ff',
  },
  defaultItemText: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
    fontWeight: '400',
  },
  selectedItemText: {
    color: '#2563eb',
    fontWeight: '500',
  },
  checkIcon: {
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default CustomDropdown;
