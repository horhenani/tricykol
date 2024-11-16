import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts } from '@constants/globalStyles';

const ResendLink = ({ onResend, cooldownTime = 30 }) => {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prevCount) => prevCount - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = () => {
    if (countdown === 0) {
      onResend();
      setCountdown(cooldownTime);
    }
  };

  return (
    <TouchableOpacity onPress={handleResend} disabled={countdown > 0}>
      <Text style={styles.resendText}>
        {countdown > 0 
          ? `Resend code in ${countdown}s` 
          : "Resend code"}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  resendText: {
    color: colors.primary,
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginTop: 10,
    textDecorationLine: 'underline',
  },
});

export default ResendLink;
