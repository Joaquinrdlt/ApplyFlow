// Auth component handles sign in and sign up forms.
import PropTypes from 'prop-types'
function Auth({ onHome, email, setEmail, password, setPassword, error, loading, handleAuth }) {
  return (
    <main className="auth-page">
      <header className="site-header auth-header">
        <button className="brand-button" onClick={onHome}>
          <span className="brand-mark" aria-hidden="true">A</span>
          <span>ApplyFlow</span>
        </button>
        <span className="auth-header-note">YOUR SEARCH, IN GOOD ORDER</span>
      </header>
      <section className="auth-card">
        <p className="eyebrow">WELCOME TO APPLYFLOW</p>
        <h1>Pick up where your next chapter begins.</h1>
        <p className="subtitle">Sign in or create an account to save your job applications.</p>

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
      </section>
    </main>
  )
}

Auth.propTypes = {
  onHome: PropTypes.func.isRequired,
  email: PropTypes.string.isRequired,
  setEmail: PropTypes.func.isRequired,
  password: PropTypes.string.isRequired,
  setPassword: PropTypes.func.isRequired,
  error: PropTypes.string,
  loading: PropTypes.bool.isRequired,
  handleAuth: PropTypes.func.isRequired,
}

export default Auth