import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { signoutUser } from "../Store/Slices/user";

export const useLoginRedirect = ()=>{
    const userId = useSelector((state)=> state.user)
    const navigate = useNavigate()
    useEffect(()=>{
        if(!userId){navigate("/Dashboard")}
    },[])
}