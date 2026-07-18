
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, GripVertical } from 'lucide-react';
import type { ComparisonItem } from '../../lib/database.types';
import { Button } from '@alrehla/ui/button';
import { Input } from '@alrehla/ui/input';
import { Select } from '@alrehla/ui/native-select';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@alrehla/ui/card';
import { useCreativeWritingSettingsMutations } from '../../hooks/mutations/useCreativeWritingSettingsMutations';

interface ComparisonCriteriaManagerProps {
    items: ComparisonItem[];
}

const ComparisonCriteriaManager: React.FC<ComparisonCriteriaManagerProps> = ({ items }) => {
    const { createComparisonItem, updateComparisonItem, deleteComparisonItem } = useCreativeWritingSettingsMutations();
    
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<ComparisonItem>>({});
    
    // New Item State
    const [newItemLabel, setNewItemLabel] = useState('');
    const [newItemType, setNewItemType] = useState<'boolean' | 'text'>('text');
    const [newItemId, setNewItemId] = useState(''); // Allow custom ID for easier mapping

    const handleStartEdit = (item: ComparisonItem) => {
        setEditingId(item.id);
        setEditForm(item);
    };

    const handleSaveEdit = async () => {
        if (editingId && editForm.label) {
            await updateComparisonItem.mutateAsync({ ...editForm, id: editingId });
            setEditingId(null);
            setEditForm({});
        }
    };
    
    const handleCancelEdit = () => {
         setEditingId(null);
         setEditForm({});
    };

    const handleCreate = async () => {
        if (!newItemLabel || !newItemId) return;
        
        await createComparisonItem.mutateAsync({
            id: newItemId.toLowerCase().replace(/\s+/g, '_'),
            label: newItemLabel,
            type: newItemType,
            sort_order: items.length + 1
        });
        
        setNewItemLabel('');
        setNewItemId('');
        setNewItemType('text');
    };
    
    const handleDelete = async (id: string) => {
        if(window.confirm("هل أنت متأكد؟ سيتم حذف هذا البند من جميع الباقات.")) {
            await deleteComparisonItem.mutateAsync({ itemId: id });
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>إدارة معايير المقارنة</CardTitle>
                <CardDescription>
                    هنا يمكنك تحديد الصفوف التي تظهر في جدول مقارنة الباقات في الصفحة العامة.
                    <br/>
                    <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded mt-1 inline-block">
                        تنبيه: "المعرف" (ID) يستخدم داخلياً لربط القيم. يفضل استخدام الإنجليزية بدون مسافات (مثال: num_sessions).
                    </span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* List Existing Items */}
                    <div className="border rounded-lg divide-y">
                        <div className="bg-muted p-3 grid grid-cols-12 gap-4 text-sm font-bold text-muted-foreground">
                            <div className="col-span-1 text-center">#</div>
                            <div className="col-span-3">المعرف (ID)</div>
                            <div className="col-span-4">العنوان (Label)</div>
                            <div className="col-span-2">النوع</div>
                            <div className="col-span-2 text-center">إجراءات</div>
                        </div>
                        
                        {items.map((item, index) => (
                            <div key={item.id} className="p-3 grid grid-cols-12 gap-4 items-center hover:bg-gray-50">
                                <div className="col-span-1 text-center text-muted-foreground font-mono">{item.sort_order}</div>
                                
                                {editingId === item.id ? (
                                    <>
                                        <div className="col-span-3 text-sm font-mono text-muted-foreground">{item.id}</div>
                                        <div className="col-span-4">
                                            <Input 
                                                value={editForm.label} 
                                                onChange={e => setEditForm({...editForm, label: e.target.value})} 
                                                className="h-8"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Select 
                                                value={editForm.type} 
                                                onChange={e => setEditForm({...editForm, type: e.target.value as any})}
                                                className="h-8 text-xs"
                                            >
                                                <option value="text">نص</option>
                                                <option value="boolean">نعم/لا</option>
                                            </Select>
                                        </div>
                                        <div className="col-span-2 flex justify-center gap-2">
                                            <Button size="icon" variant="success" className="h-8 w-8" onClick={handleSaveEdit}><Check size={16}/></Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit}><X size={16}/></Button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="col-span-3 text-sm font-mono">{item.id}</div>
                                        <div className="col-span-4 font-semibold">{item.label}</div>
                                        <div className="col-span-2">
                                            <span className={`text-xs px-2 py-1 rounded-full ${item.type === 'boolean' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {item.type === 'boolean' ? 'نعم/لا' : 'نص'}
                                            </span>
                                        </div>
                                        <div className="col-span-2 flex justify-center gap-2">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleStartEdit(item)}><Edit2 size={16}/></Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(item.id)}><Trash2 size={16}/></Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Add New Item */}
                    <div className="bg-muted/30 p-4 rounded-lg border-2 border-dashed border-gray-200">
                        <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><Plus size={16}/> إضافة معيار جديد</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                                <label className="text-xs font-semibold mb-1 block">المعرف (ID - إنجليزي)</label>
                                <Input placeholder="مثال: extra_sessions" value={newItemId} onChange={e => setNewItemId(e.target.value)} dir="ltr" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-semibold mb-1 block">العنوان (يظهر للعميل)</label>
                                <Input placeholder="مثال: جلسات إضافية" value={newItemLabel} onChange={e => setNewItemLabel(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold mb-1 block">النوع</label>
                                <Select value={newItemType} onChange={e => setNewItemType(e.target.value as any)}>
                                    <option value="text">نص مخصص</option>
                                    <option value="boolean">نعم / لا</option>
                                </Select>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                             <Button onClick={handleCreate} disabled={!newItemLabel || !newItemId} loading={createComparisonItem.isPending}>
                                إضافة
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ComparisonCriteriaManager;
