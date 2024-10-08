import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [atsScore, setAtsScore] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle file change event
  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0]);
  };

  // Handle job description change event
  const handleJobDescriptionChange = (e) => {
    setJobDescription(e.target.value);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('jobDescription', jobDescription);

    try {
      const response = await axios.post('http://localhost:5000/check-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setAtsScore(response.data.atsScore);
    } catch (error) {
      console.error('Error generating ATS score:', error);
      setError('Failed to generate ATS score. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="App">
      <h1>ATS Resume Score Checker</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Upload Resume (PDF):</label>
          <input type="file" accept=".pdf" onChange={handleFileChange} />
        </div>
        <div>
          <label>Job Description:</label>
          <textarea
            placeholder="Enter the job description..."
            value={jobDescription}
            onChange={handleJobDescriptionChange}
            required
          />
        </div>
        <button type="submit" disabled={loading || !resumeFile || !jobDescription}>
          {loading ? 'Calculating...' : 'Check ATS Score'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {atsScore && (
        <div className="result">
          <h2>ATS Score:</h2>
          <p>{atsScore}%</p>
        </div>
      )}
    </div>
  );
}

export default App;
