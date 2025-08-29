
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router";
import '@ant-design/v5-patch-for-react-19';
import { Provider } from 'react-redux';
import './index.css'
import App from './App.jsx'
import { store , persistor} from './Store/store.js';
import { PersistGate } from 'redux-persist/integration/react';

createRoot(document.getElementById('root')).render(
 <BrowserRouter>
 <Provider store={store}>
   <PersistGate persistor = {persistor}>
    <App/> 
   </PersistGate>
 </Provider>
 </BrowserRouter>

)
