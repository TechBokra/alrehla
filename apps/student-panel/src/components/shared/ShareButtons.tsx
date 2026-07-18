"use client";

import React from 'react';
import { Facebook, Twitter, MessageCircle, Link as LinkIcon } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface ShareButtonsProps {
  title: string;
  url: string;
  theme?: 'light' | 'dark';
  label?: string;
}

const ShareButtons: React.FC<ShareButtonsProps> = React.memo(({ title, url, theme = 'light', label = "شارك:" }) => {
  const { addToast } = useToast();
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      addToast('تم نسخ الرابط بنجاح!', 'success');
    }, (err) => {
      addToast('فشل نسخ الرابط.', 'error');
      console.error('Could not copy text: ', err);
    });
  };

  const socialLinks = [
    { name: 'Facebook', icon: <Facebook size={18} />, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, color: 'bg-[#1877F2] hover:bg-[#166fe5]' },
    { name: 'Twitter', icon: <Twitter size={18} />, href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, color: 'bg-[#1DA1F2] hover:bg-[#1a91da]' },
    { name: 'WhatsApp', icon: <MessageCircle size={18} />, href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`, color: 'bg-[#25D366] hover:bg-[#20b759]' }
  ];
  
  const labelClass = theme === 'dark' ? 'text-white/90' : 'text-gray-600';
  const copyButtonClass = theme === 'dark' 
    ? 'text-white bg-white/20 hover:bg-white/30'
    : 'text-gray-700 bg-gray-200 hover:bg-gray-300';

  return (
    <div className="flex items-center gap-3">
      <span className={`text-sm font-semibold ${labelClass}`}>{label}</span>
      {socialLinks.map(link => (
        <a 
          key={link.name} 
          href={link.href} 
          target="_blank" 
          rel="noopener noreferrer" 
          aria-label={`Share on ${link.name}`}
          className={`w-8 h-8 flex items-center justify-center rounded-full text-white transition-colors ${link.color}`}
        >
          {link.icon}
        </a>
      ))}
      <button 
        onClick={handleCopyLink} 
        aria-label="Copy link"
        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${copyButtonClass}`}
      >
        <LinkIcon size={16} />
      </button>
    </div>
  );
});
ShareButtons.displayName = 'ShareButtons';

export default ShareButtons;