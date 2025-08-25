import Link from 'next/link';

export default function SimpleLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-6xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          HackCubes CTF Platform
        </h1>
        <p className="text-xl text-gray-300 mb-12">
          Cybersecurity Training & Capture The Flag Challenges
        </p>
        
        <div className="space-x-4">
          <Link href="/auth/signup">
            <button className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold transition-colors">
              Sign Up
            </button>
          </Link>
          <Link href="/auth/signin">
            <button className="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-lg font-semibold transition-colors">
              Sign In
            </button>
          </Link>
        </div>
        
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Test the Complete Flow</h2>
          <p className="text-gray-400">
            Click "Sign Up" to test the fixed profile creation system.
          </p>
        </div>
      </div>
    </div>
  );
}
