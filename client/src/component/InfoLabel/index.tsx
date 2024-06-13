import React from 'react';
import {Text, View} from 'react-native';

import styles from './styles';

const InfoLabel = ({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{children}</Text>
    </View>
  );
};

export default InfoLabel;
