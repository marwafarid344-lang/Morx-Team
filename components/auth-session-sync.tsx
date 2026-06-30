'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AuthSessionSync() {
  const router = useRouter();

  useEffect(() => {
    // Check for session cookie and sync to localStorage
    const syncSession = () => {
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(c => c.trim().startsWith('morx_session='));
      
      if (sessionCookie) {
        try {
          const cookieValue = sessionCookie.split('=')[1];
          const sessionData = JSON.parse(decodeURIComponent(cookieValue));
          

          
          // Sync to localStorage
          const localSession = {
            ...sessionData,
            user_id: sessionData.user_id || sessionData.id,
            first_name: sessionData.first_name || sessionData.firstName || '',
            last_name: sessionData.last_name || sessionData.lastName || '',
            profile_image: sessionData.profile_image || sessionData.profileImage || '',
            isLoggedIn: true
          };
          
          localStorage.setItem('student_session', JSON.stringify(localSession));
          localStorage.setItem('morx-user', JSON.stringify(localSession)); // Sync both keys for safety
          window.dispatchEvent(new CustomEvent('userLogin', { detail: localSession }));
          
          // Clear the cookie after syncing
          document.cookie = 'morx_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          

          
          // Refresh the page to update UI
          router.refresh();
        } catch (e) {
          console.error('[AuthSync] Error parsing session:', e);
        }
      }
    };

    syncSession();
  }, [router]);

  return null;
}
