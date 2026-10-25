/**
 * AgriTech Notification System
 * Handles WebSocket connection and real-time UI updates
 */

class NotificationManager {
    constructor(userId) {
        this.userId = userId;
        this.socket = null;
        this.notifications = [];
        this.unreadCount = 0;
        
        this.init();
    }

    init() {
        // 离线或 CDN 不可用时不能因为 io() 未定义阻断通知加载。
        if (typeof window.io === 'function') {
            this.socket = window.io();
            this.socket.on('connect', () => {
                if (this.userId) this.socket.emit('join_notifications', { user_id: this.userId });
            });
            this.socket.on('new_notification', (notification) => this.handleNewNotification(notification));
        }
        this.fetchNotifications();
    }

    async fetchNotifications() {
        if (!this.userId) return;

        try {
            const response = await fetch(`/api/v1/notifications/?user_id=${this.userId}`);
            const data = await response.json();
            
            if (data.status === 'success') {
                this.notifications = data.notifications;
                this.updateUnreadCount();
                this.renderNotifications();
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }

    handleNewNotification(notification) {
        this.notifications.unshift(notification);
        this.updateUnreadCount();
        this.renderNotifications();
        this.showToast(notification);
    }

    updateUnreadCount() {
        this.unreadCount = this.notifications.filter(n => !n.read_at).length;
        const badge = document.getElementById('notification-badge');
        if (badge) {
            badge.innerText = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'block' : 'none';
        }
    }

    renderNotifications() {
        const container = document.getElementById('notification-list');
        if (!container) return;

        container.innerHTML = '';
        
        if (this.notifications.length === 0) {
            container.innerHTML = '<div class="p-4 text-center text-gray-500">暂无通知</div>';
            return;
        }

        this.notifications.forEach(n => {
            const item = document.createElement('div');
            item.className = `p-4 border-b hover:bg-gray-50 cursor-pointer ${n.read_at ? 'opacity-60' : 'bg-blue-50'}`;
            item.innerHTML = `
                <div class="font-bold">${n.title}</div>
                <div class="text-sm">${n.message}</div>
                <div class="text-xs text-gray-400 mt-1">${new Date(n.sent_at).toLocaleString()}</div>
            `;
            item.onclick = () => this.markAsRead(n.id);
            container.appendChild(item);
        });
    }

    async markAsRead(notificationId) {
        try {
            const response = await fetch(`/api/v1/notifications/${notificationId}/read`, { method: 'POST' });
            const data = await response.json();
            
            if (data.status === 'success') {
                const n = this.notifications.find(notif => notif.id === notificationId);
                if (n) {
                    n.read_at = new Date().toISOString();
                    this.updateUnreadCount();
                    this.renderNotifications();
                }
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }

    showToast(notification) {
        // Implementation of a simple toast notification
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-white shadow-lg border-l-4 border-green-500 p-4 rounded z-50 animate-bounce';
        toast.innerHTML = `
            <div class="font-bold">${notification.title}</div>
            <div class="text-sm">${notification.message}</div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }
}

// In a real app, you would get this from the session/auth
// For demonstration, we'll try to find it in localStorage or use a default
const currentUser = JSON.parse(localStorage.getItem('user')) || { id: 1 };
const notificationManager = new NotificationManager(currentUser.id);
