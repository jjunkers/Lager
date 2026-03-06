import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStats } from '../context/StatsContext';
import { Settings, Trash2, AlertTriangle, CheckCircle2, Loader2, Download, Upload, Database, FileSpreadsheet, FileJson, Clock, Package, User, Bell, RefreshCw, Users } from 'lucide-react';
import UserManagement from './UserManagement';

const Admin = () => {
    const { user } = useAuth();
    const { refreshStats } = useStats(); // Tilføj stats-refresh
    const [resetting, setResetting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [message, setMessage] = useState(null);
    const [history, setHistory] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [isLoadingNotifs, setIsLoadingNotifs] = useState(true);

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const res = await fetch(`/api/admin/history?role=${user?.role}`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (e) {
            console.error("Failed to fetch history", e);
        }
        setIsLoadingHistory(false);
    };

    const fetchNotifications = async () => {
        setIsLoadingNotifs(true);
        try {
            const res = await fetch(`/api/admin/notifications?role=${user?.role}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (e) {
            console.error("Failed to fetch notifications", e);
        }
        setIsLoadingNotifs(false);
    };

    const markAllAsRead = async () => {
        try {
            const res = await fetch('/api/admin/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAllAsRead: true, currentUserRole: user?.role })
            });
            if (res.ok) {
                fetchNotifications();
                refreshStats();
            }
        } catch (e) {
            console.error("Failed to mark all as read", e);
        }
    };

    useEffect(() => {
        fetchHistory();
        fetchNotifications();
    }, [user]);

    const handleReset = async () => {
        setResetting(true);
        try {
            const res = await fetch('/api/admin/reset-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentUserRole: user?.role })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Data er blevet nulstillet!' });
                setShowConfirm(false);
                fetchHistory();
                fetchNotifications();
                refreshStats();
            } else {
                setMessage({ type: 'error', text: 'Der opstod en fejl ved nulstilling.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Netværksfejl under nulstilling.' });
        }
        setResetting(false);
    };

    const handleExport = () => {
        const a = document.createElement('a');
        a.href = `/api/admin/export?role=${user?.role}`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setMessage({ type: 'success', text: 'CSV eksport startet.' });
    };

    const handleBackup = () => {
        const a = document.createElement('a');
        a.href = `/api/admin/backup?role=${user?.role}`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setMessage({ type: 'success', text: 'JSON backup startet.' });
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('currentUserRole', user?.role || '');

        setResetting(true);
        try {
            const res = await fetch('/api/admin/import', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: data.message || 'Lager opdateret fra CSV.' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Fejl ved indlæsning af CSV.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Netværksfejl under import.' });
        }
        setResetting(false);
        e.target.value = ''; // Reset input
    };

    const handleRestore = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Basic client-side validation
        if (!file.name.endsWith('.json')) {
            setMessage({ type: 'error', text: 'Ugyldig filtype. Du skal vælge en .json backup-fil.' });
            e.target.value = '';
            return;
        }

        if (!window.confirm('ADVARSEL: Dette vil overskrive HELE din database med data fra backup-filen. Er du sikker?')) {
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            setResetting(true);
            try {
                // Ensure we can parse it as JSON before sending
                let parsedData;
                try {
                    parsedData = JSON.parse(event.target.result);
                } catch (jsonErr) {
                    throw new Error('Filen er ikke gyldig JSON.');
                }

                const res = await fetch(`/api/admin/restore?currentUserRole=${user?.role}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(parsedData)
                });

                const data = await res.json();
                if (res.ok) {
                    setMessage({ type: 'success', text: 'Systemet er gendannet succesfuldt!' });
                } else {
                    setMessage({ type: 'error', text: data.error || 'Fejl ved gendannelse.' });
                }
            } catch (error) {
                setMessage({ type: 'error', text: error.message || 'Netværksfejl under gendannelse.' });
            }
            setResetting(false);
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleRestoreItem = async (item) => {
        if (!window.confirm(`Vil du gendanne denne slettede bestilling: ${item.name}? den vil blive flyttet tilbage til listen over bestillinger.`)) return;

        setProcessingId(item.id);
        try {
            const res = await fetch('/api/admin/history/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: item.id, currentUserRole: user?.role })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Bestilling gendannet!' });
                fetchHistory();
                refreshStats();
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Fejl ved gendannelse.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Netværksfejl under gendannelse.' });
        }
        setProcessingId(null);
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center">
                    <Settings className="mr-3 h-8 w-8 text-purple-600" />
                    Administration
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400 font-medium">
                    Systemindstillinger og vedligeholdelse.
                </p>
            </div>

            <div className="space-y-6">
                {/* User Management Section — always visible */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mb-6">
                    <div className="p-6 border-b border-gray-50 dark:border-gray-700/50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                            <Users className="mr-2 h-5 w-5 text-blue-600" />
                            Brugerstyring
                        </h2>
                    </div>
                    <div className="p-0">
                        <UserManagement embedded={true} />
                    </div>
                </div>

                {/* Backlog / Status Section — hidden on mobile */}
                <div className="hidden md:block bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mb-6">
                    <div className="p-6 border-b border-gray-50 dark:border-gray-700/50 flex justify-between items-center">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center">
                            <CheckCircle2 className="mr-2 h-5 w-5 text-blue-600" />
                            Funktioner & Overvågning
                        </h2>
                    </div>
                    <div className="p-6 space-y-4">
                        {[
                            {
                                title: 'Passkey Login (WebAuthn)',
                                desc: 'Log ind med FaceID/TouchID uden password. (Afventer godkendelse)',
                                done: false
                            },
                            {
                                title: 'Notifikationsbadges',
                                desc: 'Vis antallet af mangler/bestillinger direkte på menu-knapperne.',
                                done: true
                            },
                            {
                                title: 'Bestillingshistorik (Admin)',
                                desc: 'Log over hvem der har bestilt hvad og hvornår, samt muligheden for at gendanne slettede ting.',
                                done: true
                            },
                            {
                                title: 'Mobil-notifikationer',
                                desc: 'Bliv orienteret direkte hvis lageret er kritisk lavt (eller hvis en ny bestilling lander).',
                                done: true
                            },
                            {
                                title: 'Backup, Eksport & Import',
                                desc: 'Mulighed for at trække data ud til Excel (og indlæse igen), samt en fuld system-backup der kan genetablere hele siden ved vedbrud.',
                                done: true
                            },
                            {
                                title: 'Design & Brugeroplevelse — Mobil UX/UI Redesign',
                                desc: 'Moderne redesign af mobilversionen. Runde ikoner/knapper i bunden, central Globus-knap til landelager, navigationsknapper til Rapporter/Bestillinger/Admin, brugerstyring i Admin og SPA-struktur.',
                                done: true
                            }
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-start space-x-4 group">
                                <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded border ${item.done ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600'} flex items-center justify-center transition-all`}>
                                    {item.done && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`text-sm font-bold ${item.done ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>{item.title}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Reset Section — hidden on mobile */}
                <div className="hidden md:block bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 dark:border-gray-700/50">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                            <Trash2 className="mr-2 h-5 w-5 text-red-500" />
                            Nulstil Test-data
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Dette vil slette alle lagerbeholdninger, historik og bestillinger. Kataloget med publikationer bliver liggende.
                        </p>
                    </div>

                    <div className="p-6 bg-red-50/30 dark:bg-red-900/10">
                        {message && (
                            <div className={`mb-6 p-4 rounded-2xl flex items-center ${message.type === 'success'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                                }`}>
                                {message.type === 'success' ? <CheckCircle2 className="mr-2 h-5 w-5" /> : <AlertTriangle className="mr-2 h-5 w-5" />}
                                <span className="font-bold">{message.text}</span>
                            </div>
                        )}

                        {!showConfirm ? (
                            <button
                                onClick={() => setShowConfirm(true)}
                                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black shadow-md transition-all active:scale-95 flex items-center"
                            >
                                <Trash2 className="mr-2 h-5 w-5" />
                                Nulstil alt nu
                            </button>
                        ) : (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border-2 border-red-500 shadow-xl mb-4 text-center">
                                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Er du helt sikker?</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6 font-medium">
                                        Denne handling kan ikke fortrydes. Alt lagerdata bliver nulstillet til 0.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        <button
                                            disabled={resetting}
                                            onClick={handleReset}
                                            className="px-8 py-3 bg-red-600 text-white rounded-xl font-black flex items-center justify-center hover:bg-red-700 transition-all disabled:opacity-50"
                                        >
                                            {resetting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : null}
                                            Ja, nulstil det hele!
                                        </button>
                                        <button
                                            onClick={() => setShowConfirm(false)}
                                            className="px-8 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                                        >
                                            Annuller
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Data Management Section — hidden on mobile */}
                <div className="hidden md:block bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 dark:border-gray-700/50 bg-blue-50/10">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                            <Database className="mr-2 h-5 w-5 text-blue-500" />
                            Sikkerhedskopiering & Eksport
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                            Beskyt dine data ved at gemme en kopi. JSON-filer gemmes i 'Overførsler', SQL-filer gemmes i projektets '/backups' mappe.
                        </p>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Primary Backup Action */}
                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 p-6 rounded-2xl border border-purple-100 dark:border-purple-800">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                                    <FileJson className="h-10 w-10 text-purple-600" />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Fuld System Backup (JSON)</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
                                        Genererer en `.json` fil som downloades til din **Overførsler-mappe**.
                                        Dette er den fil, du skal bruge til "Gendan" knappen herunder.
                                    </p>
                                </div>
                                <button
                                    onClick={handleBackup}
                                    className="w-full md:w-auto px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black shadow-lg shadow-purple-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Download className="h-5 w-5" />
                                    Download JSON Backup
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            {/* Excel Management */}
                            <div className="space-y-4 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center text-xs uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel (CSV) Eksport
                                </h3>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleExport}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-700/30 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all border border-gray-200 dark:border-gray-600"
                                    >
                                        <Download className="h-4 w-4" />
                                        Eksporter Lager (Excel)
                                    </button>
                                    <label className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all border border-gray-200 dark:border-gray-600 cursor-pointer">
                                        <Upload className="h-4 w-4" />
                                        Indlæs fra CSV
                                        <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
                                    </label>
                                </div>
                            </div>

                            {/* Gendan Section */}
                            <div className="space-y-4 p-5 rounded-2xl border border-orange-100 dark:border-orange-900/30 bg-orange-50/10">
                                <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center text-xs uppercase tracking-widest text-orange-600 dark:text-orange-400">
                                    <Database className="mr-2 h-4 w-4" /> Gendan fra JSON
                                </h3>
                                <div className="flex flex-col gap-3">
                                    <p className="text-[10px] text-orange-600 dark:text-orange-400 font-bold leading-tight px-1 italic">
                                        Brug kun JSON-filen fra din 'Overførsler' mappe. SQL-filer i /backups kan IKKE indlæses her.
                                    </p>
                                    <label className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-md cursor-pointer">
                                        <Upload className="h-4 w-4" />
                                        Vælg JSON & Gendan
                                        <input type="file" accept="*" onChange={handleRestore} className="hidden" />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mb-6">
                    <div className="p-6 border-b border-gray-50 dark:border-gray-700/50 flex justify-between items-center bg-red-50/10">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                            <Bell className="mr-2 h-5 w-5 text-red-500" />
                            Notifikationer
                        </h2>
                        {notifications.some(n => !n.is_read) && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg transition-colors"
                            >
                                Marker alle som læst
                            </button>
                        )}
                    </div>

                    <div className="divide-y divide-gray-50 dark:divide-gray-700 max-h-80 overflow-y-auto">
                        {isLoadingNotifs ? (
                            <div className="p-12 flex justify-center">
                                <Loader2 className="animate-spin h-8 w-8 text-gray-300" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-12 text-center text-gray-400 dark:text-gray-500 font-medium italic">
                                Ingen notifikationer endnu.
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`p-4 flex items-start space-x-4 transition-colors ${!notif.is_read ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}
                                >
                                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!notif.is_read ? 'bg-red-500 animate-pulse' : 'bg-transparent'}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className={`text-sm font-bold ${!notif.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {notif.title}
                                            </p>
                                            <span className="text-[10px] text-gray-400 font-medium shrink-0">
                                                {new Date(notif.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{notif.message}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Order History Section */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 dark:border-gray-700/50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                            <Clock className="mr-2 h-5 w-5 text-green-500" />
                            Bestillingshistorik
                        </h2>
                        <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-500 dark:text-gray-400">Seneste 100</span>
                    </div>

                    <div className="overflow-x-auto">
                        {isLoadingHistory ? (
                            <div className="p-12 flex justify-center">
                                <Loader2 className="animate-spin h-8 w-8 text-gray-300" />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="p-12 text-center text-gray-500 dark:text-gray-400 font-medium italic">
                                Ingen historik endnu.
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                                    <tr>
                                        <th className="p-4 pl-6">Publikation</th>
                                        <th className="p-4">Bestilt Af</th>
                                        <th className="p-4">Modtaget Af</th>
                                        <th className="p-4 text-right pr-6">Dato</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                    {history.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                        <Package className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="font-bold text-sm text-gray-900 dark:text-gray-100">{item.name}</div>
                                                            {item.language && (
                                                                <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-black uppercase tracking-wider shadow-sm shadow-indigo-500/20">
                                                                    {item.language}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] font-mono text-gray-400">
                                                            {item.code} ({item.received_quantity && item.received_quantity !== item.quantity
                                                                ? <span className="text-amber-500 font-bold">{item.received_quantity}/{item.quantity} stk</span>
                                                                : `${item.quantity} stk`})
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                                                    <User className="h-3 w-3" />
                                                    <span>{item.ordered_by}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className={`flex items-center space-x-2 text-xs ${item.status === 'Slettet' ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                                                    {item.status === 'Slettet' ? <Trash2 className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                                                    <span className="font-bold">{item.status || 'Modtaget'}:</span>
                                                    <span>{item.received_by || 'System'}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right pr-6 flex items-center justify-end space-x-3">
                                                <span className="text-xs text-gray-400">
                                                    {new Date(item.received_at).toLocaleDateString('da-DK', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                                {item.status === 'Slettet' && (
                                                    <button
                                                        onClick={() => handleRestoreItem(item)}
                                                        className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all"
                                                        title="Gendan denne slettede bestilling"
                                                    >
                                                        <RefreshCw className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Secure Workflow Info */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center mb-4">
                        <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                        Sikker Workflow
                    </h2>
                    <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                        <p>
                            Vi følger en streng sikkerhedsprocedure for alle ændringer på dette system:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Alle funktioner testes først lokalt i Antigravity.</li>
                            <li>Nye opdateringer deploy'es til en lukket preview-side for gennemsyn.</li>
                            <li>Intet udrulles til <strong>lager.junkerne.dk</strong> uden din direkte godkendelse.</li>
                            <li>Passwords gemmes altid krypteret (PBKDF2).</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin;
