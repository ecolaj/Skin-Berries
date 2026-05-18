import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/supabase';

type Notification = Database['public']['Tables']['notifications']['Row'];

export const NotificationBell = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) return;

        // Fetch initial notifications
        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (data && !error) {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.is_read).length);
            }
        };

        fetchNotifications();

        // Add lightweight polling fallback (every 10 seconds)
        const pollInterval = setInterval(fetchNotifications, 10000);

        // Listen for local notifications update events (for instant UI updates)
        window.addEventListener('notifications_updated', fetchNotifications);

        // Subscribe to real-time changes
        const subscription = supabase
            .channel('notifications-channel')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setNotifications(prev => {
                            const updated = [payload.new as Notification, ...prev];
                            setUnreadCount(updated.filter(n => !n.is_read).length);
                            return updated;
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        setNotifications(prev => {
                            const updated = prev.map(n => n.id === payload.new.id ? payload.new as Notification : n);
                            setUnreadCount(updated.filter(n => !n.is_read).length);
                            return updated;
                        });
                    } else if (payload.eventType === 'DELETE') {
                        setNotifications(prev => {
                            const updated = prev.filter(n => n.id !== payload.old.id);
                            setUnreadCount(updated.filter(n => !n.is_read).length);
                            return updated;
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
            clearInterval(pollInterval);
            window.removeEventListener('notifications_updated', fetchNotifications);
        };
    }, [user]);

    // Handle outside click to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const markAsRead = async (id: string) => {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        window.dispatchEvent(new Event('notifications_updated'));
    };

    const markAllAsRead = async () => {
        if (!user) return;
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
        window.dispatchEvent(new Event('notifications_updated'));
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }
        setIsOpen(false);
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const deleteNotification = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await supabase.from('notifications').delete().eq('id', id);
        window.dispatchEvent(new Event('notifications_updated'));
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:text-skin-accent hover:bg-slate-100 rounded-xl transition-all"
                aria-label="Notificaciones"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white shadow-sm">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[100] animate-fadeIn origin-top-right">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-bold text-slate-800">Notificaciones</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs font-medium text-skin-accent hover:text-skin-dark flex items-center gap-1"
                            >
                                <Check size={14} /> Marcar todas leídas
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <Bell className="mx-auto mb-3 opacity-20" size={32} />
                                <p className="text-sm">No tienes notificaciones</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 group flex gap-3 ${!notif.is_read ? 'bg-skin-blush/20' : ''}`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-sm ${!notif.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                                    {notif.title}
                                                </h4>
                                                {!notif.is_read && (
                                                    <span className="w-2 h-2 rounded-full bg-skin-accent mt-1.5 shrink-0" />
                                                )}
                                            </div>
                                            <p className={`text-xs mb-2 line-clamp-2 ${!notif.is_read ? 'text-slate-600' : 'text-slate-500'}`}>
                                                {notif.message}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                                    {new Date(notif.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {notif.link && (
                                                        <span className="text-skin-accent hover:text-skin-dark p-1">
                                                            <ExternalLink size={14} />
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={(e) => deleteNotification(e, notif.id)}
                                                        className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                                                        aria-label="Eliminar"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
