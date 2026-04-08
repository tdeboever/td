export default function Login({ onSignIn }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-bg">
      <div className="animate-fade-in text-center">
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 48, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: 8 }}>Whim</h1>
        <p className="text-text-dim text-[13px] mb-10 tracking-wide">tasks, simplified</p>

        <button
          onClick={onSignIn}
          className="flex items-center gap-3 bg-surface border border-border/60 rounded-2xl px-7 py-3.5 text-[14px] text-text hover:bg-surface-hover hover:border-border-light transition-all duration-200 mx-auto"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Sign in with Google
        </button>

        <button
          onClick={() => window.location.reload()}
          className="mt-8 text-text-faint text-[11px] hover:text-text-dim transition-colors tracking-wide"
        >
          continue without account
        </button>
      </div>
    </div>
  )
}
