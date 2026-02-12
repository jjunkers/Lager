import React from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();

    // Get current date in Danish format (e.g., "januar 2026")
    const currentDate = new Date();
    const options = { year: 'numeric', month: 'long' };
    const formattedDate = new Intl.DateTimeFormat('da-DK', options).format(currentDate);

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold mb-4">Lageropgørelse for {formattedDate}</h1>
            <p className="text-xl text-gray-600 mb-8">Velkommen, {user?.name || 'Gæst'}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Placeholder for summary cards or stats */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Status</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-2">Klar</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
