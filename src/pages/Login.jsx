import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, Box, ChevronRight } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await login(username, password);
            if (result.success) {
                navigate('/');
            } else {
                setError(result.error || 'Forkert brugernavn eller adgangskode');
                setIsLoading(false);
            }
        } catch (err) {
            console.error("Login submission error:", err);
            setError('Der opstod en fejl under login. Prøv igen senere.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-950 font-sans overflow-hidden transition-colors duration-200">
            {/* Animated Background Effect for Right Side */}
            <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

            {/* Left Side - Hero / Branding */}
            <div className="hidden lg:flex lg:w-5/12 relative bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-slate-900/95 to-slate-950 opacity-100"></div>
                <div className="absolute inset-0" style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1553413077-190dd305871c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    mixBlendMode: 'overlay',
                    opacity: 0.3
                }}></div>

                {/* Abstract Shapes */}
                <div className="absolute top-20 right-[-50px] w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute bottom-20 left-[-50px] w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

                <div className="relative z-10 flex flex-col justify-between p-16 text-white w-full h-full">
                    <div className="flex items-center space-x-3" style={{ animation: 'fadeIn 0.8s ease-out' }}>
                        <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/10 shadow-lg">
                            <Box className="h-6 w-6 text-blue-200" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white/90">Skandinavisk litteratur - Los Boliches menighed</span>
                    </div>

                    <div className="mb-12" style={{ animation: 'fadeIn 0.8s ease-out 0.2s backwards' }}>
                        <h1 className="text-5xl font-bold mb-8 leading-tight tracking-tight">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200">Litteratur</span>
                        </h1>
                        <div className="space-y-4">
                            {[
                                'Oversigt i realtid',
                                'Dansk, Norsk & Svensk lager',
                                'Avanceret brugerstyring'
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center space-x-3 text-blue-100/80">
                                    <div className="h-px w-8 bg-blue-400/30"></div>
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end items-end text-xs text-blue-400/50 font-medium tracking-wide uppercase" style={{ animation: 'fadeIn 0.8s ease-out 0.4s backwards' }}>
                        <span>v{__APP_VERSION__}</span>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-7/12 flex items-center justify-center p-8 lg:p-24 bg-gray-900 relative transition-colors duration-200">
                <div className="w-full max-w-sm space-y-10" style={{ animation: 'fadeIn 0.8s ease-out 0.1s backwards' }}>
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Log Ind</h2>
                        <p className="mt-3 text-slate-500 dark:text-slate-400">Adgang til Skandinavisk litteratur - Los Boliches menighed</p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <div className="space-y-5">
                            <div className="group">
                                <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Brugernavn</label>
                                <div className="relative transition-all duration-300 transform group-focus-within:-translate-y-1">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 dark:text-gray-500 dark:group-focus-within:text-blue-400 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-3.5 border border-gray-700 rounded-2xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 shadow-sm group-focus-within:shadow-md"
                                        placeholder="Indtast brugernavn"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Adgangskode</label>
                                <div className="relative transition-all duration-300 transform group-focus-within:-translate-y-1">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 dark:text-gray-500 dark:group-focus-within:text-blue-400 transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-3.5 border border-gray-700 rounded-2xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 shadow-sm group-focus-within:shadow-md"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 animate-fadeIn border border-red-100 dark:border-red-900/30 flex items-start space-x-3">
                                <div className="text-red-500 dark:text-red-400 mt-0.5">
                                    <ChevronRight className="h-4 w-4" />
                                </div>
                                <div className="text-sm text-red-600 dark:text-red-300 font-medium">{error}</div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`relative w-full flex justify-center items-center py-4 px-4 border border-transparent text-sm font-semibold rounded-2xl text-white bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 dark:focus:ring-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl ${isLoading ? 'opacity-80 cursor-not-allowed' : 'hover:-translate-y-1'}`}
                            >
                                {isLoading ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-100"></div>
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-200"></div>
                                    </div>
                                ) : (
                                    <>
                                        <span>Log Ind på Portalen</span>
                                        <ArrowRight className="absolute right-6 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer info absolute bottom */}
                <div className="absolute bottom-8 w-full text-center">
                    <p className="text-xs text-gray-300 dark:text-gray-600 font-normal">
                        Beskyttet system. Uautoriseret adgang logges.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
