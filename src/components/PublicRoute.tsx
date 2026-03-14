import { useAuth } from '../context/AuthContext'

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh'
      }}>
        <div style={{
          width: '32px', height: '32px',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #185FA5',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (session) {
    window.location.replace('/perfiles');
    return null;
  }

  return <>{children}</>
}
