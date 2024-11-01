import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import { colors, fonts, fontSizes } from '../styles/globalStyles';

const SexPicker = ({ options, selectedValue, onValueChange, label }) => {
  const [isModalVisible, setModalVisible] = useState(false);

  const toggleModal = () => setModalVisible(!isModalVisible);

  const handleSelect = (value) => {
    onValueChange(value);
    toggleModal();
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={toggleModal} style={styles.selectButton}>
        <Text style={styles.selectButtonText}>
          {options.find(option => option.value === selectedValue)?.label || 'Select'}
        </Text>
      </TouchableOpacity>

      <Modal
        isVisible={isModalVisible}
        onBackdropPress={toggleModal}
        swipeDirection="down"
        onSwipeComplete={toggleModal}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerText}>{label}</Text>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.option}
                onPress={() => handleSelect(item.value)}
              >
                <Text style={styles.optionText}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: fontSizes.medium,
    fontFamily: fonts.regular,
    color: colors.text,
    marginBottom: 5,
  },
  selectButton: {
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  selectButtonText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.medium,
    color: colors.text,
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    // borderBottomWidth: 1,
    // borderBottomColor: colors.gray,
    paddingBottom: 15,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  headerText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    color: colors.text,
    textAlign: 'center',
  },
  option: {
    padding: 20,
    // borderBottomWidth: 1,
    // borderBottomColor: colors.gray,
  },
  optionText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.medium,
    color: colors.text,
  },
});

export default SexPicker;
