// Dashboard component shows the main app interface after login.
import PropTypes from 'prop-types'
import JobCard from './JobCard'
import { JOB_STATUS, JOB_STATUSES } from '../jobApplicationStatuses'
import './Dashboard.css'

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
  onHome,
  onAbout,
}) {
  const rejectedCount = jobs.filter((job) => job.status === JOB_STATUS.REJECTED).length
  const inProgressCount = jobs.length - rejectedCount
  const interviewCount = jobs.filter((job) => job.status === JOB_STATUS.INTERVIEW).length
  const offerCount = jobs.filter((job) => job.status === JOB_STATUS.OFFER).length

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <h1>ApplyFlow</h1>
          <p>Welcome, {session.user.email}</p>
        </div>
        <nav className="dashboard-nav" aria-label="Main navigation">
          <button type="button" onClick={onHome}>Home</button>
          <button type="button" onClick={onAbout}>About</button>
        </nav>
        <button className="secondary" onClick={handleSignOut}>
          Sign Out
        </button>
      </header>

      <section className="dashboard-overview" aria-label="Application overview">
        <div className="overview-topline">
          <span>YOUR SEARCH</span>
          <span className="overview-live"><span /> LIVE OVERVIEW</span>
        </div>
        <div className="overview-heading">
          <div>
            <p>Your search at a glance</p>
            <h2>Application board</h2>
          </div>
          <span className="overview-count">{String(jobs.length).padStart(2, '0')}</span>
        </div>
        <div className="overview-stats">
          <div><strong>{jobs.length}</strong><span>Applications</span></div>
          <div><strong>{inProgressCount}</strong><span>In progress</span></div>
          <div><strong>{interviewCount}</strong><span>Interviews</span></div>
          <div><strong>{offerCount}</strong><span>Offers</span></div>
          <div><strong>{rejectedCount}</strong><span>Rejected</span></div>
        </div>
      </section>

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
                {JOB_STATUSES.map((option) => (
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
  onHome: PropTypes.func.isRequired,
  onAbout: PropTypes.func.isRequired,
}

export default Dashboard