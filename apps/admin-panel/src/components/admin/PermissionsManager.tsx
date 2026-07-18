
import React, { useState, useEffect } from 'react';
import { useAdminRolePermissions } from '../../hooks/queries/admin/useAdminSettingsQuery';
import { useSettingsMutations } from '../../hooks/mutations/useSettingsMutations';
import { roleNames, permissionKeys, permissionLabels, UserRole, Permissions, defaultPermissions, permissionsByRole } from '../../lib/roles';
import PageLoader from '@alrehla/ui/page-loader';
import { Button } from '@alrehla/ui/button';
import { Save, ShieldCheck, AlertCircle } from 'lucide-react';
import { Checkbox } from '@alrehla/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@alrehla/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@alrehla/ui/table';

const PermissionsManager: React.FC = () => {
    const { data: initialPermissions, isLoading: permissionsLoading, error } = useAdminRolePermissions();
    const { updateRolePermissions } = useSettingsMutations();
    
    // الحالة المحلية لإدارة التعديلات
    const [permissions, setPermissions] = useState<Record<UserRole, Permissions>>(permissionsByRole);

    useEffect(() => {
        if (initialPermissions && Object.keys(initialPermissions).length > 0) {
            // دمج الصلاحيات القادمة من قاعدة البيانات مع الصلاحيات الافتراضية لضمان عدم وجود حقول ناقصة
            const mergedPermissions = { ...permissionsByRole };
            Object.keys(initialPermissions).forEach(role => {
                if (mergedPermissions[role as UserRole]) {
                    mergedPermissions[role as UserRole] = {
                        ...mergedPermissions[role as UserRole],
                        ...(initialPermissions as any)[role]
                    };
                }
            });
            setPermissions(mergedPermissions);
        }
    }, [initialPermissions]);

    const handlePermissionChange = (role: UserRole, permission: keyof Permissions, isChecked: boolean) => {
        setPermissions(prev => ({
            ...prev,
            [role]: {
                ...prev[role],
                [permission]: isChecked
            }
        }));
    };
    
    const handleSave = () => {
        updateRolePermissions.mutate(permissions);
    };

    if (permissionsLoading) {
        return <PageLoader text="جاري تحميل مصفوفة الصلاحيات..." />;
    }
    
    // الأدوار التي تظهر في الجدول (نستثني الأدوار غير الإدارية)
    const rolesToManage = (Object.keys(roleNames) as UserRole[]).filter(role => 
        !['user', 'student', 'parent'].includes(role)
    );
    
    return (
        <div className="space-y-6 animate-fadeIn">
            <Card>
                <CardHeader className="bg-primary/5 border-b">
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="text-primary" /> إدارة صلاحيات النظام
                    </CardTitle>
                    <CardDescription>
                        تحكم بدقة في ما يمكن لكل دور وظيفي القيام به. التغييرات هنا تؤثر فوراً على واجهات المشرفين والمدربين.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="overflow-x-auto border rounded-xl shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="sticky left-0 bg-muted/80 backdrop-blur z-20 font-black min-w-[200px] border-l">الصلاحية الوظيفية</TableHead>
                                    {rolesToManage.map(role => (
                                        <TableHead key={role} className="text-center font-bold text-foreground min-w-[120px]">{roleNames[role]}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {permissionKeys.map(permission => (
                                    <TableRow key={permission} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="sticky left-0 bg-white z-10 font-semibold text-gray-700 border-l shadow-sm">
                                            {permissionLabels[permission]}
                                        </TableCell>
                                        {rolesToManage.map(role => (
                                            <TableCell key={`${role}-${permission}`} className="text-center">
                                                <Checkbox
                                                    checked={!!permissions[role]?.[permission]}
                                                    onCheckedChange={(isChecked) => handlePermissionChange(role, permission, !!isChecked)}
                                                    disabled={role === 'super_admin'} // الأدمن العام يمتلك كل الصلاحيات دائماً
                                                    className={role === 'super_admin' ? 'opacity-50 grayscale' : ''}
                                                />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {error && (
                         <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
                            <AlertCircle size={16} />
                            <span>فشل جلب البيانات المحدثة من السيرفر، يتم عرض البيانات المحلية.</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center mt-8 pt-6 border-t">
                        <p className="text-xs text-muted-foreground italic">
                            * دور "مدير النظام" يمتلك كافة الصلاحيات بشكل افتراضي ولا يمكن تعديله لأسباب أمنية.
                        </p>
                        <Button 
                            onClick={handleSave} 
                            loading={updateRolePermissions.isPending} 
                            icon={<Save />}
                            size="lg"
                            className="shadow-lg min-w-[200px]"
                        >
                            حفظ توزيع الصلاحيات
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PermissionsManager;
