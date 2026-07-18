"use client";


import React, { useEffect } from 'react';
import { EGYPTIAN_GOVERNORATES } from '../../utils/governorates';
import FormField from '@alrehla/ui/form-field';
import { Select } from '@alrehla/ui/native-select';
import { Input } from '@alrehla/ui/input';
import { Textarea } from '@alrehla/ui/textarea';
import { useFormContext } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';

interface ShippingAddressFormProps {
    formData?: any;
    handleChange?: (e: React.ChangeEvent<any>) => void;
    setValue?: (name: string, value: any) => void;
    errors?: any;
}

const ShippingAddressForm: React.FC<ShippingAddressFormProps> = (props) => {
    const { currentUser } = useAuth();
    
    // Try to get context, but don't crash if it's null
    const context = useFormContext();
    
    // Determine mode: Context-based (RHF) or Manual (Props)
    const isContextMode = !!context;

    // Extract methods/data based on mode
    const register = isContextMode ? context.register : null;
    const contextErrors = isContextMode ? context.formState.errors : {};
    const contextWatch = isContextMode ? context.watch : null;
    const contextSetValue = isContextMode ? context.setValue : null;

    // Unified Accessors
    const errors = isContextMode ? contextErrors : (props.errors || {});
    const shippingOption = isContextMode && contextWatch ? contextWatch('shippingOption') : props.formData?.shippingOption;
    
    // دالة مساعدة لتحديث الحقول سواء كنا نستخدم React Hook Form أو State عادي
    const setFieldValue = (field: string, value: any) => {
        if (isContextMode && contextSetValue) {
            contextSetValue(field, value, { shouldValidate: true });
        } else if (props.setValue) {
            props.setValue(field, value);
        }
    };

    // عند تغيير خيار الشحن
    const handleOptionChange = (value: 'my_address' | 'gift') => {
        setFieldValue('shippingOption', value);
        
        if (value === 'my_address' && currentUser) {
            // ملء البيانات من الملف الشخصي
            setFieldValue('recipientName', currentUser.name || '');
            setFieldValue('recipientAddress', currentUser.address || '');
            setFieldValue('recipientPhone', currentUser.phone || '');
            setFieldValue('recipientEmail', currentUser.email || '');
            // نأخذ المحافظة فقط إذا كانت موجودة وصالحة في القائمة، وإلا نتركها فارغة ليختارها المستخدم
            const userGov = currentUser.governorate || (currentUser.city && EGYPTIAN_GOVERNORATES.includes(currentUser.city) ? currentUser.city : '');
            setFieldValue('governorate', userGov);
        } else if (value === 'gift') {
            // تفريغ الحقول عند اختيار هدية
            setFieldValue('recipientName', '');
            setFieldValue('recipientAddress', '');
            setFieldValue('recipientPhone', '');
            setFieldValue('recipientEmail', '');
            setFieldValue('giftMessage', '');
            setFieldValue('governorate', ''); // تفريغ المحافظة لإجبار الاختيار
        }
    };

    // عند التحميل لأول مرة، إذا كان الخيار "عنواني"، نملأ البيانات إذا كانت الحقول فارغة
    useEffect(() => {
        const currentName = isContextMode && contextWatch ? contextWatch('recipientName') : props.formData?.recipientName;
        if (shippingOption === 'my_address' && currentUser && !currentName) {
            handleOptionChange('my_address');
        }
    }, [currentUser, shippingOption]);

    // Helper to generate props for inputs
    const getInputProps = (fieldName: string) => {
        if (isContextMode && register) {
            // Fix: Pass 'value' explicitly to make it a controlled component.
            // This ensures when we call setValue (e.g. clearing for gift), the UI updates immediately.
            const currentValue = contextWatch ? contextWatch(fieldName) : '';
            return { 
                ...register(fieldName),
                value: currentValue || '' 
            };
        }
        return {
            name: fieldName,
            id: fieldName,
            value: props.formData?.[fieldName] || '',
            onChange: props.handleChange
        };
    };

    // Wrapper specifically for Phone inputs to prevent non-numeric characters
    const getPhoneProps = (fieldName: string) => {
        const baseProps = getInputProps(fieldName);
        const originalOnChange = baseProps.onChange;

        return {
            ...baseProps,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                const val = e.target.value;
                // Only allow digits (and empty string to allow deletion)
                if (/^\d*$/.test(val)) {
                    if (originalOnChange) originalOnChange(e);
                }
            },
            type: 'tel',
            inputMode: 'numeric' as const, // Shows numeric keypad on mobile
            pattern: "[0-9]*"
        };
    };

    const isGift = shippingOption === 'gift';

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">خيار التوصيل</label>
                <div className="flex gap-4 rounded-lg border p-1 bg-gray-100">
                    <button type="button" onClick={() => handleOptionChange('my_address')} className={`flex-1 p-2 rounded-md font-semibold text-sm transition-all ${shippingOption === 'my_address' ? 'bg-blue-600 text-white shadow' : 'hover:bg-gray-200'}`}>
                        توصيل لعنواني المسجل
                    </button>
                    <button type="button" onClick={() => handleOptionChange('gift')} className={`flex-1 p-2 rounded-md font-semibold text-sm transition-all ${shippingOption === 'gift' ? 'bg-blue-600 text-white shadow' : 'hover:bg-gray-200'}`}>
                        إرسال كهدية لشخص آخر
                    </button>
                </div>
            </div>

            <div className={`p-4 rounded-lg space-y-4 animate-fadeIn border ${isGift ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label={isGift ? "اسم المستلم*" : "الاسم بالكامل*"} htmlFor="recipientName" error={errors.recipientName?.message || errors.recipientName}>
                        <Input type="text" {...getInputProps('recipientName')} placeholder="الاسم ثلاثي" />
                    </FormField>
                    <FormField label={isGift ? "هاتف المستلم*" : "رقم الهاتف*"} htmlFor="recipientPhone" error={errors.recipientPhone?.message || errors.recipientPhone}>
                        <Input {...getPhoneProps('recipientPhone')} placeholder="01xxxxxxxxx" dir="ltr" />
                    </FormField>
                </div>
                
                <FormField label={isGift ? "عنوان المستلم بالتفصيل*" : "العنوان بالتفصيل*"} htmlFor="recipientAddress" error={errors.recipientAddress?.message || errors.recipientAddress}>
                    <Input type="text" {...getInputProps('recipientAddress')} placeholder="الشارع، رقم المبنى، الشقة، علامة مميزة" />
                </FormField>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label={isGift ? "محافظة المستلم*" : "المحافظة (لحساب الشحن)*"} htmlFor="governorate" error={errors.governorate?.message || errors.governorate}>
                        <Select {...getInputProps('governorate')}>
                            <option value="" disabled>-- اختر المحافظة --</option>
                            {EGYPTIAN_GOVERNORATES.map(gov => <option key={gov} value={gov}>{gov}</option>)}
                        </Select>
                    </FormField>
                    <FormField label={isGift ? "البريد الإلكتروني للمستلم" : "البريد الإلكتروني (للمتابعة)"} htmlFor="recipientEmail" error={errors.recipientEmail?.message || errors.recipientEmail}>
                        <Input type="email" {...getInputProps('recipientEmail')} placeholder="example@mail.com" dir="ltr" />
                    </FormField>
                </div>

                {isGift && (
                    <div className="pt-4 border-t border-purple-200 space-y-4">
                        <FormField label="رسالة الهدية (سنطبعها في كارت أنيق)" htmlFor="giftMessage">
                            <Textarea rows={3} placeholder="اكتب رسالتك الرقيقة هنا لتصل مع الهدية..." {...getInputProps('giftMessage')} />
                        </FormField>
                        <div>
                            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                {isContextMode && register ? (
                                    <input type="checkbox" {...register('sendDigitalCard')} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
                                ) : (
                                    <input 
                                        type="checkbox" 
                                        name="sendDigitalCard" 
                                        checked={props.formData?.sendDigitalCard || false} 
                                        onChange={props.handleChange} 
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                )}
                                <span className="font-semibold text-purple-800">إرسال بطاقة هدية رقمية للمستلم فور تأكيد الطلب</span>
                            </label>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShippingAddressForm;
