import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'

interface AuthUser {
  uid: string
  name: string
  email: string
  photoURL: string | null
  role: 'student' | 'teacher'
  isNewUser?: boolean // 새 학생 판별용
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  loginWithGoogle: (role: 'student' | 'teacher') => Promise<void>
  logout: () => Promise<void>
  updateUserName: (name: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
  updateUserName: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          const data = userSnap.data()
          setUser({
            uid: firebaseUser.uid,
            name: data.name || firebaseUser.displayName || '',
            email: data.email || firebaseUser.email || '',
            photoURL: firebaseUser.photoURL,
            role: data.role || 'student',
            isNewUser: data.isNewUser || false,
          })
        } else {
          setUser({
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL,
            role: 'student',
            isNewUser: true,
          })
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const loginWithGoogle = async (role: 'student' | 'teacher') => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const firebaseUser = result.user
      const email = firebaseUser.email || ''

      // 교사 권한 검증: allowed_teachers 컬렉션에서 이메일 확인
      if (role === 'teacher') {
        const teacherRef = doc(db, 'allowed_teachers', email)
        const teacherSnap = await getDoc(teacherRef)
        if (!teacherSnap.exists()) {
          await signOut(auth) // 로그인 취소
          throw new Error('등록되지 않은 교사 이메일입니다. 시스템 관리자에게 문의하세요.')
        }
      }

      // Firestore에 사용자 정보 저장/업데이트
      const userRef = doc(db, 'users', firebaseUser.uid)
      const userSnap = await getDoc(userRef)
      
      let isNewUser = false

      if (!userSnap.exists()) {
        isNewUser = true
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || '',
          email: email,
          role: role,
          createdAt: new Date(),
          approved: role === 'student',
          isNewUser: true,
        })
      } else {
        const data = userSnap.data()
        // 기존 역할과 선택한 역할이 다르면 거부 (예: 학생이 교사로 로그인 시도)
        if (data.role && data.role !== role) {
          await signOut(auth)
          throw new Error('선택한 역할(교사/학생)이 기존 가입된 역할과 다릅니다.')
        }
        isNewUser = data.isNewUser || false
      }

      setUser({
        uid: firebaseUser.uid,
        name: userSnap.exists() ? userSnap.data()?.name : (firebaseUser.displayName || ''),
        email: email,
        photoURL: firebaseUser.photoURL,
        role: role,
        isNewUser: isNewUser,
      })
    } catch (error) {
      console.error('로그인 실패:', error)
      throw error
    }
  }

  const updateUserName = async (name: string) => {
    if (!user) return
    const userRef = doc(db, 'users', user.uid)
    await updateDoc(userRef, { name: name, isNewUser: false })
    setUser({ ...user, name, isNewUser: false })
  }

  const logout = async () => {
    await signOut(auth)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, updateUserName }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
