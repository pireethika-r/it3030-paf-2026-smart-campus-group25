import { Routes, Route, Navigate } from 'react-router-dom';
import ResourceListPage from '../pages/resources/ResourceListPage';

const AppRoutes = () => {
    return (
        <Routes>
            {/* Redirect the home path to resources for now */}
            <Route path="/" element={<Navigate to="/resources" />} />

            {/* Our main Resource Catalogue page */}
            <Route path="/resources" element={<ResourceListPage />} />

            {/* We can add /bookings or /dashboard later! */}
        </Routes>
    );
};

export default AppRoutes;