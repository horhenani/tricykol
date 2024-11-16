import React from 'react';
import { Appbar } from 'react-native-paper';


const AppHeaderWithoutBack = () => {

  return (

    <Appbar.Header
      statusBarHeight={10}
      style={{backgroundColor: 'transparent'}}
    >
    </Appbar.Header>

  );
};

export default AppHeaderWithoutBack;
