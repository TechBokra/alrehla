"use client";

import React, { useEffect } from 'react';
import { EGYPTIAN_GOVERNORATES } from '../../utils/governorates';
import FormField from '@alrehla/ui/form-field';
import { Select } from '@alrehla/ui/native-select';
import { Input } from '@alrehla/ui/input';
import { Textarea } from '@alrehla/ui/textarea';
import { Button } from '@alrehla/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import type { OrderFormApi } from '../order/form-types';
import { getFieldError } from '../order/form-types';

interface ShippingAddressFormProps {
    form?: OrderFormApi;
    formData?: any;
    handleChange?: (e: React.ChangeEvent<any>) => void;
    setValue?: (name: string, value: any) => void;
    errors?: any;
}

const ShippingAddressForm: React.FC<ShippingAddressFormProps> = (props) => {
    const { currentUser } = useAuth();
    const { form } = props;

    useEffect(() => {
        if (form || !currentUser || props.formData?.shippingOption !== 'my_address' || props.formData?.recipientName) return;
        props.setValue?.('recipientName', currentUser.name || '');
        props.setValue?.('recipientAddress', currentUser.address || '');
        props.setValue?.('recipientPhone', currentUser.phone || '');
        props.setValue?.('recipientEmail', currentUser.email || '');
        const governorate = currentUser.governorate || (currentUser.city && EGYPTIAN_GOVERNORATES.includes(currentUser.city) ? currentUser.city : '');
        props.setValue?.('governorate', governorate);
    }, [currentUser, form, props.formData?.recipientName, props.formData?.shippingOption, props.setValue]);

    const renderFields = (values: any, fieldMeta: any, errors: any) => {
        const shippingOption = values?.shippingOption;
        const isGift = shippingOption === 'gift';
        const getError = (name: string) => form ? getFieldError({ state: { meta: fieldMeta?.[name] } }) : errors?.[name]?.message || errors?.[name];
        const setFieldValue = (field: string, value: any) => form ? form.setFieldValue(field, value) : props.setValue?.(field, value);
        const handleOptionChange = (value: 'my_address' | 'gift') => {
            setFieldValue('shippingOption', value);
            if (value === 'my_address' && currentUser) {
                setFieldValue('recipientName', currentUser.name || '');
                setFieldValue('recipientAddress', currentUser.address || '');
                setFieldValue('recipientPhone', currentUser.phone || '');
                setFieldValue('recipientEmail', currentUser.email || '');
                const governorate = currentUser.governorate || (currentUser.city && EGYPTIAN_GOVERNORATES.includes(currentUser.city) ? currentUser.city : '');
                setFieldValue('governorate', governorate);
            } else if (value === 'gift') {
                setFieldValue('recipientName', '');
                setFieldValue('recipientAddress', '');
                setFieldValue('recipientPhone', '');
                setFieldValue('recipientEmail', '');
                setFieldValue('giftMessage', '');
                setFieldValue('governorate', '');
            }
        };
        const renderTextField = (name: string, type = 'text', placeholder?: string, dir?: 'ltr') => form ? (
            <form.Field name={name}>{(field: any) => <Input id={name} type={type} value={field.state.value || ''} onChange={(event) => field.handleChange(event.target.value)} onBlur={field.handleBlur} placeholder={placeholder} dir={dir} />}</form.Field>
        ) : <Input id={name} name={name} type={type} value={values?.[name] || ''} onChange={props.handleChange} placeholder={placeholder} dir={dir} />;
        const renderPhoneField = form ? (
            <form.Field name="recipientPhone">{(field: any) => <Input id="recipientPhone" type="tel" inputMode="numeric" pattern="[0-9]*" value={field.state.value || ''} onChange={(event) => { if (/^\d*$/.test(event.target.value)) field.handleChange(event.target.value); }} onBlur={field.handleBlur} placeholder="01xxxxxxxxx" dir="ltr" />}</form.Field>
        ) : <Input id="recipientPhone" name="recipientPhone" type="tel" inputMode="numeric" pattern="[0-9]*" value={values?.recipientPhone || ''} onChange={(event) => { if (/^\d*$/.test(event.target.value)) props.handleChange?.(event); }} placeholder="01xxxxxxxxx" dir="ltr" />;

        return (
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">خيار التوصيل</label>
                    <div className="flex gap-4 rounded-lg border p-1 bg-gray-100">
                        <Button
                            type="button"
                            variant={shippingOption === 'my_address' ? 'default' : 'ghost'}
                            onClick={() => handleOptionChange('my_address')}
                            className={`flex-1 p-2 rounded-md font-semibold text-sm transition-all ${shippingOption === 'my_address' ? 'bg-blue-600 text-white shadow hover:bg-blue-700' : 'hover:bg-gray-200 text-gray-700'}`}
                        >
                            توصيل لعنواني المسجل
                        </Button>
                        <Button
                            type="button"
                            variant={shippingOption === 'gift' ? 'default' : 'ghost'}
                            onClick={() => handleOptionChange('gift')}
                            className={`flex-1 p-2 rounded-md font-semibold text-sm transition-all ${shippingOption === 'gift' ? 'bg-blue-600 text-white shadow hover:bg-blue-700' : 'hover:bg-gray-200 text-gray-700'}`}
                        >
                            إرسال كهدية لشخص آخر
                        </Button>
                    </div>
                </div>
                <div className={`p-4 rounded-lg space-y-4 animate-fadeIn border ${isGift ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label={isGift ? 'اسم المستلم*' : 'الاسم بالكامل*'} htmlFor="recipientName" error={getError('recipientName')}>{renderTextField('recipientName', 'text', 'الاسم ثلاثي')}</FormField>
                        <FormField label={isGift ? 'هاتف المستلم*' : 'رقم الهاتف*'} htmlFor="recipientPhone" error={getError('recipientPhone')}>{renderPhoneField}</FormField>
                    </div>
                    <FormField label={isGift ? 'عنوان المستلم بالتفصيل*' : 'العنوان بالتفصيل*'} htmlFor="recipientAddress" error={getError('recipientAddress')}>{renderTextField('recipientAddress', 'text', 'الشارع، رقم المبنى، الشقة، علامة مميزة')}</FormField>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label={isGift ? 'محافظة المستلم*' : 'المحافظة (لحساب الشحن)*'} htmlFor="governorate" error={getError('governorate')}>
                            {form ? <form.Field name="governorate">{(field: any) => <Select id="governorate" value={field.state.value || ''} onChange={(event) => field.handleChange(event.target.value)} onBlur={field.handleBlur}><option value="" disabled>-- اختر المحافظة --</option>{EGYPTIAN_GOVERNORATES.map(gov => <option key={gov} value={gov}>{gov}</option>)}</Select>}</form.Field> : <Select id="governorate" name="governorate" value={values?.governorate || ''} onChange={props.handleChange}><option value="" disabled>-- اختر المحافظة --</option>{EGYPTIAN_GOVERNORATES.map(gov => <option key={gov} value={gov}>{gov}</option>)}</Select>}
                        </FormField>
                        <FormField label={isGift ? 'البريد الإلكتروني للمستلم' : 'البريد الإلكتروني (للمتابعة)'} htmlFor="recipientEmail" error={getError('recipientEmail')}>{renderTextField('recipientEmail', 'email', 'example@mail.com', 'ltr')}</FormField>
                    </div>
                    {isGift && <div className="pt-4 border-t border-purple-200 space-y-4">
                        <FormField label="رسالة الهدية (سنطبعها في كارت أنيق)" htmlFor="giftMessage">
                            {form ? <form.Field name="giftMessage">{(field: any) => <Textarea id="giftMessage" rows={3} value={field.state.value || ''} onChange={(event) => field.handleChange(event.target.value)} onBlur={field.handleBlur} placeholder="اكتب رسالتك الرقيقة هنا لتصل مع الهدية..." />}</form.Field> : <Textarea id="giftMessage" name="giftMessage" rows={3} value={values?.giftMessage || ''} onChange={props.handleChange} placeholder="اكتب رسالتك الرقيقة هنا لتصل مع الهدية..." />}
                        </FormField>
                        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                            {form ? <form.Field name="sendDigitalCard">{(field: any) => <input id="sendDigitalCard" type="checkbox" checked={Boolean(field.state.value)} onChange={(event) => field.handleChange(event.target.checked)} onBlur={field.handleBlur} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />}</form.Field> : <input id="sendDigitalCard" type="checkbox" name="sendDigitalCard" checked={Boolean(values?.sendDigitalCard)} onChange={props.handleChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />}
                            <span className="font-semibold text-purple-800">إرسال بطاقة هدية رقمية للمستلم فور تأكيد الطلب</span>
                        </label>
                    </div>}
                </div>
            </div>
        );
    };

    if (form) return <form.Subscribe selector={(state: any) => ({ values: state.values, fieldMeta: state.fieldMeta })}>{(state: any) => renderFields(state.values, state.fieldMeta, {})}</form.Subscribe>;
    return renderFields(props.formData || {}, {}, props.errors || {});
};

export default ShippingAddressForm;
