
import React, { useState, useEffect, useCallback, memo } from 'react';
import { useParams } from 'next/navigation';
import { useAdminSiteContent } from '../../hooks/queries/admin/useAdminContentQuery';
import { useContentMutations } from '../../hooks/mutations/useContentMutations';
import { useProduct } from '../../contexts/ProductContext';
import PageLoader from '@alrehla/ui/page-loader';
import { Button } from '@alrehla/ui/button';
import { Save, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@alrehla/ui/card';
import FormField from '@alrehla/ui/form-field';
import { Input } from '@alrehla/ui/input';
import { Textarea } from '@alrehla/ui/textarea';
import { pageConfigs, FieldConfig, SectionConfig } from './content-editor/pageConfigs';
import { cn } from '../../lib/utils';
import ImageUploadField from '../../components/admin/ui/ImageUploadField';
import Accordion from '@alrehla/ui/accordion';
import { Checkbox } from '@alrehla/ui/checkbox';

// --- Helpers ---
const getNestedValue = (obj: any, path: string) => {
    if (!path || !obj) return undefined;
    return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
};

const setNestedValue = (state: any, path: string, value: any): any => {
    if (!path) return state;
    const keys = path.split('.');
    const [head, ...tail] = keys;

    if (keys.length === 1) {
        return { ...state, [head]: value };
    }

    return {
        ...state,
        [head]: setNestedValue(state[head] || {}, tail.join('.'), value)
    };
};

// --- Sub-Components ---

// 1. Field Renderer
const FieldRenderer = memo(({ field, value, onChange }: { field: FieldConfig, value: any, onChange: (path: string, val: any) => void }) => {
    
    // Sub-renderers
    const renderInputField = () => (
        <Input 
            id={field.key} 
            value={value || ''} 
            onChange={e => onChange(field.key, e.target.value)} 
            placeholder={field.placeholder}
        />
    );

    const renderTextareaField = () => (
        <Textarea 
            id={field.key} 
            value={value || ''} 
            onChange={e => onChange(field.key, e.target.value)} 
            rows={field.rows || 3} 
            placeholder={field.placeholder}
        />
    );

    const renderImageField = () => (
        <ImageUploadField 
            label={field.label}
            fieldKey={field.key}
            currentUrl={value || ''}
            onUrlChange={(key, url) => onChange(key, url)}
        />
    );

    const renderArrayField = () => {
        const items = Array.isArray(value) ? value : [];
        
        const handleItemChange = (index: number, newVal: string) => {
            const newItems = [...items];
            newItems[index] = newVal;
            onChange(field.key, newItems);
        };

        const handleAddItem = () => {
            onChange(field.key, [...items, '']);
        };

        const handleRemoveItem = (index: number) => {
            const newItems = items.filter((_, i) => i !== index);
            onChange(field.key, newItems);
        };

        return (
            <div className="space-y-3">
                {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                        <Input 
                            value={item} 
                            onChange={e => handleItemChange(idx, e.target.value)} 
                            placeholder={`عنصر ${idx + 1}`}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(idx)} className="text-destructive">
                            <Trash2 size={18} />
                        </Button>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem} icon={<Plus size={16}/>}>
                    إضافة عنصر
                </Button>
            </div>
        );
    };

    const renderObjectArrayField = () => {
        const items = Array.isArray(value) ? value : [];
        const schema = field.objectSchema || [];

        const handleAddItem = () => {
            const newItem: any = {};
            schema.forEach(subField => {
                newItem[subField.key] = '';
            });
            onChange(field.key, [...items, newItem]);
        };

        const handleRemoveItem = (index: number) => {
            const newItems = items.filter((_, i) => i !== index);
            onChange(field.key, newItems);
        };

        const handleSubFieldChange = (itemIndex: number, subKey: string, subVal: any) => {
            const newItems = [...items];
            newItems[itemIndex] = { ...newItems[itemIndex], [subKey]: subVal };
            onChange(field.key, newItems);
        };

        return (
            <div className="space-y-4">
                {items.map((item, index) => (
                    <Card key={index} className="bg-muted/30 border-dashed">
                        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs">{index + 1}</span>
                                {field.itemLabel || 'عنصر'}
                            </CardTitle>
                            <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveItem(index)} className="text-destructive h-8">
                                <Trash2 size={16} />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-4 pt-2 grid gap-4">
                            {schema.map(subField => (
                                <div key={subField.key}>
                                    {subField.type === 'image' ? (
                                         <ImageUploadField 
                                            label={subField.label}
                                            fieldKey={`${field.key}[${index}].${subField.key}`} 
                                            currentUrl={item[subField.key]}
                                            onUrlChange={(_, url) => handleSubFieldChange(index, subField.key, url)}
                                        />
                                    ) : (
                                        <FormField label={subField.label} htmlFor={`${field.key}-${index}-${subField.key}`}>
                                            {subField.type === 'textarea' ? (
                                                <Textarea 
                                                    value={item[subField.key] || ''} 
                                                    onChange={e => handleSubFieldChange(index, subField.key, e.target.value)} 
                                                    rows={subField.rows || 2}
                                                />
                                            ) : (
                                                <Input 
                                                    value={item[subField.key] || ''} 
                                                    onChange={e => handleSubFieldChange(index, subField.key, e.target.value)} 
                                                />
                                            )}
                                        </FormField>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
                <Button type="button" variant="outline" onClick={handleAddItem} icon={<Plus size={16}/>} className="w-full">
                    إضافة {field.itemLabel || 'عنصر جديد'}
                </Button>
            </div>
        );
    };

    switch (field.type) {
        case 'textarea': return renderTextareaField();
        case 'image': return renderImageField();
        case 'array': return renderArrayField();
        case 'object_array': return renderObjectArrayField();
        default: return renderInputField();
    }
}, (prevProps, nextProps) => {
    // Custom comparison for performance
    return prevProps.value === nextProps.value && prevProps.field.key === nextProps.field.key;
});

// 2. Section Renderer
const SectionRenderer = memo(({ section, globalState, onChange }: { section: SectionConfig, globalState: any, onChange: (path: string, val: any) => void }) => {
    // Fallback for visibility check to prevent crash if globalState is momentarily incomplete
    const isVisible = section.visibilityKey ? getNestedValue(globalState || {}, section.visibilityKey) ?? true : true;

    return (
        <Card className={cn("border-t-4 transition-colors", isVisible ? "border-t-primary/20" : "border-t-muted bg-muted/20")}>
            <Accordion 
                title={
                    <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                        <span>{section.title}</span>
                        {section.visibilityKey && (
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                <Checkbox 
                                    checked={isVisible} 
                                    onCheckedChange={(checked) => onChange(section.visibilityKey!, checked)} 
                                    id={`visibility-${section.key}`}
                                />
                                <label htmlFor={`visibility-${section.key}`} className="text-xs font-normal text-muted-foreground cursor-pointer">
                                    {isVisible ? 'معروض في الموقع' : 'مخفي'}
                                </label>
                            </div>
                        )}
                    </div>
                }
            >
                <div className={cn("pt-4", !isVisible && "opacity-50 pointer-events-none")}>
                    <CardContent className="space-y-6 pt-0">
                        {section.description && <p className="text-sm text-muted-foreground mb-4">{section.description}</p>}
                        
                        <div className="grid grid-cols-1 gap-6">
                            {section.fields.map(field => (
                                <div key={field.key} className={field.type === 'object_array' ? 'col-span-full' : ''}>
                                    {field.type !== 'image' && field.type !== 'object_array' && (
                                        <label htmlFor={field.key} className="block text-sm font-bold text-gray-700 mb-2">
                                            {field.label}
                                        </label>
                                    )}
                                    <FieldRenderer 
                                        field={field} 
                                        value={getNestedValue(globalState || {}, field.key)} 
                                        onChange={onChange} 
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </div>
            </Accordion>
        </Card>
    );
});

// --- Main Page Component ---

const AdminContentManagementPage: React.FC = () => {
    const { sectionKey } = useParams<{ sectionKey: string }>();
    const pageConfig = pageConfigs.find(p => p.key === sectionKey);

    const { data: siteContent, isLoading: contentLoading } = useAdminSiteContent();
    const { siteBranding, setSiteBranding, loading: brandingLoading } = useProduct();
    const { updateSiteContent } = useContentMutations();

    const [combinedState, setCombinedState] = useState<any>(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Initialize
    useEffect(() => {
        if (siteContent && siteBranding) {
            // Re-initialize if combinedState is null OR if sectionKey changed (handled by key prop in Layout)
            // But we keep this check for safety
            if (!combinedState) {
                setCombinedState({
                    ...siteContent,
                    siteBranding: siteBranding 
                });
            }
        }
    }, [siteContent, siteBranding, combinedState]);

    const handleFieldChange = useCallback((path: string, value: any) => {
        setCombinedState((prev: any) => {
            try {
                return setNestedValue(prev || {}, path, value);
            } catch (error) {
                console.error("Error updating field:", path, error);
                return prev;
            }
        });
        setHasChanges(true);
    }, []);

    const handleSave = async () => {
        if (combinedState) {
            const { siteBranding: newBranding, ...newContent } = combinedState;
            const promises = [];
            promises.push(updateSiteContent.mutateAsync(newContent));
            if (newBranding) {
                promises.push(setSiteBranding(newBranding));
            }
            await Promise.all(promises);
            setHasChanges(false);
        }
    };

    if (!pageConfig && !contentLoading) return null;
    
    // Strict loading check: If data is loading OR we haven't initialized state yet, show loader.
    // This prevents rendering empty forms that collapse the layout height.
    if (contentLoading || brandingLoading || !combinedState) {
        return <PageLoader text="جاري تحميل المحتوى..." />;
    }

    return (
        <div className="animate-fadeIn max-w-5xl mx-auto pb-20" style={{ overflowAnchor: 'none' }}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sticky top-0 z-20 bg-background/95 backdrop-blur p-4 border-b -mx-6 px-6 shadow-sm">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-2">
                        {pageConfig?.icon}
                        {pageConfig?.title}
                    </h1>
                    <p className="text-muted-foreground mt-1">{pageConfig?.description}</p>
                </div>
                <Button onClick={handleSave} loading={updateSiteContent.isPending} size="lg" icon={<Save />} disabled={!hasChanges}>
                    {updateSiteContent.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Button>
            </div>

            {/* Sections */}
            <div className="space-y-8">
                {combinedState && pageConfig?.sections.map(section => (
                    <SectionRenderer 
                        key={section.key} 
                        section={section} 
                        globalState={combinedState} 
                        onChange={handleFieldChange} 
                    />
                ))}
            </div>
        </div>
    );
};

export default AdminContentManagementPage;
