
import React from 'react';
import { LogoIcon } from './Icons';

const Header: React.FC = () => {
    return (
        <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
            <div className="container mx-auto px-4 md:px-8 py-4">
                <div className="flex items-center space-x-3">
                    <LogoIcon className="h-8 w-8 text-teal-400" />
                    <h1 className="text-2xl font-bold text-gray-100 tracking-tight">
                        Data Sheet <span className="text-teal-400">Consolidator</span>
                    </h1>
                </div>
            </div>
        </header>
    );
}

export default Header;
