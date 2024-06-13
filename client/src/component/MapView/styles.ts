import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  map: {
    flex: 1,
    alignSelf: 'stretch',
  },
  shipImage: {
    width: 25,
    height: 25,
  },
  loadingIndicator: {
    position: 'absolute',
    top: 50,
    right: 30,
  },
  locationMenuButton: {
    position: 'absolute',
    top: 35,
    left: 10,
  },
  locationMenuIcon: {
    width: 80,
    height: 80,
  },
});

export default styles;
