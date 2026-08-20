import React from 'react';

const InstructorFooter: React.FC = () => {
    return (
        <footer className="py-4 px-6 border-t bg-background text-center text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} منصة الرحلة التعليمية. جميع الحقوق محفوظة.</p>
        </footer>
    );
};

export default InstructorFooter;
