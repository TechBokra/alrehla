import React, { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../contexts/ToastContext';

const NotificationListener: React.FC = () => {
    const { userId } = useAuth();
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio('https://cdn.freesound.org/previews/536/536108_10672036-lq.mp3');
        audioRef.current.volume = 0.6;
    }, []);

    useEffect(() => {
        if (!userId) return;

        const channelName = `notifications:user:${userId}`;
        
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const newNotification = payload.new as any;
                    queryClient.invalidateQueries({ queryKey: ['userNotifications'] });
                    addToast(newNotification.message, 'info');
                    
                    if (audioRef.current) {
                        const playPromise = audioRef.current.play();
                        if (playPromise !== undefined) {
                            playPromise.catch(e => {
                                console.warn("Audio play blocked (user interaction needed first):", e);
                            });
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, queryClient, addToast]); 

    return null; 
};

export default NotificationListener;
