
import React from 'react';
import { AuthForm } from '../../components/auth/AuthForm';
import { ShieldCheck } from 'lucide-react';
import { STAFF_ROLES } from '../../lib/roles';

const AdminLoginPage: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-12 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')"}}></div>
            
            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <div className="mx-auto w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-2xl mb-6 rotate-3 hover:rotate-0 transition-transform">
                        <ShieldCheck className="text-white w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2">بوابة الإدارة</h1>
                    <p className="text-gray-400">منصة الرحلة - لوحة التحكم المركزية</p>
                    <p className="text-xs text-red-400 mt-2 font-bold">للموظفين والمدربين فقط</p>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
                    <AuthForm 
                        mode="login" 
                        redirectTo="/" 
                        allowedRoles={STAFF_ROLES} 
                        disableSignup={true}
                    />
                </div>
                
                <div className="text-center mt-8 text-xs text-gray-500">
                    &copy; {new Date().getFullYear()} جميع الحقوق محفوظة لمنصة الرحلة.
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;
