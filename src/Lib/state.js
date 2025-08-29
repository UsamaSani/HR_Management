
import { useLocation } from "react-router";
 export const useCurrentUser = ()=>{
     const { state } = useLocation();
    return  state
}