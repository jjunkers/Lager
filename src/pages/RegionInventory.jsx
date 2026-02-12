import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import ItemModal from '../components/inventory/ItemModal';

const RegionInventory = () => {
    const { region } = useParams();
    const { user } = useAuth();
    const regionKey = `inventory_${region}`; // Key for localStorage

    const [items, setItems] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);

    // Load from localStorage on mount or region change
    useEffect(() => {
        const saved = localStorage.getItem(regionKey);
        if (saved) {
            setItems(JSON.parse(saved));
        } else {
            // Default initial data if empty
            setItems([
                { id: 1, name: 'Vare A', quantity: 10, location: 'Hylde 1' },
            ]);
        }
    }, [regionKey]);

    // Save to localStorage whenever items change
    useEffect(() => {
        localStorage.setItem(regionKey, JSON.stringify(items));
    }, [items, regionKey]);

    const handleSave = (itemData) => {
        if (currentItem) {
            // Edit mode
            setItems(items.map(i => i.id === currentItem.id ? { ...itemData, id: currentItem.id } : i));
        } else {
            // Add mode
            const newItem = { ...itemData, id: Date.now() };
            setItems([...items, newItem]);
        }
        setCurrentItem(null);
    };

    const handleDelete = (id) => {
        if (window.confirm('Er du sikker på at du vil slette denne vare?')) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    const openAddModal = () => {
        setCurrentItem(null);
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setCurrentItem(item);
        setIsModalOpen(true);
    };

    const canEdit = user?.role === 'admin' || user?.role === 'superuser';
    const canDelete = user?.role === 'admin';

    const regionName = region ? region.charAt(0).toUpperCase() + region.slice(1) : '';

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">{regionName} Lager</h1>
                {canEdit && (
                    <button
                        onClick={openAddModal}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Tilføj Vare</span>
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {items.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Ingen varer fundet i {regionName} lager.
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="p-4 font-semibold text-gray-600">Varenavn</th>
                                <th className="p-4 font-semibold text-gray-600">Antal</th>
                                <th className="p-4 font-semibold text-gray-600">Lokation</th>
                                {(canEdit || canDelete) && <th className="p-4 font-semibold text-gray-600 text-right">Handling</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-medium text-gray-800">{item.name}</td>
                                    <td className="p-4 text-gray-600">{item.quantity}</td>
                                    <td className="p-4 text-gray-600">{item.location}</td>
                                    {(canEdit || canDelete) && (
                                        <td className="p-4 text-right flex justify-end space-x-2">
                                            {canEdit && (
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Rediger"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                            )}
                                            {canDelete && (
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Slet"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <ItemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={currentItem}
            />
        </div>
    );
};

export default RegionInventory;
