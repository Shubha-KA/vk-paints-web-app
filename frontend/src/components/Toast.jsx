import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--bg-surface)',
          color: 'var(--text-main)',
          border: '1px solid var(--border-color)',
          borderRadius: '0.75rem',
          boxShadow: '0 10px 15px -3px var(--shadow-color)',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.875rem',
          fontWeight: '500',
          padding: '0.75rem 1rem',
          maxWidth: '380px',
        },
        success: {
          iconTheme: { primary: '#10B981', secondary: '#fff' },
          style: {
            borderLeft: '4px solid #10B981',
          },
        },
        error: {
          iconTheme: { primary: '#EF4444', secondary: '#fff' },
          style: {
            borderLeft: '4px solid #EF4444',
          },
        },
        loading: {
          iconTheme: { primary: '#4F46E5', secondary: '#fff' },
          style: {
            borderLeft: '4px solid #4F46E5',
          },
        },
      }}
    />
  );
}
