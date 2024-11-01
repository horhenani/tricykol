// src/components/BottomSheet.js
import React from 'react';
import { View, Modal, StyleSheet, TouchableWithoutFeedback, Animated } from 'react-native';
import { colors } from '../styles/globalStyles';

const UserType = ({ isVisible, onClose, children }) => {
  const [animation] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(animation, {
      toValue: isVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible, animation]);

  const bottomSheetStyle = {
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [200, 0],
        }),
      },
    ],
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType='slide'
    //   onRequestClose={onClose}
    //   <TouchableWithoutFeedback onPress={onClose}>
    >
      <TouchableWithoutFeedback
      >
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.bottomSheetContainer, bottomSheetStyle]}>
              {children}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
     </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.secondary,
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '70%',
    maxHeight: '70%',
  },
});

export default UserType;