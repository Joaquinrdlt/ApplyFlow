import { useEffect, useState } from 'react'

import { supabase } from './supabaseClient'

import './App.css'

import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import ThemeToggle from './components/ThemeToggle'

// Resolve the current URL for initial load and browser back/forward navigation.
const getPageFromPath = () => {
  if (window.location.pathname === '/about') return 'about'
  if (window.location.pathname === '/login') return 'login'
  if (window.location.pathname === '/dashboard') return 'dashboard'
  return 'home'
}

const getInitialAppearance = () => {
  const systemTheme = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'

  try {
    const savedTheme = window.localStorage.getItem('applyflow-theme')
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return { theme: savedTheme, followsSystem: false }
    }
  } catch {
    // Continue with the system theme when storage is unavailable.
  }

  return { theme: systemTheme, followsSystem: true }
}

function App() {
  const [appearance, setAppearance] = useState(getInitialAppearance)
  const { theme, followsSystem } = appearance
  // Remains null until Supabase restores or establishes a signed-in session.
  const [session, setSession] = useState(null)
  const [page, setPage] = useState(getPageFromPath)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Applications loaded for the signed-in user.
  const [jobs, setJobs] = useState([])

  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [status, setStatus] = useState('Applied')
  const [notes, setNotes] = useState('')

  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    if (!followsSystem) return

    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mediaQuery) return

    const syncWithSystem = (event) => {
      setAppearance((current) => ({
        ...current,
        theme: event.matches ? 'dark' : 'light',
      }))
    }

    mediaQuery.addEventListener('change', syncWithSystem)
    return () => mediaQuery.removeEventListener('change', syncWithSystem)
  }, [followsSystem])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    try {
      window.localStorage.setItem('applyflow-theme', nextTheme)
    } catch {
      // The selection still applies until this page is closed.
    }
    setAppearance({ theme: nextTheme, followsSystem: false })
  }

  // Keep the URL and rendered page in sync without a routing library.
  const navigateTo = (nextPage) => {
    const path =
      nextPage === 'about'
        ? '/about'
        : nextPage === 'login'
          ? '/login'
          : nextPage === 'dashboard'
            ? '/dashboard'
            : '/'
    if (window.location.pathname !== path || window.location.hash) {
      window.history.pushState({}, '', path)
    }
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const handlePopState = () => {
      setPage(getPageFromPath())
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Fetch only this user's applications, newest first.
  const fetchJobs = async (userId) => {
    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      return
    }

    setJobs(data || [])
  }

  // Restore the saved session and keep React state in sync with future auth changes.
  useEffect(() => {
    const getSession = async () => {
      const result = await supabase.auth.getSession()
      const session = result.data?.session

      if (result.error) {
        setError(result.error.message)
        return
      }

      setSession(session)
      if (session) {
        fetchJobs(session.user.id)
      }
    }

    getSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session)
      if (session) {
        fetchJobs(session.user.id)
      } else {
        setJobs([])
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  // Share validation and loading behavior between sign-in and sign-up.
  const handleAuth = async (mode) => {
    setLoading(true)
    setError(null)

    if (!email || !password) {
      setError('Please enter both email and password.')
      setLoading(false)
      return
    }

    const response =
      mode === 'signup'
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: 'https://main.d2zlm9rvcs7zyv.amplifyapp.com/login',
            },
          })
        : await supabase.auth.signInWithPassword({ email, password })

    if (response.error) {
      setError(response.error.message)
      setLoading(false)
      return
    }

    if (mode === 'signup' && !response.data?.session) {
      setError('Sign-up completed. Check your email and confirm your account before signing in.')
      setLoading(false)
      return
    }

    const session = response.data?.session
    setSession(session)
    if (session) {
      await fetchJobs(session.user.id)
      window.history.replaceState({}, '', '/dashboard')
      setPage('dashboard')
    }

    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setJobs([])
    navigateTo('home')
  }

  const handleAddJob = async (event) => {
    event.preventDefault()
    setError(null)

    if (!company || !position) {
      setError('Company and position are required.')
      return
    }

    setLoading(true)
    const { error } = await supabase.from('job_applications').insert([
      {
        user_id: session.user.id,
        company,
        position,
        status,
        notes,
      },
    ])

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setCompany('')
    setPosition('')
    setStatus('Applied')
    setNotes('')
    await fetchJobs(session.user.id)
    setLoading(false)
  }

  // Persist a status change and refresh the list from Supabase.
  const handleStatusChange = async (jobId, nextStatus) => {
    setLoading(true)
    const { error } = await supabase
      .from('job_applications')
      .update({ status: nextStatus })
      .eq('id', jobId)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    await fetchJobs(session.user.id)
    setLoading(false)
  }

  if (page === 'about') {
    return (
      <main className="landing-page about-page">
        <header className="site-header">
          <a className="brand-button" href="/" onClick={(event) => { event.preventDefault(); navigateTo('home') }}>
            <span className="brand-mark" aria-hidden="true">A</span>
            <span>ApplyFlow</span>
          </a>
          <nav className="site-nav" aria-label="Main navigation">
            <a className="nav-about" href="/about" aria-current="page">About</a>
            <button className="login-button" onClick={() => navigateTo(session ? 'dashboard' : 'login')}>
              {session ? 'Dashboard' : 'Login'}
            </button>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </nav>
        </header>

        <section className="about-hero" aria-labelledby="about-title">
          <div className="about-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> A LITTLE MORE CLARITY</p>
            <h1 id="about-title">A more thoughtful way to track your job search.</h1>
            <p className="hero-description">
              Applying for work asks you to keep a lot in motion. ApplyFlow gives every opportunity a place, so you can focus on the next step instead of searching through scattered notes.
            </p>
          </div>
          <aside className="about-note">
            <span className="about-note-index">01 <span>/ 04</span></span>
            <p>One clear place for the roles, updates, and details that move your search forward.</p>
            <span className="about-note-rule" />
            <span className="about-note-caption">BUILT AROUND YOUR NEXT STEP</span>
          </aside>
        </section>

        <section className="about-values" aria-labelledby="about-values-title">
          <div className="about-values-heading">
            <p className="eyebrow">THE SEARCH, SIMPLIFIED</p>
            <h2 id="about-values-title">Keep your attention on what’s next.</h2>
          </div>
          <article className="about-value">
            <span className="feature-number">01</span>
            <h3>Everything in one place</h3>
            <p>Collect company names, roles, statuses, and notes in a single view you can return to.</p>
          </article>
          <article className="about-value">
            <span className="feature-number">02</span>
            <h3>A clearer sense of progress</h3>
            <p>See which applications are moving, which need a follow-up, and how far you’ve come.</p>
          </article>
          <article className="about-value">
            <span className="feature-number">03</span>
            <h3>Made for the real details</h3>
            <p>Keep the useful context close, from interview updates to the small reminders you’d otherwise forget.</p>
          </article>
        </section>

        <section className="about-cta">
          <p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
          <h2>Make room for forward motion.</h2>
          <button className="primary-button" onClick={() => navigateTo(session ? 'dashboard' : 'login')}>
            {session ? 'Go to dashboard' : 'Get started'} <span aria-hidden="true">↗</span>
          </button>
        </section>
        <footer className="site-footer"><span>ApplyFlow</span><span>Make room for what’s next.</span></footer>
      </main>
    )
  }

  // Keep the home page public; authentication starts only when requested.
  if (page === 'home') {
    return (
      <main className="landing-page" id="home">
        <header className="site-header">
          <a className="brand-button" href="/" onClick={(event) => { event.preventDefault(); navigateTo('home') }}>
            <span className="brand-mark" aria-hidden="true">A</span>
            <span>ApplyFlow</span>
          </a>
          <nav className="site-nav" aria-label="Main navigation">
            <a className="nav-about" href="/about" onClick={(event) => { event.preventDefault(); navigateTo('about') }}>About</a>
            <button className="login-button" onClick={() => navigateTo(session ? 'dashboard' : 'login')}>
              {session ? 'Dashboard' : 'Login'}
            </button>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </nav>
        </header>

        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> YOUR NEXT CHAPTER, ORGANIZED</p>
            <h1 id="hero-title">Track Your Job <span>Applications</span></h1>
            <p className="hero-description">
              Every opportunity, one clear view. Keep your search moving without losing track of the details.
            </p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => navigateTo(session ? 'dashboard' : 'login')}>
                {session ? 'Go to dashboard' : 'Get started'} <span aria-hidden="true">↗</span>
              </button>
              <a className="learn-button" href="/about">Learn more <span aria-hidden="true">↓</span></a>
            </div>
            <p className="hero-note">A calmer way to keep your search in motion.</p>
          </div>

          <div className="preview-wrap" aria-label="Preview of the application tracker">
            <div className="preview-topline">
              <span>YOUR SEARCH</span>
              <span className="preview-period"><span /> LIVE OVERVIEW</span>
            </div>
            <div className="preview-heading">
              <div>
                <p>Good things are in progress.</p>
                <h2>Application board</h2>
              </div>
              <span className="preview-count">06</span>
            </div>
            <div className="preview-stats">
              <div><strong>06</strong><span>Applications</span></div>
              <div><strong>03</strong><span>In progress</span></div>
              <div><strong>02</strong><span>Interviews</span></div>
            </div>
            <div className="preview-list-heading"><span>RECENT ACTIVITY</span><span>STATUS</span></div>
            <div className="preview-row">
              <span className="company-mark mark-one">N</span><span className="company-name">Northstar</span><span className="status-pill status-interview">Interview</span>
            </div>
            <div className="preview-row">
              <span className="company-mark mark-two">F</span><span className="company-name">Fieldwork</span><span className="status-pill status-review">In review</span>
            </div>
            <div className="preview-row">
              <span className="company-mark mark-three">M</span><span className="company-name">Monday Studio</span><span className="status-pill status-applied">Applied</span>
            </div>
            <div className="preview-footer"><span className="footer-spark" aria-hidden="true">↗</span> Small steps add up. Keep going.</div>
          </div>
        </section>

        <section className="features-section" id="features" aria-labelledby="features-title">
          <div className="features-intro">
            <p className="eyebrow">MADE FOR THE WHOLE SEARCH</p>
            <h2 id="features-title">Less juggling.<br />More forward motion.</h2>
          </div>
          <div className="feature-item">
            <span className="feature-number">01</span>
            <h3>Organize Applications</h3>
            <p>Keep every role and company together in one tidy place.</p>
          </div>
          <div className="feature-item">
            <span className="feature-number">02</span>
            <h3>Track Status</h3>
            <p>Know what you applied to and what needs your attention.</p>
          </div>
          <div className="feature-item">
            <span className="feature-number">03</span>
            <h3>Visualize Progress</h3>
            <p>See your momentum clearly as opportunities move along.</p>
          </div>
          <div className="feature-item">
            <span className="feature-number">04</span>
            <h3>Add Notes</h3>
            <p>Save the little details that make every follow-up easier.</p>
          </div>
        </section>
        <footer className="site-footer"><span>ApplyFlow</span><span>Make room for what’s next.</span></footer>
      </main>
    )
  }

  // Protected routes require a signed-in session.
  if (!session) {
    return (
      <Auth
        onHome={() => navigateTo('home')}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        error={error}
        loading={loading}
        handleAuth={handleAuth}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    )
  }

  return (
    <Dashboard
      session={session}
      jobs={jobs}
      company={company}
      setCompany={setCompany}
      position={position}
      setPosition={setPosition}
      status={status}
      setStatus={setStatus}
      notes={notes}
      setNotes={setNotes}
      error={error}
      loading={loading}
      handleSignOut={handleSignOut}
      handleAddJob={handleAddJob}
      handleStatusChange={handleStatusChange}
      onHome={() => navigateTo('home')}
      onAbout={() => navigateTo('about')}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  )
}

export default App
