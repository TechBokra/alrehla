import React from 'react';
import { MessageSquare, FileCheck2, Award, BookUp, Sparkles, Palette, Mic, Users, Video } from 'lucide-react';

export const IconMap: { [key: string]: React.ReactNode } = {
    'MessageSquare': <MessageSquare size={24} />,
    'FileCheck2': <FileCheck2 size={24} />,
    'Award': <Award size={24} />,
    'BookUp': <BookUp size={24} />,
    'Palette': <Palette size={24} />,
    'Mic': <Mic size={24} />,
    'Users': <Users size={24} />,
    'Video': <Video size={24} />,
    'default': <Sparkles size={24} />
};