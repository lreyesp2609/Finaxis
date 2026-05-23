import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();
  const completedRef = useRef(false);

  useEffect(() => {
    let subscription: any = null;
    let safetyTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleCallbackComplete = async () => {
      if (completedRef.current) return;
      completedRef.current = true;

      if (safetyTimeout) clearTimeout(safetyTimeout);
      if (subscription) subscription.unsubscribe();

      const { data: { session } } = await supabase.auth.getSession();

      if (window.opener !== null) {
        // We are inside a popup - notify parent and close explicitly without COOP cross-origin warnings
        const channel = new BroadcastChannel('supabase-oauth');
        channel.postMessage('oauth-complete');
        channel.close();
        window.close();
      } else {
        // Normal redirect flow (fallback for mobile environments or rigorously blocked popups)
        window.location.replace(session ? '/dashboard' : '/login');
      }
    };

    // Check if we already have a session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleCallbackComplete();
      }
    });

    // Listen for the SIGNED_IN event
    const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          handleCallbackComplete();
        }
      }
    );
    subscription = sub;

    // Safety timeout of 5 seconds (5000ms)
    safetyTimeout = setTimeout(() => {
      console.warn('[AuthCallback] Safety timeout reached. Attempting fallback session check.');
      handleCallbackComplete();
    }, 5000);

    return () => {
      if (safetyTimeout) clearTimeout(safetyTimeout);
      if (subscription) subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
      <div 
        style={{ 
          width: 36, 
          height: 36, 
          border: '3px solid #e5e7eb', 
          borderTopColor: '#185FA5', 
          borderRadius: '50%', 
          animation: 'spin 0.65s linear infinite' 
        }} 
      />
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
