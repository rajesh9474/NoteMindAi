import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data.documents);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be under 10MB.');
      return;
    }

    setUploadError('');
    setUploadSuccess('');
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.aiProcessed) {
        setUploadSuccess('Document uploaded and processed successfully!');
      } else {
        setUploadSuccess('Document uploaded! AI processing pending — open the document and click "Reprocess" to generate study content.');
      }
      fetchDocuments();
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const onFileSelect = (e) => {
    handleUpload(e.target.files[0]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Header */}
        <div className="dash-header">
          <div>
            <h1>Welcome back, <span className="gradient-text">{user?.name}</span></h1>
            <p>Upload your study materials and let AI do the heavy lifting.</p>
          </div>
        </div>

        {/* Upload Zone */}
        <div
          className={`upload-zone ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
          id="upload-zone"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="upload-processing">
              <div className="spinner"></div>
              <h3>Processing your document...</h3>
              <p>AI is generating summaries, quizzes, and flashcards. This may take a minute.</p>
            </div>
          ) : (
            <>
              <div className="upload-icon">📄</div>
              <h3>Drop your PDF here</h3>
              <p>or click to browse files (max 10MB)</p>
              <label className="btn btn-primary" htmlFor="file-input" id="upload-button">
                Choose File
              </label>
              <input
                type="file"
                id="file-input"
                accept=".pdf"
                onChange={onFileSelect}
                hidden
              />
            </>
          )}
        </div>

        {uploadError && <div className="alert alert-error">{uploadError}</div>}
        {uploadSuccess && <div className="alert alert-success">{uploadSuccess}</div>}

        {/* Documents List */}
        <div className="documents-section">
          <h2>Your Documents</h2>
          {loading ? (
            <div className="loading-screen">
              <div className="spinner"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>No documents yet</h3>
              <p>Upload your first PDF study material to get started.</p>
            </div>
          ) : (
            <div className="documents-grid">
              {documents.map((doc) => (
                <Link to={`/document/${doc.id}`} key={doc.id} className="document-card" id={`doc-${doc.id}`}>
                  <div className="doc-card-icon">📄</div>
                  <div className="doc-card-info">
                    <h3>{doc.file_name}</h3>
                    <p>Uploaded {formatDate(doc.uploaded_at)}</p>
                  </div>
                  <div className="doc-card-arrow">→</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
