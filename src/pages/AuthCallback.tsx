import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Wait for Supabase to process the OAuth tokens from URL hash
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (window.opener !== null) {
        // We are inside a popup - notify parent and close explicitly without COOP cross-origin warnings
        const channel = new BroadcastChannel('supabase-oauth');
        channel.postMessage('oauth-complete');
        channel.close();
        window.close();
      } else {
        // Normal redirect flow (fallback for mobile environments or rigorously blocked popups)
        window.location.replace(session ? '/perfiles' : '/login');
      }
    };

    handleCallback();
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
