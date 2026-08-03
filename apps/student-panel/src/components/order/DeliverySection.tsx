"use client";


import React from 'react';
import FormField from '@alrehla/ui/form-field';
import { Select } from '@alrehla/ui/native-select';
import type { PersonalizedProduct } from '../../lib/database.types';
import ShippingAddressForm from '../shared/ShippingAddressForm';
import { Truck, Smartphone } from 'lucide-react';
import type { OrderFormApi } from './form-types';

interface DeliverySectionProps {
    product: PersonalizedProduct | null;
    form: OrderFormApi;
}

const DeliverySection: React.FC<DeliverySectionProps> = ({ product, form }) => {

    const hasElectronicOption = product?.price_electronic !== null && product?.price_electronic > 0;

    return (
        <form.Subscribe selector={(state: any) => state.values.deliveryType}>
            {(deliveryType: 'printed' | 'electronic') => <div>
            <div className="space-y-6">
                {product?.has_printed_version && (
                    <FormField label="نوع النسخة المطلوبة" htmlFor="deliveryType">
                        <form.Field name="deliveryType">
                            {(field: any) => <Select id="deliveryType" value={field.state.value || ''} onChange={(event) => field.handleChange(event.target.value)} onBlur={field.handleBlur}>
                            {/* الخيار المطبوع يظهر دائماً لأننا في شرط has_printed_version */}
                            <option value="printed">
                                {hasElectronicOption ? 'نسخة مطبوعة (تشمل نسخة رقمية مجاناً)' : 'نسخة مطبوعة فقط'}
                            </option>
                            
                            {/* إخفاء خيار إلكتروني فقط إذا لم يكن له سعر */}
                            {hasElectronicOption && (
                                <option value="electronic">نسخة إلكترونية فقط</option>
                            )}
                            </Select>}
                        </form.Field>
                    </FormField>
                )}

                {/* عرض توضيحي لما سيحصل عليه العميل */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center gap-3 text-sm text-blue-800">
                    {deliveryType === 'printed' ? (
                        <>
                            <Truck size={20} className="shrink-0" />
                            <p>سيتم شحن كتاب ورقي فاخر إلى عنوانك. {hasElectronicOption && 'كما ستحصل على نسخة PDF مجانية.'}</p>
                        </>
                    ) : (
                        <>
                            <Smartphone size={20} className="shrink-0" />
                            <p>ستحصل على ملف PDF عالي الجودة للقصة، يمكنك قراءته على الهاتف أو الجهاز اللوحي.</p>
                        </>
                    )}
                </div>
                
                {deliveryType === 'printed' && (
                    <div className="space-y-4 pt-4 border-t animate-fadeIn">
                        <h4 className="font-bold text-gray-700">بيانات التوصيل</h4>
                        <ShippingAddressForm form={form} />
                    </div>
                )}
            </div></div>}
        </form.Subscribe>
    );
};

export default DeliverySection;
