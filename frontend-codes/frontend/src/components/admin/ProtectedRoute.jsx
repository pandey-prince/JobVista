import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const ProtectedRoute = ({children}) => {
    const {user} = useSelector(store=>store.auth);

    const navigate = useNavigate();

    useEffect(()=>{
        if(!user || user.role !== 'admin'){
            navigate("/admin/login");
        }
    },[user, navigate]);

    if (!user || user.role !== "admin") {
        return null;
    }

    return (
        <>
        {children}
        </>
    )
};
export default ProtectedRoute;
