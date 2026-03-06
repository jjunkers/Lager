import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col p-4">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Noget gik galt...</h1>
                    <p className="text-gray-600 mb-8 max-w-md text-center">
                        Vi beklager ulejligheden. Prøv venligst at genindlæse siden.
                    </p>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.reload();
                        }}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Ryd Cache & Genindlæs
                    </button>
                    <pre className="mt-8 p-4 bg-gray-100 rounded text-xs text-gray-500 overflow-auto max-w-full">
                        {this.state.error?.toString()}
                    </pre>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
