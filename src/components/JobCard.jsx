// JobCard component displays a single job application with status update.
import PropTypes from 'prop-types'
import './JobCard.css'

const statuses = ['Applied', 'Interview', 'Offer', 'Rejected']

function JobCard({ job, onStatusChange }) {
  return (
    <article className="job-card">
      <div className="job-title">
        <div>
          <h3>{job.position}</h3>
          <p>{job.company}</p>
        </div>
        <span className={`status-pill status-${job.status.toLowerCase()}`}>
          {job.status}
        </span>
      </div>
      {job.notes && (
        <details className="job-notes-disclosure">
          <summary>Notes and job description</summary>
          <p className="job-notes">{job.notes}</p>
        </details>
      )}
      <div className="job-actions">
        <label>
          Update status
          <select
            value={job.status}
            onChange={(e) => onStatusChange(job.id, e.target.value)}
          >
            {statuses.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
    </article>
  )
}

JobCard.propTypes = {
  job: PropTypes.shape({
    id: PropTypes.number.isRequired,
    position: PropTypes.string.isRequired,
    company: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    notes: PropTypes.string,
  }).isRequired,
  onStatusChange: PropTypes.func.isRequired,
}

export default JobCard