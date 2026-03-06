import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, GripVertical, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const Catalog = () => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editingItem, setEditingItem] = useState(null); // Item being edited
    const [isAdding, setIsAdding] = useState(false); // Mode: Adding new item

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        name_da: '',
        name_no: '',
        name_sv: '',
        section: '',
        description: '',
        sort_order: 0,
        min_stock: 0,
        max_stock: 0
    });

    // Fetch Items
    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/catalog?role=${user?.role}`);
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (error) {
            console.error("Failed to load catalog", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchItems();
    }, []);

    // Filter Items
    const filteredItems = items.filter(item =>
        item.code.toLowerCase().includes(search.toLowerCase()) ||
        (item.name_da && item.name_da.toLowerCase().includes(search.toLowerCase())) ||
        (item.section && item.section.toLowerCase().includes(search.toLowerCase()))
    );

    // Edit Handler
    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({ ...item });
        setIsAdding(false);
    };

    // Add Handler
    const handleAdd = () => {
        setEditingItem(null);
        setFormData({
            code: '',
            name_da: '',
            name_no: '',
            name_sv: '',
            section: '',
            description: '',
            sort_order: items.length, // Default to end
            min_stock: 0,
            max_stock: 0
        });
        setIsAdding(true);
    };

    // Save Handler
    const handleSave = async () => {
        const url = isAdding ? '/api/catalog' : '/api/catalog/update';
        // For update, we need ID. For add, we don't.
        const body = isAdding ? formData : { ...formData, id: editingItem.id };

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...body, currentUserRole: user?.role })
            });

            if (res.ok) {
                await fetchItems();
                setIsAdding(false);
                setEditingItem(null);
            } else {
                alert("Fejl ved gemning. Tjek om publikationsnummeret er unikt.");
            }
        } catch (error) {
            console.error("Save failed", error);
        }
    };

    // Delete Handler
    const handleDelete = async (id) => {
        if (!window.confirm("Er du sikker på, at du vil slette denne publikation?")) return;

        try {
            await fetch('/api/catalog/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, currentUserRole: user?.role })
            });
            await fetchItems();
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    // Handle Drag End
    const onDragEnd = async (result) => {
        if (!result.destination || search) return; // Disable reordering if searching

        const reorderedItems = Array.from(items);
        const [removed] = reorderedItems.splice(result.source.index, 1);
        reorderedItems.splice(result.destination.index, 0, removed);

        // Update sort_order locally
        const updatedItems = reorderedItems.map((item, idx) => ({
            ...item,
            sort_order: idx
        }));

        setItems(updatedItems);

        // Save new order to database
        try {
            await fetch('/api/catalog/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: updatedItems.map(i => ({ id: i.id, sort_order: i.sort_order })),
                    currentUserRole: user?.role
                })
            });
        } catch (error) {
            console.error("Reorder failed", error);
        }
    };

    // Inline Description Update
    const handleUpdateDescription = async (id, newDescription) => {
        // Optimistic Update
        const newItems = items.map(item => {
            if (item.id === id) {
                return { ...item, description: newDescription };
            }
            return item;
        });
        setItems(newItems);

        // API Call
        const itemToUpdate = newItems.find(i => i.id === id);
        try {
            await fetch('/api/catalog/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...itemToUpdate, currentUserRole: user?.role })
            });
        } catch (error) {
            console.error("Failed to update description", error);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto transition-colors duration-200">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Publikationskatalog</h1>
                {user?.role === 'admin' && (
                    <button
                        onClick={handleAdd}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Ny Publikation</span>
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                <input
                    type="text"
                    placeholder="Søg på publikationsnummer, navn eller sektion..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Editor Modal/Overlay */}
            {(isAdding || editingItem) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isAdding ? 'Tilføj Publikation' : 'Rediger Publikation'}</h2>
                            <button onClick={() => { setIsAdding(false); setEditingItem(null); }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-4 text-gray-900 dark:text-gray-100">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kode (Unik)</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sektion</label>
                                <input
                                    type="text"
                                    value={formData.section}
                                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                    className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Beskrivelse (Søgeord)</label>
                                <textarea
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md h-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Indtast søgeord her..."
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Navn (DK)</label>
                                    <input
                                        type="text"
                                        value={formData.name_da}
                                        onChange={(e) => setFormData({ ...formData, name_da: e.target.value })}
                                        className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Navn (NO)</label>
                                    <input
                                        type="text"
                                        value={formData.name_no}
                                        onChange={(e) => setFormData({ ...formData, name_no: e.target.value })}
                                        className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Navn (SV)</label>
                                    <input
                                        type="text"
                                        value={formData.name_sv}
                                        onChange={(e) => setFormData({ ...formData, name_sv: e.target.value })}
                                        className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Min. Beholdning</label>
                                    <input
                                        type="number"
                                        value={formData.min_stock}
                                        onChange={(e) => setFormData({ ...formData, min_stock: parseInt(e.target.value) || 0 })}
                                        className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="f.eks. 10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max. Beholdning</label>
                                    <input
                                        type="number"
                                        value={formData.max_stock}
                                        onChange={(e) => setFormData({ ...formData, max_stock: parseInt(e.target.value) || 0 })}
                                        className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="f.eks. 50"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => { setIsAdding(false); setEditingItem(null); }}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                            >
                                Annuller
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Gem
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200 overflow-x-auto">
                <DragDropContext onDragEnd={onDragEnd}>
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="p-4 w-10"></th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-400">Kode</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-400">Sektion</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-400">Beskrivelse (Søgeord)</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-center">Min.</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-center">Max.</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-right">Handlinger</th>
                            </tr>
                        </thead>
                        <Droppable droppableId="catalog-items" isDropDisabled={!!search}>
                            {(provided) => (
                                <tbody
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="divide-y divide-gray-50 dark:divide-gray-700"
                                >
                                    {filteredItems.map((item, index) => (
                                        <Draggable
                                            key={item.id}
                                            draggableId={String(item.id)}
                                            index={index}
                                            isDragDisabled={user?.role !== 'admin' || !!search}
                                        >
                                            {(provided, snapshot) => (
                                                <tr
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={`${snapshot.isDragging ? 'bg-blue-50 dark:bg-blue-900/40 shadow-lg ring-1 ring-blue-200 dark:ring-blue-800' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'} text-gray-900 dark:text-gray-100 transition-shadow`}
                                                >
                                                    <td className="p-4 text-gray-400 dark:text-gray-500">
                                                        {user?.role === 'admin' && !search && (
                                                            <div
                                                                {...provided.dragHandleProps}
                                                                className="cursor-grab active:cursor-grabbing hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2"
                                                            >
                                                                <GripVertical className="h-5 w-5" />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-4 font-mono text-sm">{item.code}</td>
                                                    <td className="p-4 text-sm">{item.section}</td>
                                                    <td className="p-4">
                                                        <input
                                                            type="text"
                                                            value={item.description || ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setItems(prevItems => prevItems.map(i => i.id === item.id ? { ...i, description: val } : i));
                                                            }}
                                                            onBlur={(e) => handleUpdateDescription(item.id, e.target.value)}
                                                            placeholder="Søgeord..."
                                                            disabled={user?.role === 'user' || user?.role === 'viewer'}
                                                            className="w-full p-1 border-b border-transparent hover:border-gray-300 dark:hover:border-gray-500 focus:border-blue-500 outline-none bg-transparent text-sm text-gray-600 dark:text-gray-300 placeholder-gray-300 dark:placeholder-gray-600 disabled:opacity-50 cursor-not-allowed"
                                                        />
                                                    </td>
                                                    <td className="p-4 text-center text-sm font-medium text-gray-600 dark:text-gray-400">{item.min_stock || '-'}</td>
                                                    <td className="p-4 text-center text-sm font-medium text-gray-600 dark:text-gray-400">{item.max_stock || '-'}</td>
                                                    <td className="p-4 text-right space-x-2">
                                                        {user?.role === 'admin' && (
                                                            <>
                                                                <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full">
                                                                    <Edit2 className="h-4 w-4" />
                                                                </button>
                                                                <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </tbody>
                            )}
                        </Droppable>
                    </table>
                </DragDropContext>
            </div>
        </div>
    );
};

export default Catalog;
