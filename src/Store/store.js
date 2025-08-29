import { combineReducers , configureStore} from "@reduxjs/toolkit";
import { userReducer } from "./Slices/user";
import { deptReducer } from "./Slices/department";
import { persistReducer,persistStore , FLUSH,REHYDRATE,PAUSE,PERSIST,PURGE,REGISTER,} from "redux-persist";
import storage from 'redux-persist/lib/storage';
import { employeeReducer } from "./Slices/employee";
import { currentUserReducer } from "./Slices/currentUser";

const rootReducer = combineReducers({
    user : userReducer,
    dept : deptReducer,
    emp  : employeeReducer,
    cUser: currentUserReducer
})

const persistConfigure = {
    key :"root",
    storage
}

const persistedReducer = persistReducer(persistConfigure,rootReducer)



export const store = configureStore({
    reducer : persistedReducer,
    middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})


export const persistor = persistStore(store)

