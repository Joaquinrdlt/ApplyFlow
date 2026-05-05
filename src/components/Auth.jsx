// Auth component handles sign in and sign up forms.
import PropTypes from 'prop-types'
import './Auth.css'

function Auth({ email, setEmail, password, setPassword, error, loading, handleAuth }) {
  return (
    <div className="app-shell">
      <div className="auth-card">
        <h1>Job Application Tracker</h1>
        <p className="subtitle">Sign in or sign up to save your job applications.</p>

        {error && <div className="error-box">{error}</div>}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter a password"
          />
        </label>

        <div className="button-row">
          <button onClick={() => handleAuth('signin')} disabled={loading}>
            Sign In
          </button>
          <button className="secondary" onClick={() => handleAuth('signup')} disabled={loading}>
            Sign Up
          </button>
        </div>
      </div>
    </div>
  )
}

Auth.propTypes = {
  email: PropTypes.string.isRequired,
  setEmail: PropTypes.func.isRequired,
  password: PropTypes.string.isRequired,
  setPassword: PropTypes.func.isRequired,
  error: PropTypes.string,
  loading: PropTypes.bool.isRequired,
  handleAuth: PropTypes.func.isRequired,
}

export default Auth