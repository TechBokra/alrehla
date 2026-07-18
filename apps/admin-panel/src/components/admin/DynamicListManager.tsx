
import React from 'react';
import { Button } from '@alrehla/ui/button';
import { Input } from '@alrehla/ui/input';
import { Trash2, Plus } from 'lucide-react';
import { Select } from '@alrehla/ui/native-select';
import { Card, CardContent } from '@alrehla/ui/card';

interface FieldDefinition {
    key: string;
    placeholder: string;
    type?: 'text' | 'number' | 'select' | 'checkbox';
    options?: { label: string; value: string }[];
    disabled?: boolean;
    width?: string;
}

interface DynamicListManagerProps {
    items: any[];
    fields: FieldDefinition[];
    onAdd: () => void;
    onRemove: (index: number) => void;
    onChange: (index: number, key: string, value: any) => void;
    addButtonLabel?: string;
    emptyMessage?: string;
    disableAdd?: boolean;
}

const DynamicListManager: React.FC<DynamicListManagerProps> = ({ 
    items, 
    fields, 
    onAdd, 
    onRemove, 
    onChange, 
    addButtonLabel = 'إضافة عنصر',
    emptyMessage = 'لا توجد عناصر.',
    disableAdd = false
}) => {
    return (
        <div className="space-y-4">
            {items.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                    {emptyMessage}
                </div>
            ) : (
                items.map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-muted/20 flex flex-wrap gap-4 items-end animate-fadeIn">
                        {fields.map((field) => (
                            <div key={field.key} className={field.width || 'flex-1 min-w-[150px]'}>
                                {field.type === 'select' ? (
                                    <Select 
                                        value={item[field.key]} 
                                        onChange={(e) => onChange(index, field.key, e.target.value)}
                                        disabled={field.disabled}
                                        className="h-9 text-sm"
                                    >
                                        {field.options?.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </Select>
                                ) : field.type === 'checkbox' ? (
                                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer h-9 select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={!!item[field.key]} 
                                            onChange={(e) => onChange(index, field.key, e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        {field.placeholder}
                                    </label>
                                ) : (
                                    <Input 
                                        type={field.type || 'text'}
                                        placeholder={field.placeholder} 
                                        value={item[field.key] || ''} 
                                        onChange={(e) => onChange(index, field.key, e.target.value)}
                                        disabled={field.disabled}
                                        className="h-9 text-sm"
                                    />
                                )}
                            </div>
                        ))}
                        <Button 
                            type="button" 
                            variant="destructive" 
                            size="icon" 
                            className="h-9 w-9 shrink-0"
                            onClick={() => onRemove(index)}
                        >
                            <Trash2 size={16}/>
                        </Button>
                    </div>
                ))
            )}
            
            <Button 
                type="button" 
                variant="outline" 
                onClick={onAdd} 
                icon={<Plus size={16} />} 
                className="w-full border-dashed"
                disabled={disableAdd}
            >
                {addButtonLabel}
            </Button>
        </div>
    );
};

export default DynamicListManager;
