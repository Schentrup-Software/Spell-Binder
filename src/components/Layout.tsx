import { ReactNode } from 'react'
import Navigation from './Navigation'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      <main className="flex-1 container mx-auto px-3 md:px-4 py-4 md:py-8 pb-20 md:pb-8 max-w-7xl">
        {children}
      </main>
      <footer className="bg-white border-t py-3 md:py-4 text-center text-xs md:text-sm text-gray-500 mt-auto">
        <div className="container mx-auto px-3 md:px-4">
          Spell Binder &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  )
}