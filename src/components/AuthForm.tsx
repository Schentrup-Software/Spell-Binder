import { useState } from 'react'
import pb from '../lib/pocketbase'
import { useErrorHandler } from '../hooks/useErrorHandler'
import { useLoadingState } from '../hooks/useLoadingState'
import LoadingSpinner from './LoadingSpinner'

export default function AuthForm() {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [name, setName] = useState('')

    const { handleError, handleSuccess } = useErrorHandler({ context: 'Authentication' })
    const { isLoading, withLoading } = useLoadingState()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!isLogin && password !== confirmPassword) {
            handleError(new Error('Passwords do not match'), 'Registration failed')
            return
        }

        if (!isLogin && password.length < 8) {
            handleError(new Error('Password must be at least 8 characters long'), 'Registration failed')
            return
        }

        try {
            if (isLogin) {
                // Login existing user
                await withLoading('auth', () =>
                    pb.collection('users').authWithPassword(email, password)
                )
                handleSuccess('Welcome back!')
            } else {
                // Register new user
                const userData = {
                    email,
                    password,
                    passwordConfirm: confirmPassword,
                    name,
                    emailVisibility: false
                }

                await withLoading('auth', () =>
                    pb.collection('users').create(userData)
                )

                // Automatically log in after registration
                await pb.collection('users').authWithPassword(email, password)
                handleSuccess('Account created successfully! Welcome!')
            }

            // Authentication will be automatically handled by PocketBase context
        } catch (err: any) {
            console.error('Authentication error:', err)

            if (err?.response?.data) {
                // Handle PocketBase validation errors
                const errorData = err.response.data
                if (errorData.email) {
                    handleError(new Error('Invalid email address'), isLogin ? 'Login failed' : 'Registration failed')
                } else if (errorData.password) {
                    handleError(new Error('Invalid password'), isLogin ? 'Login failed' : 'Registration failed')
                } else {
                    handleError(err, isLogin ? 'Login failed' : 'Registration failed')
                }
            } else {
                handleError(err, isLogin ? 'Login failed' : 'Registration failed')
            }
        }
    }

    const toggleMode = () => {
        setIsLogin(!isLogin)
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setName('')
    }

    if (isLoading('auth')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 text-center">
                    <LoadingSpinner size="large" />
                    <p className="text-gray-600">
                        {isLogin ? 'Signing you in...' : 'Creating your account...'}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
                        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {isLogin ? 'Sign in to your account' : 'Create your account'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Welcome to{' '}
                        <span className="font-medium text-blue-600">Spell Binder</span>
                        {' '}- Your Magic: The Gathering Collection Manager
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required={!isLogin}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="Enter your full name"
                                />
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Enter your email address"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete={isLogin ? "current-password" : "new-password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder={isLogin ? "Enter your password" : "Create a password (min 8 characters)"}
                            />
                        </div>

                        {!isLogin && (
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                    Confirm Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    required={!isLogin}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="Confirm your password"
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLogin ? 'Sign In' : 'Create Account'}
                        </button>
                    </div>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={toggleMode}
                            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                        >
                            {isLogin
                                ? "Don't have an account? Sign up"
                                : "Already have an account? Sign in"
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
