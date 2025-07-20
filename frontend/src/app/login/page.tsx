import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-networthyBlue to-networthyGreen">
      <div className="bg-white/90 rounded-2xl shadow-xl p-10 w-full max-w-md flex flex-col items-center">
        <div className="mb-8 flex flex-col items-center">
          <Image src="/NETWORTHY.png" alt="Networthy Logo" width={64} height={64} className="rounded-full mb-2" />
          <h1 className="text-3xl font-bold text-black mb-2">Sign in to Networthy</h1>
          <p className="text-gray-600 text-center">Connect your creator accounts to get started</p>
        </div>
        <div className="flex flex-col gap-4 w-full">
          <Link href="http://localhost:4000/api/auth/google" className="flex items-center gap-3 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors justify-center">
            <Image src="/youtube-svgrepo-com.svg" alt="YouTube/Google" width={24} height={24} className="bg-white rounded-full" />
            Continue with YouTube
          </Link>
          <Link href="http://localhost:4000/api/auth/twitch" className="flex items-center gap-3 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors justify-center">
            <Image src="/twitch-svgrepo-com.svg" alt="Twitch" width={24} height={24} className="bg-white rounded-full" />
            Continue with Twitch
          </Link>
          <Link href="http://localhost:4000/api/auth/tiktok" className="flex items-center gap-3 bg-black hover:bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold transition-colors justify-center">
            <Image src="/tiktok-svgrepo-com.svg" alt="TikTok" width={24} height={24} className="bg-white rounded-full" />
            Continue with TikTok
          </Link>
        </div>
      </div>
    </div>
  );
} 