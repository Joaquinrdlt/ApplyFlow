// React imports: useEffect manages side effects and useState stores local component state.
import { useEffect, useState } from 'react'

// Supabase client configured with your project URL and public anon key.
import { supabase } from './supabaseClient'

// App-specific styles for the tracker UI.
import './App.css'

// Component imports for different app sections.
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'

function App() {
  // Track the logged-in Supabase session. null means no user is signed in.
  const [session, setSession] = useState(null)

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
    }

    setLoading(false)
  }

  // Log the user out and clear app state.
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setJobs([])
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

  // If there is no authenticated session, show the sign in / sign up screen.
  if (!session) {
    return (
      <Auth
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
    />
  )
}

export default App
