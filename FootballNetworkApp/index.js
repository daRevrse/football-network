// ====== index.js ======
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Configuration des polyfills si nécessaire
import 'react-native-gesture-handler';

AppRegistry.registerComponent(appName, () => App);
