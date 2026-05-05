// Dashboard component shows the main app interface after login.
import PropTypes from 'prop-types'
import JobCard from './JobCard'
import './Dashboard.css'

const statuses = ['Applied', 'Interview', 'Offer', 'Rejected']

function Dashboard({
  session,
  jobs,
  company,
  setCompany,
  position,
  setPosition,
  status,
  setStatus,
  notes,
  setNotes,
  error,
  loading,
  handleSignOut,
  handleAddJob,
  handleStatusChange,
}) {
  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <h1>Job Application Tracker</h1>
          <p>Welcome, {session.user.email}</p>
        </div>
        <button className="secondary" onClick={handleSignOut}>
          Sign Out
        </button>
      </header>

      <div className="content-layout">
        <section className="card">
          <h2>Add new application</h2>
          {error && <div className="error-box">{error}</div>}
          <form onSubmit={handleAddJob}>
            <label>
              Company
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company name"
              />
            </label>
            <label>
              Position
              <input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Job title"
              />
            </label>
            <label>
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {statuses.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Notes
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes, reminders, or interview details"
              />
            </label>
            <button type="submit" disabled={loading}>
              Add job
            </button>
          </form>
        </section>

        <section className="card">
          <h2>Your applications</h2>
          {jobs.length === 0 ? (
            <p className="empty-state">No applications yet. Add one to get started.</p>
          ) : (
            <div className="job-list">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} onStatusChange={handleStatusChange} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

Dashboard.propTypes = {
  session: PropTypes.shape({
    user: PropTypes.shape({
      email: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  jobs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      position: PropTypes.string.isRequired,
      company: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      notes: PropTypes.string,
    })
  ).isRequired,
  company: PropTypes.string.isRequired,
  setCompany: PropTypes.func.isRequired,
  position: PropTypes.string.isRequired,
  setPosition: PropTypes.func.isRequired,
  status: PropTypes.string.isRequired,
  setStatus: PropTypes.func.isRequired,
  notes: PropTypes.string.isRequired,
  setNotes: PropTypes.func.isRequired,
  error: PropTypes.string,
  loading: PropTypes.bool.isRequired,
  handleSignOut: PropTypes.func.isRequired,
  handleAddJob: PropTypes.func.isRequired,
  handleStatusChange: PropTypes.func.isRequired,
}

export default Dashboard