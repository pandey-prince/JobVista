import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Provider } from "react-redux";
import store from "./redux/store.js";
import { persistStore } from "redux-persist";
import { PersistGate } from "redux-persist/integration/react";
import ThemeProvider from "./components/shared/ThemeProvider.jsx";
import ThemedToaster from "./components/shared/ThemedToaster.jsx";

const persistor = persistStore(store);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <App />
          <ThemedToaster />
        </PersistGate>
      </Provider>
    </ThemeProvider>
  </React.StrictMode>,
);
