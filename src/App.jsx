// React imports: useEffect manages side effects and useState stores local component state.
import { useEffect, useState } from 'react'

// Supabase client configured with your project URL and public anon key.
import { supabase } from './supabaseClient'

// App-specific styles for the tracker UI.
import './App.css'

// Component imports for different app sections.
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'

const getPageFromPath = () => {
  if (window.location.pathname === '/about') return 'about'
  if (window.location.pathname === '/login') return 'login'
  if (window.location.pathname === '/dashboard') return 'dashboard'
  return 'home'
}

function App() {
  // Track the logged-in Supabase session. null means no user is signed in.
  const [session, setSession] = useState(null)
  const [page, setPage] = useState(getPageFromPath)

  // Simple auth form fields.
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Job application list for the current user.
  const [jobs, setJobs] = useState([])

  // Form fields for adding a new job.
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [status, setStatus] = useState('Applied')
  const [notes, setNotes] = useState('')

  // UI state: error messages and loading indicator.
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

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

  // Fetch jobs from Supabase for the current user.
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

  // On component load, check whether a user is signed in and subscribe to auth changes.
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

  // Handle either sign up or sign in depending on the button pressed.
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
        ? await supabase.auth.signUp({ email, password })
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

    // If sign-in is successful, keep the session and load jobs.
    const session = response.data?.session
    setSession(session)
    if (session) {
      await fetchJobs(session.user.id)
      window.history.replaceState({}, '', '/dashboard')
      setPage('dashboard')
    }

    setLoading(false)
  }

  // Log the user out and clear app state.
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setJobs([])
    navigateTo('home')
  }

  // Add a new application row to the user's job table.
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

  // Update the status value for one existing job application.
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

  // Keep the landing page public, and show auth only when the visitor chooses to continue.
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
              <a className="learn-button" href="#features">Learn more <span aria-hidden="true">↓</span></a>
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

  // If there is no authenticated session, show the sign in / sign up screen.
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
    />
  )
}

export default App
