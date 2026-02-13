import { useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';

// 15 minutes in milliseconds
const TIMEOUT_MS = 15 * 60 * 1000;

export function AutoLogout() {
    const { user, signOut } = useAuth();
    const timerRef = useRef<any>(null);

    // Reset the timer on user activity
    const resetTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        if (user) {
            timerRef.current = setTimeout(() => {
                console.log('AutoLogout: User inactive for too long, signing out...');
                signOut();
                // Opcional: Redirecionar ou mostrar alerta é tratado pelo AuthContext/App state change
                alert('Sessão expirada por inatividade. Por favor, faça login novamente.');
            }, TIMEOUT_MS);
        }
    };

    useEffect(() => {
        // Only activate listener if user is logged in
        if (!user) return;

        console.log('AutoLogout: Monitoring activity...');
        resetTimer(); // Start initial timer

        // Events to monitor
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

        const handleActivity = () => {
            resetTimer();
        };

        // Attach listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        // Cleanup
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [user, signOut]);

    return null; // This component doesn't render anything
}
