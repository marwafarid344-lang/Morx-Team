"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { User as UserType } from "@/lib/types/index"

export type User = UserType;

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  isLoading: boolean
  refreshSession: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const getSession = () => {
    // Helper to get cookie value
    const getCookie = (name: string): string | null => {
      const cookies = document.cookie.split(';')
      const cookie = cookies.find(c => c.trim().startsWith(name + '='))
      if (cookie) {
        return decodeURIComponent(cookie.split('=')[1])
      }
      return null
    }

    // Try to get session from cookie first
    const cookieSession = getCookie('morx_session')
    if (cookieSession) {
      try {
        const userData = JSON.parse(cookieSession)
        const normalizedUser: User = {
          // Use auth_user_id (UUID) as primary identifier
          auth_user_id: userData.auth_user_id || userData.id,
          first_name: userData.first_name || userData.firstName || '',
          last_name: userData.last_name || userData.lastName || '',
          email: userData.email,
          profile_image: userData.profile_image || userData.profileImage,
          study_level: userData.study_level,
          department: userData.department,
          faculty: userData.faculty,
          governorate: userData.governorate,
          bio: userData.bio,
          skills: userData.skills,
          is_available: userData.is_available,
          searching_teams_subjects: userData.searching_teams_subjects,
          links: userData.links,
        }
        // // console.log('[AuthContext] Extracted user from cookie:', normalizedUser.email, 'ID:', normalizedUser.auth_user_id);
        return normalizedUser
      } catch (error) {
        // // console.error('Error parsing cookie session:', error)
      }
    }

    // Fallback: Check localStorage
    const storedSession = localStorage.getItem('student_session') || localStorage.getItem('morx-user')
    if (storedSession) {
      try {
        const userData = JSON.parse(storedSession)
        
        // SELF-HEALING: If cookie is missing but localStorage exists, re-hydrate the cookie
        if (!getCookie('morx_session') && userData.auth_user_id) {
          // // console.log('[AuthContext] Re-hydrating morx_session cookie from localStorage');
          const cookieData = encodeURIComponent(JSON.stringify(userData));
          // Set cookie for 7 days
          document.cookie = `morx_session=${cookieData}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
        }

        const normalizedUser: User = {
          // Use auth_user_id (UUID) as primary identifier
          auth_user_id: userData.auth_user_id || userData.id,
          first_name: userData.first_name || userData.firstName || '',
          last_name: userData.last_name || userData.lastName || '',
          email: userData.email,
          profile_image: userData.profile_image || userData.profileImage,
          study_level: userData.study_level,
          department: userData.department,
          faculty: userData.faculty,
          governorate: userData.governorate,
          bio: userData.bio,
          skills: userData.skills,
          is_available: userData.is_available,
          searching_teams_subjects: userData.searching_teams_subjects,
          links: userData.links,
        }
        return normalizedUser
      } catch (error) {
        // // console.error('Error parsing session:', error)
      }
    }

    return null
  }

  // Helper to sync user to persistence layers
  const syncToStorage = (userData: User | null) => {
    if (userData && typeof window !== 'undefined') {
      const dataString = JSON.stringify(userData);
      localStorage.setItem('student_session', dataString);
      localStorage.setItem('morx-user', dataString);
      
      const cookieData = encodeURIComponent(dataString);
      document.cookie = `morx_session=${cookieData}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('student_session');
      localStorage.removeItem('morx-user');
      document.cookie = 'morx_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
  };

  // SMARTER setUser that merges profile fields to prevent data stripping
  const handleSetUser = (newVal: User | null | ((prev: User | null) => User | null)) => {
    setUser(prev => {
      let resolvedNewVal: User | null = null;
      if (typeof newVal === 'function') {
        resolvedNewVal = newVal(prev);
      } else {
        resolvedNewVal = newVal;
      }

      if (!resolvedNewVal) {
        syncToStorage(null);
        return null;
      }

      if (!prev) {
        syncToStorage(resolvedNewVal);
        return resolvedNewVal;
      }

      // Merge: Preserve existing profile fields if newVal is missing them
      const merged = {
        ...prev,
        ...resolvedNewVal,
        // specifically protect these fields
        department: resolvedNewVal.department ?? prev.department,
        faculty: resolvedNewVal.faculty ?? prev.faculty,
        governorate: resolvedNewVal.governorate ?? prev.governorate,
        study_level: resolvedNewVal.study_level ?? prev.study_level,
        bio: resolvedNewVal.bio ?? prev.bio,
        skills: resolvedNewVal.skills ?? prev.skills,
        is_available: resolvedNewVal.is_available ?? prev.is_available,
        searching_teams_subjects: resolvedNewVal.searching_teams_subjects ?? prev.searching_teams_subjects,
        links: resolvedNewVal.links ?? prev.links,
      };

      syncToStorage(merged);
      return merged;
    });
  };

  const syncGoogleProfileImage = async (authUserId: string, currentImage: string | undefined) => {
    if (currentImage) return; // Already has an image 
    if (!authUserId) return;

    try {
      const { createBrowserClient } = await import('@supabase/ssr')
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user?.user_metadata) {
        const googleImage = session.user.user_metadata.avatar_url || session.user.user_metadata.picture
        
        if (googleImage) {
          const res = await fetch('/api/users/sync-profile-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ auth_user_id: authUserId, profile_image: googleImage })
          })
          
          if (res.ok) {
            handleSetUser(prev => prev ? { ...prev, profile_image: googleImage } : null)
          }
        }
      }
    } catch (e) {
      // // console.error('[AuthContext] Profile image sync error:', e)
    }
  };

  const fetchLatestProfile = async () => {
    try {
      const res = await fetch('/api/users/profile')
      if (res.ok) {
        const result = await res.json()
        if (result.success && result.data) {
          handleSetUser(result.data)
          // Run image sync once after profile fetch (using auth_user_id)
          syncGoogleProfileImage(result.data.auth_user_id, result.data.profile_image)
        }
      }
    } catch (error) {
      // // console.error('[AuthContext] Failed to fetch latest profile:', error)
    }
  };

  const refreshSession = () => {
    const freshUser = getSession()
    handleSetUser(freshUser)
    if (freshUser) {
      fetchLatestProfile()
    }
  }

  useEffect(() => {
    // 1. Initial re-hydration from local storage for performance
    const localUser = getSession()
    if (localUser) {
      setUser(localUser)
    }
    
    // 2. ALWAYS verify with server to catch stale/partial data
    fetchLatestProfile()
    
    setIsLoading(false)

    // Listen for custom login events
    const handleUserLogin = () => refreshSession()
    window.addEventListener('userLogin', handleUserLogin)
    
    // Listen for storage changes
    window.addEventListener('storage', (e) => {
      if (e.key === 'student_session' || e.key === 'morx-user') {
        refreshSession()
      }
    })

    return () => {
      window.removeEventListener('userLogin', handleUserLogin)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser: handleSetUser, isLoading, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
