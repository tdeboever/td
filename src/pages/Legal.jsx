import { useState } from 'react'

function PrivacyContent() {
  return (
    <>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Privacy Policy</h2>
      <p><strong>Last updated:</strong> April 12, 2026</p>

      <h3>What we collect</h3>
      <p>When you sign in with Google, we receive your email address, display name, and profile photo. We store your tasks, notes, spaces, and lists to provide the service.</p>

      <h3>How we use it</h3>
      <p>Your data is used solely to operate Whim. We do not sell, share, or monetize your personal information. Tasks and notes are stored in a secure database and associated with your account.</p>

      <h3>Push notifications</h3>
      <p>If you enable notifications, we store a push subscription endpoint and your timezone to deliver task reminders. You can disable notifications at any time through your browser or device settings.</p>

      <h3>Data storage</h3>
      <p>Your data is stored on Supabase (hosted on AWS) with row-level security ensuring only you can access your own data. Data is also cached locally on your device for offline access.</p>

      <h3>Data deletion</h3>
      <p>You can delete individual tasks, notes, and spaces at any time. To delete your account and all associated data, contact us at the email below.</p>

      <h3>Cookies</h3>
      <p>We use essential cookies only for authentication. No tracking or advertising cookies are used.</p>

      <h3>Contact</h3>
      <p>Questions? Email whim@thesportsheroes.com</p>
    </>
  )
}

function TermsContent() {
  return (
    <>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Terms of Service</h2>
      <p><strong>Last updated:</strong> April 12, 2026</p>

      <h3>Acceptance</h3>
      <p>By using Whim, you agree to these terms. If you disagree, please don't use the service.</p>

      <h3>The service</h3>
      <p>Whim is a personal task management app. We provide it as-is and make no guarantees about uptime or data preservation, though we make reasonable efforts to keep things running.</p>

      <h3>Your data</h3>
      <p>You own your data. We don't claim any rights to your tasks, notes, or other content. You grant us permission to store and process it solely to provide the service.</p>

      <h3>Acceptable use</h3>
      <p>Don't abuse the service, attempt to access other users' data, or use automated tools to overload our systems.</p>

      <h3>Termination</h3>
      <p>We may suspend accounts that violate these terms. You can stop using Whim at any time.</p>

      <h3>Limitation of liability</h3>
      <p>Whim is provided without warranty. We are not liable for any data loss or damages arising from use of the service.</p>

      <h3>Changes</h3>
      <p>We may update these terms. Continued use after changes constitutes acceptance.</p>

      <h3>Contact</h3>
      <p>Questions? Email whim@thesportsheroes.com</p>
    </>
  )
}

export default function Legal({ onBack }) {
  const [tab, setTab] = useState('privacy')

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)' }}>
      <header className="flex items-center gap-4 safe-top" style={{ padding: '16px 20px 12px' }}>
        <button onClick={onBack} style={{ fontSize: 14, color: 'var(--text-ghost)' }}>← Back</button>
        <div className="flex gap-3">
          <button onClick={() => setTab('privacy')}
            style={{ fontSize: 13, fontWeight: tab === 'privacy' ? 600 : 400, color: tab === 'privacy' ? 'var(--text-primary)' : 'var(--text-ghost)' }}>
            Privacy
          </button>
          <button onClick={() => setTab('terms')}
            style={{ fontSize: 13, fontWeight: tab === 'terms' ? 600 : 400, color: tab === 'terms' ? 'var(--text-primary)' : 'var(--text-ghost)' }}>
            Terms
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: '0 20px 40px' }}>
        <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
          <style>{`
            h3 { font-size: 14px; font-weight: 600; color: var(--text-primary); margin: 16px 0 6px; }
            p { margin-bottom: 8px; }
          `}</style>
          {tab === 'privacy' ? <PrivacyContent /> : <TermsContent />}
        </div>
      </main>
    </div>
  )
}
