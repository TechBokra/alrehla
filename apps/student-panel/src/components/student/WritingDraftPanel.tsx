"use client";


import React, { useState, useEffect } from 'react';
import { Textarea } from '@alrehla/ui/textarea';
import { Button } from '@alrehla/ui/button';
import { Save, CheckCircle, Lock, PenTool } from 'lucide-react';
import { useBookingMutations } from '../../hooks/mutations/useBookingMutations';

interface WritingDraftPanelProps {
    journeyId: string;
    canEdit: boolean; // This should be true ONLY for the student
    initialDraft?: string;
}

const WritingDraftPanel: React.FC<WritingDraftPanelProps> = ({ journeyId, canEdit, initialDraft }) => {
    const { updateBookingDraft } = useBookingMutations();
    const [draft, setDraft] = useState(initialDraft || '');
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    // Sync state with initialDraft when it loads from DB (e.g. after refresh)
    useEffect(() => {
        if (initialDraft && draft === '') {
            setDraft(initialDraft);
        }
    }, [initialDraft]); 

    const handleSaveDraft = async () => {
        try {
            await updateBookingDraft.mutateAsync({ bookingId: journeyId, draft });
            setLastSaved(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
        } catch (error) {
            // Error handling done in mutation hook
        }
    };

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className={`flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-3 rounded-lg border ${canEdit ? 'bg-yellow-50 border-yellow-100' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${canEdit ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-500'}`}>
                        {canEdit ? <PenTool size={18} /> : <Lock size={18} />}
                    </div>
                    <div>
                        <p className={`text-sm font-bold ${canEdit ? 'text-yellow-800' : 'text-gray-700'}`}>
                            {canEdit ? 'مساحة إبداعك (أنت البطل!)' : 'مسودة الطالب (للاطلاع فقط)'}
                        </p>
                        <p className={`text-xs ${canEdit ? 'text-yellow-700' : 'text-gray-500'}`}>
                            {canEdit 
                                ? 'هذه المساحة لك وحدك للكتابة. لا يمكن لولي الأمر أو المدرب التعديل هنا، لكن يمكنهم قراءة إبداعك.'
                                : 'هذه المساحة مخصصة للطالب للكتابة والتعبير عن نفسه. دورك هنا هو التشجيع والمتابعة.'
                            }
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {lastSaved && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={12}/> تم الحفظ {lastSaved}</span>}
                    
                    {canEdit && (
                        <Button onClick={handleSaveDraft} loading={updateBookingDraft.isPending} icon={<Save size={16}/>} disabled={!draft && !initialDraft} size="sm">
                            {updateBookingDraft.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </Button>
                    )}
                </div>
            </div>

            <Textarea
                placeholder={canEdit ? "ابدأ بكتابة قصتك هنا... أطلق العنان لخيالك!" : "لم يبدأ الطالب الكتابة بعد."}
                className={`flex-grow min-h-[400px] text-lg leading-loose p-6 shadow-inner border-2 transition-all ${
                    canEdit 
                    ? 'bg-white focus:border-primary/50' 
                    : 'bg-gray-50 text-gray-600 cursor-not-allowed border-gray-200 select-text'
                }`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={!canEdit || updateBookingDraft.isPending}
            />
        </div>
    );
};

export default WritingDraftPanel;
