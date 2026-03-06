import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Save, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';

const ChangePassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { user, changePassword } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 8) {
            setError('Adgangskoden skal være på mindst 8 tegn for din sikkerhed.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('De to adgangskoder er ikke ens.');
            return;
        }

        if (user) {
            setIsSaving(true);
            try {
                const success = await changePassword(user.username, newPassword);
                if (success) {
                    navigate('/', { replace: true });
                } else {
                    setError('Der opstod en fejl ved gemning af koden. Prøv igen.');
                }
            } catch (err) {
                setError('Kunne ikke forbinde til serveren. Tjek din internetforbindelse.');
            } finally {
                setIsSaving(false);
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 transition-colors duration-500">
            {/* Background decorative elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-600/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-600/5 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative w-full max-w-md animate-in fade-in zoom-in duration-500">
                {/* Back button (only if not forced change) */}
                {!user?.requireChangePassword && (
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-6 flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Tilbage
                    </button>
                )}

                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800">
                    <div className="text-center mb-8">
                        <div className="relative inline-block">
                            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30 transform -rotate-3 group-hover:rotate-0 transition-transform duration-300">
                                <Lock className="text-white h-10 w-10" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 border-4 border-white dark:border-gray-900 shadow-sm">
                                <ShieldCheck className="text-white h-4 w-4" />
                            </div>
                        </div>

                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                            Skift Adgangskode
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 leading-relaxed">
                            {user?.requireChangePassword
                                ? 'Din adgangskode er blevet nulstillet. Du skal vælge en ny personlig kode for at beskytte din konto.'
                                : 'Vælg en stærk adgangskode for at sikre din adgang til systemet.'}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-sm font-bold flex items-center border border-red-100 dark:border-red-900/20 animate-shake">
                            <span className="mr-2">⚠️</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">
                                Ny Adgangskode
                            </label>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full pl-5 pr-12 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-600 rounded-2xl outline-none transition-all placeholder-gray-400 dark:placeholder-gray-600 text-gray-900 dark:text-white font-medium"
                                    placeholder="Min. 8 tegn"
                                    required
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">
                                Bekræft Adgangskode
                            </label>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-600 rounded-2xl outline-none transition-all placeholder-gray-400 dark:placeholder-gray-600 text-gray-900 dark:text-white font-medium"
                                placeholder="Gentag din kode"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`w-full flex items-center justify-center space-x-2 py-4 rounded-2xl font-black text-white transition-all shadow-xl shadow-blue-500/20 active:scale-95 mt-4 ${isSaving
                                    ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                                }`}
                        >
                            {isSaving ? (
                                <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Save className="h-5 w-5 text-blue-200" />
                                    <span>Gem og fortsæt</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-8 text-xs text-gray-400 dark:text-gray-500 font-medium">
                    © 2026 Litteratur Lagerstyring · Sikker forbindelse
                </p>
            </div>
        </div>
    );
};

export default ChangePassword;
