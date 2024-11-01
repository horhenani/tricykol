import React from 'react';
import { Appbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';


const AppHeader = () => {
  const navigation = useNavigation();

  return (

    <Appbar.Header
      statusBarHeight={10}
      style={{backgroundColor: 'transparent'}}
    >
      <Appbar.BackAction onPress={() => navigation.goBack()} />
    </Appbar.Header>

  );
};

export default AppHeader;
