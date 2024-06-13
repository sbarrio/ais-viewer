import {AppRegistry} from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import App from './App';
import {name as appName} from './app.json';

// Needed for Android builds
MapLibreGL.setAccessToken(null);

AppRegistry.registerComponent(appName, () => App);
