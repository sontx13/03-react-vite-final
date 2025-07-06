import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/redux/hooks";
import NotPermitted from "./not-permitted";
import Loading from "../loading";

const RoleBaseRoute = (props: any) => {
    const user = useAppSelector(state => state.account.user);
    const userRole = user?.role?.name;

    if (userRole !== 'NORMAL_USER') {
        return <>{props.children}</>;
    } else {
        return <NotPermitted />;
    }
};

const ProtectedRoute = (props: any) => {
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const isLoading = useAppSelector(state => state.account.isLoading);
    const location = useLocation(); // ✅ Lấy location đúng cách

    const currentPath = location.pathname + location.search;

    if (isLoading) {
        return <Loading />;
    }

    if (!isAuthenticated) {
        return <Navigate to={`/login?redirect=${encodeURIComponent(currentPath)}`} replace />;
    }

    return <RoleBaseRoute>{props.children}</RoleBaseRoute>;
};

export default ProtectedRoute;
