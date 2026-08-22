import React from 'react';
import { SignIn } from '@clerk/nextjs';
import { GraduationCap } from 'lucide-react';

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-12 relative overflow-hidden"
      dir="rtl"
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "url('https://www.transparenttextures.com/patterns/cubes.png')",
        }}
      />

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-2xl mb-4 rotate-3 hover:rotate-0 transition-transform">
            <GraduationCap className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white mb-1">بوابة المدربين</h1>
          <p className="text-sm text-gray-400">
            منصة الرحلة - لوحة تحكم وإدارة الجلسات
          </p>
          <p className="text-xs text-blue-400 mt-1 font-bold">
            للمدربين المعتمدين فقط
          </p>
        </div>

        <SignIn fallbackRedirectUrl="/" />

        <div className="text-center mt-8 text-xs text-gray-500">
          &copy; {new Date().getFullYear()} جميع الحقوق محفوظة لمنصة الرحلة.
        </div>
      </div>
    </div>
  );
}
