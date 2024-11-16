import React from 'react';
import { Appbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@constants/globalStyles';


const LocationPickerAppHeader = () => {
  const navigation = useNavigation();

  return (

    <Appbar.Header
      statusBarHeight={10}
      style={{backgroundColor: 'transparent'}}
    >
      <Appbar.BackAction onPress={() => navigation.goBack()} style={{ backgroundColor: colors.background, borderRadius: 100, borderWidth: 1, borderColor: colors.gray }} />
    </Appbar.Header>

  );
};

export default LocationPickerAppHeader;
