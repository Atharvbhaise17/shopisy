// import React from 'react';
// import ReactDOM from 'react-dom/client'; 
// import App from './App';
import {Provider} from "react-redux"
import Store from './store'
import {positions,transitions,Provider as AlertProvider} from "react-alert" 
import AlertTemplate from "react-alert-template-basic" 
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';


const options = {
  timeout  : 5000,
  position : positions.BOTTOM_CENTER,
  transition : transitions.SCALE,
}

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <Provider store= {Store}>
//   <AlertProvider template={AlertTemplate} {...options} >
//     <App />
//     </AlertProvider>
//   </Provider>,
// );


ReactDOM.render(
  <React.StrictMode>
  <Provider store= {Store}>
  <AlertProvider template={AlertTemplate} {...options} >
  
    <App />
    </AlertProvider>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);



