import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Users, Key, Edit2, Check, X, RefreshCw, Info, MessageCircle } from 'lucide-react';

const UserManagement = ({ embedded = false }) => {
    const { user: currentUser, users: allUsers, createUser, updateUser, deleteUser, fetchUsers } = useAuth();

    // Fetch users on mount
    useEffect(() => {
        if (currentUser?.role === 'admin') {
            fetchUsers();
        }
    }, []);

    // Filter users based on current user's role
    // Access check: Only admin can see this page
    if (currentUser?.role !== 'admin') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-md">
                    <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Adgang Nægtet</h2>
                    <p className="text-gray-600 dark:text-gray-400">Du har ikke rettigheder til at se denne side. Kontakt en administrator hvis du mener dette er en fejl.</p>
                </div>
            </div>
        );
    }

    const users = allUsers;
    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        role: 'user',
        password: '',
        phone_number: '',
        is_active: 1,
        requireChangePassword: false,
        whatsapp_sent: 0,
    });
    const [isEditing, setIsEditing] = useState(false);
    const [originalUsername, setOriginalUsername] = useState(null); // Key to identify user being edited
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [showForm, setShowForm] = useState(false); // Mobile toggle
    const [deleteConfirm, setDeleteConfirm] = useState(null); // Username of user to delete
    const [isDeleting, setIsDeleting] = useState(false); // Global delete loading state
    const [showRoleMatrix, setShowRoleMatrix] = useState(false); // Modal toggle

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setErrorMsg('');

        if (isEditing) {
            const success = await updateUser(originalUsername, formData);
            if (success) {
                setSuccessMsg(`Bruger ${formData.username} opdateret succesfuldt!`);
                resetForm();
                setTimeout(() => setSuccessMsg(''), 3000);
            } else {
                setErrorMsg('Kunne ikke opdatere bruger. Prøv igen.');
            }
        } else {
            // Create new
            if (allUsers.some(u => u.username === formData.username)) {
                setErrorMsg('Brugernavn findes allerede!');
                return;
            }
            const success = await createUser(formData);
            if (success) {
                setSuccessMsg(`Bruger ${formData.username} oprettet succesfuldt!`);
                resetForm();
                setTimeout(() => setSuccessMsg(''), 3000);
            } else {
                setErrorMsg('Kunne ikke oprette bruger. Prøv igen.');
            }
        }
    };

    const startEdit = (user) => {
        setFormData({
            full_name: user.full_name || user.name || '',
            username: user.username,
            role: user.role,
            phone_number: user.phone_number || '',
            is_active: user.is_active ?? 1,
            requireChangePassword: !!(user.require_change_password || user.requireChangePassword),
            password: '', // Don't show existing password
        });
        setOriginalUsername(user.username);
        setIsEditing(true);
        setShowForm(true); // Open form on mobile when editing
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const generatePassword = () => {
        const length = 8;
        const charset = {
            upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            lower: "abcdefghijklmnopqrstuvwxyz",
            number: "0123456789",
            symbol: "!@#$%^&*()_+~`|}{[]:;?><,./-="
        };

        // Ensure at least one from each category
        let password = "";
        password += charset.upper[Math.floor(Math.random() * charset.upper.length)];
        password += charset.lower[Math.floor(Math.random() * charset.lower.length)];
        password += charset.number[Math.floor(Math.random() * charset.number.length)];
        password += charset.symbol[Math.floor(Math.random() * charset.symbol.length)];

        // Fill the rest randomly
        const allChars = Object.values(charset).join("");
        for (let i = password.length; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }

        // Shuffle the result
        password = password.split('').sort(() => 0.5 - Math.random()).join('');

        setFormData({ ...formData, password, requireChangePassword: true });
    };

    const handleResetPassword = (user) => {
        const length = 8;
        const charset = {
            upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            lower: "abcdefghijklmnopqrstuvwxyz",
            number: "0123456789",
            symbol: "!@#$%^&*()_+~`|}{[]:;?><,./-="
        };

        let newPassword = "";
        newPassword += charset.upper[Math.floor(Math.random() * charset.upper.length)];
        newPassword += charset.lower[Math.floor(Math.random() * charset.lower.length)];
        newPassword += charset.number[Math.floor(Math.random() * charset.number.length)];
        newPassword += charset.symbol[Math.floor(Math.random() * charset.symbol.length)];

        const allChars = Object.values(charset).join("");
        for (let i = 4; i < length; i++) {
            newPassword += allChars[Math.floor(Math.random() * allChars.length)];
        }

        newPassword = newPassword.split('').sort(() => 0.5 - Math.random()).join('');

        setFormData({
            full_name: user.full_name || user.name || '',
            username: user.username,
            role: user.role,
            phone_number: user.phone_number || '',
            is_active: user.is_active,
            password: newPassword,
            requireChangePassword: true,
            whatsapp_sent: 0 // Reset sent status when new password is generated
        });
        setOriginalUsername(user.username);
        setIsEditing(true);
        setShowForm(true);
        setSuccessMsg(`Midlertidig kode genereret for ${user.username}. Husk at gemme!`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setFormData({ full_name: '', username: '', role: 'user', phone_number: '', is_active: 1, password: '', requireChangePassword: false, whatsapp_sent: 0 });
        setIsEditing(false);
        setOriginalUsername(null);
        setShowForm(false);
    };

    const handleDelete = async (username) => {
        setErrorMsg('');
        setIsDeleting(true);
        try {
            const success = await deleteUser(username);
            if (success) {
                setSuccessMsg(`Bruger ${username} er slettet.`);
                setTimeout(() => setSuccessMsg(''), 3000);
                fetchUsers(); // Refresh user list after deletion
            } else {
                setErrorMsg(`Kunne ikke slette bruger ${username}. Kontroller dine rettigheder eller prøv igen.`);
                setTimeout(() => setErrorMsg(''), 5000);
            }
        } catch (err) {
            setErrorMsg(`Fejl under sletning: ${err.message}`);
        } finally {
            setIsDeleting(false);
            setDeleteConfirm(null);
        }
    };

    const getWhatsAppUrl = () => {
        if (!formData.phone_number || !formData.password) return null;

        // Clean phone number: remove non-numeric
        let cleanPhone = formData.phone_number.replace(/\D/g, '');

        // Basic check for Spanish/Danish numbers without prefix
        if (cleanPhone.length === 8 && !cleanPhone.startsWith('45')) cleanPhone = '45' + cleanPhone;
        if (cleanPhone.length === 9 && !cleanPhone.startsWith('34')) cleanPhone = '34' + cleanPhone;

        const message = `Hej ${formData.full_name || formData.username}, her er dine loginoplysninger til Litteratur Lager:\n\nBrugernavn: ${formData.username}\nAdgangskode: ${formData.password}\n\nLogin her: https://lager.junkerne.dk`;

        return `https://wa.me/${cleanPhone}/?text=${encodeURIComponent(message)}`;
    };

    const RoleMatrixModal = () => {
        if (!showRoleMatrix) return null;

        const permissions = [
            { name: 'Se Lager', roles: { admin: true, superuser: true, user: true, viewer: true } },
            { name: 'Opdater Lager', roles: { admin: true, superuser: true, user: false, viewer: false } },
            { name: 'Se Rapporter', roles: { admin: true, superuser: true, user: true, viewer: false } },
            { name: 'Bestille Publikationer', roles: { admin: true, superuser: true, user: true, viewer: false } },
            { name: 'Se Alle Bestillinger', roles: { admin: true, superuser: false, user: false, viewer: false } },
            { name: 'Publikationskatalog (Ret/Slet)', roles: { admin: true, superuser: false, user: false, viewer: false } },
            { name: 'Brugerstyring', roles: { admin: true, superuser: false, user: false, viewer: false } },
            { name: 'Backup / System', roles: { admin: true, superuser: false, user: false, viewer: false } },
        ];

        const roles = [
            { id: 'admin', name: 'Admin' },
            { id: 'superuser', name: 'Superbruger' },
            { id: 'user', name: 'Almindelig' },
            { id: 'viewer', name: 'Læser' },
        ];

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowRoleMatrix(false)}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20">
                        <div className="flex items-center">
                            <Info className="h-6 w-6 text-blue-600 mr-3" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Rettighedsoversigt</h3>
                        </div>
                        <button onClick={() => setShowRoleMatrix(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="p-6 overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-3 text-left font-bold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">Funktion</th>
                                    {roles.map(r => (
                                        <th key={r.id} className="p-3 text-center font-bold text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700 whitespace-nowrap">
                                            {r.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                {permissions.map(p => (
                                    <tr key={p.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="p-3 font-semibold text-gray-700 dark:text-gray-300">{p.name}</td>
                                        {roles.map(r => (
                                            <td key={r.id} className="p-3 text-center">
                                                {p.roles[r.id] ? (
                                                    <div className="flex justify-center">
                                                        <Check className="h-5 w-5 text-green-500 bg-green-50 dark:bg-green-900/20 rounded-full p-0.5" />
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-center">
                                                        <X className="h-5 w-5 text-red-400 opacity-30" />
                                                    </div>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 text-center">
                        <button
                            onClick={() => setShowRoleMatrix(false)}
                            className="px-6 py-2.5 bg-gray-800 dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600 text-white font-bold rounded-xl transition-all shadow-md"
                        >
                            Forstået
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={embedded ? '' : 'p-4 md:p-8 max-w-6xl mx-auto dark:bg-gray-900 transition-colors duration-200'}>
            <RoleMatrixModal />
            {!embedded && (
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center">
                        <Users className="mr-3 h-7 w-7 md:h-8 md:w-8 text-blue-600" />
                        <span className="hidden xs:inline">Brugerstyring</span>
                        <span className="xs:hidden">Brugere</span>
                    </h1>

                    {/* Mobile Add User Button */}
                    <button
                        onClick={() => {
                            if (showForm) resetForm();
                            else setShowForm(true);
                        }}
                        className="md:hidden flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
                    >
                        {showForm ? (
                            <><X className="mr-2 h-4 w-4" /> Luk</>
                        ) : (
                            <><UserPlus className="mr-2 h-4 w-4" /> Tilføj</>
                        )}
                    </button>
                </div>
            )}
            {embedded && (
                <div className="flex justify-end p-4 pb-0">
                    <button
                        onClick={() => {
                            if (showForm) resetForm();
                            else setShowForm(true);
                        }}
                        className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
                    >
                        {showForm ? (
                            <><X className="mr-2 h-4 w-4" /> Luk</>
                        ) : (
                            <><UserPlus className="mr-2 h-4 w-4" /> Tilføj Bruger</>
                        )}
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User Form - Hidden on mobile unless showForm is true */}
                <div className={`${showForm ? 'block' : 'hidden md:block'} lg:col-span-1`}>
                    <div className="bg-gray-50/50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700 sticky top-6">
                        <h2 className="text-xl font-bold mb-6 flex items-center text-gray-800 dark:text-gray-100">
                            {isEditing ? (
                                <>
                                    <Edit2 className="mr-2 h-5 w-5 text-blue-500" /> Rediger
                                </>
                            ) : (
                                <>
                                    <UserPlus className="mr-2 h-5 w-5 text-blue-500" /> Opret Ny
                                </>
                            )}
                        </h2>

                        {successMsg && (
                            <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-3 rounded-lg mb-4 text-sm animate-fade-in">
                                {successMsg}
                            </div>
                        )}

                        {errorMsg && (
                            <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-lg mb-4 text-sm animate-fade-in">
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Fulde Navn</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="F.eks. Brian Jensen"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Telefonnummer</label>
                                <input
                                    type="tel"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="+45 12 34 56 78"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Brugernavn</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800"
                                    placeholder="brian"
                                    required
                                    disabled={isEditing}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Rolle</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="user">Almindelig Bruger</option>
                                    <option value="viewer">Læse-bruger</option>
                                    {currentUser?.role === 'admin' && (
                                        <>
                                            <option value="superuser">Superbruger</option>
                                            <option value="admin">Administrator</option>
                                        </>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    {isEditing ? 'Ny Kode (Valgfri)' : 'Midlertidig Kode'}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-2.5 pr-24 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder={isEditing ? "Lad stå tom for at beholde" : "Brug knappen til højre ->"}
                                        required={!isEditing}
                                    />
                                    <button
                                        type="button"
                                        onClick={generatePassword}
                                        className="absolute right-2 top-1.5 bottom-1.5 px-3 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded text-xs font-bold flex items-center space-x-1 transition-colors"
                                        title="Generer kode"
                                    >
                                        <RefreshCw className="h-3 w-3" />
                                        <span>Generer</span>
                                    </button>
                                </div>
                                {formData.password && formData.phone_number && (
                                    <a
                                        href={getWhatsAppUrl()}
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, whatsapp_sent: 1 }));
                                            if (isEditing) {
                                                updateUser(originalUsername, { whatsapp_sent: 1 });
                                            }
                                        }}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 flex items-center justify-center space-x-2 w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm animate-fade-in"
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                        <span>Send login via WhatsApp</span>
                                    </a>
                                )}
                            </div>

                            {isEditing && (
                                <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active === 1}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Brugeren er aktiv
                                    </label>
                                </div>
                            )}

                            <div className="flex space-x-3 pt-4">
                                {(isEditing || showForm) && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-bold transition-colors"
                                    >
                                        Annuller
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-sm"
                                >
                                    {isEditing ? 'Gem' : 'Opret'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* User List - Hidden on mobile if form is open */}
                <div className={`${showForm ? 'hidden md:block' : 'block'} lg:col-span-2`}>
                    <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <div className="flex items-center space-x-3">
                                <h2 className="font-bold text-gray-800 dark:text-white">Brugere i Systemet</h2>
                                <button
                                    onClick={() => setShowRoleMatrix(true)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center text-xs font-bold"
                                    title="Se rettigheder"
                                >
                                    <Info className="h-4 w-4 mr-1" />
                                    <span>Rettigheder</span>
                                </button>
                            </div>
                            <span className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">{users.length} i alt</span>
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4 pl-6">Bruger</th>
                                        <th className="p-4">Kontakt</th>
                                        <th className="p-4">Rolle</th>
                                        <th className="p-4 text-center">Status</th>
                                        <th className="p-4 text-right pr-6">Handling</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                    {users.map((u) => (
                                        <tr key={u.username} className={`transition-all ${isEditing && originalUsername === u.username ? 'bg-blue-50/50 dark:bg-blue-900/10' : u.is_active === 0 ? 'bg-gray-100/50 dark:bg-gray-800/20 opacity-60' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center space-x-2">
                                                    <div className="font-bold text-gray-900 dark:text-gray-100">{u.full_name}</div>
                                                    {u.whatsapp_sent === 1 && (
                                                        <MessageCircle className="h-3.5 w-3.5 text-green-500" title="Login sendt via WhatsApp" />
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">@{u.username}</div>
                                            </td>
                                            <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">{u.phone_number || '-'}</td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                          ${u.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                                                        u.role === 'superuser' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                            u.role === 'viewer' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'}`}>
                                                    {u.role === 'user' ? 'Almindelig' : u.role === 'viewer' ? 'Læser' : u.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {u.is_active === 0 ? (
                                                    <span className="inline-flex items-center text-red-600 dark:text-red-400 text-[10px] font-bold uppercase bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                                                        Deaktiveret
                                                    </span>
                                                ) : u.requireChangePassword ? (
                                                    <span className="inline-flex items-center text-orange-600 dark:text-orange-400 text-[10px] font-bold uppercase bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded" title="Kode skal skiftes ved næste login">
                                                        <Key className="w-3 h-3 mr-1" /> Skift Kode
                                                    </span>
                                                ) : (
                                                    <span className="text-green-600 dark:text-green-400 text-[10px] font-bold uppercase flex items-center justify-center">
                                                        <Check className="w-3 h-3 mr-1" /> Aktiv
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right pr-6 flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleResetPassword(u)}
                                                    className="text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300 p-2 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-all"
                                                    title="Nulstil adgangskode"
                                                >
                                                    <RefreshCw className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => startEdit(u)}
                                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                {u.username !== 'admin' && (currentUser?.role === 'admin' || u.role === 'user') && (
                                                    <button
                                                        onClick={() => setDeleteConfirm(u.username)}
                                                        disabled={isDeleting}
                                                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all disabled:opacity-50"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card Layout */}
                        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
                            {users.map((u) => (
                                <div key={u.username} className={`p-4 flex flex-col space-y-3 ${isEditing && originalUsername === u.username ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <div className="font-bold text-gray-900 dark:text-white">{u.full_name}</div>
                                                {u.whatsapp_sent === 1 && (
                                                    <MessageCircle className="h-3 w-3 text-green-500" />
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">@{u.username}</div>
                                        </div>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                      ${u.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                                                u.role === 'superuser' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    u.role === 'viewer' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'}`}>
                                            {u.role === 'user' ? 'Almindelig' : u.role === 'viewer' ? 'Læser' : u.role}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center pt-1">
                                        <div className="flex flex-col">
                                            <div className="flex items-center">
                                                {u.is_active === 0 ? (
                                                    <span className="text-red-500 text-[10px] font-bold uppercase">Deaktiveret</span>
                                                ) : u.requireChangePassword ? (
                                                    <span className="text-orange-600 text-[10px] font-bold uppercase flex items-center">
                                                        <Key className="w-3 h-3 mr-1" /> Skift kode
                                                    </span>
                                                ) : (
                                                    <span className="text-green-600 text-[10px] font-bold uppercase flex items-center">
                                                        <Check className="w-3 h-3 mr-1" /> Aktiv
                                                    </span>
                                                )}
                                            </div>
                                            {u.phone_number && (
                                                <div className="text-[10px] text-gray-500 mt-0.5">{u.phone_number}</div>
                                            )}
                                        </div>

                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleResetPassword(u)}
                                                className="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                            >
                                                Nulstil
                                            </button>
                                            <button
                                                onClick={() => startEdit(u)}
                                                className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                            >
                                                Rediger
                                            </button>
                                            {u.username !== 'admin' && (currentUser?.role === 'admin' || u.role === 'user') && (
                                                <button
                                                    onClick={() => setDeleteConfirm(u.username)}
                                                    disabled={isDeleting}
                                                    className="bg-red-50 dark:bg-red-900/20 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                                >
                                                    Slet
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div >
            </div >

            {/* Custom Delete Confirmation Modal */}
            {
                deleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-700 animate-scale-in">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mx-auto mb-4">
                                <X className="w-6 h-6" />
                            </div>
                            <h3 className="text-center text-lg font-bold text-gray-900 dark:text-white mb-2">Bekræft Sletning</h3>
                            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                                Er du sikker på, at du vil slette brugeren <span className="font-bold text-gray-900 dark:text-white">@{deleteConfirm}</span>? Denne handling kan ikke fortrydes.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                                >
                                    Annuller
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 disabled:opacity-50 flex items-center justify-center"
                                >
                                    {isDeleting ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'Slet Bruger'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default UserManagement;
