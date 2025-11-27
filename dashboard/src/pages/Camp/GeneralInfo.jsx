import { FileText, Table, Download, Copy, Check, ExternalLink } from 'lucide-react';

export default function GeneralInfo({ camp, copiedUrl, setCopiedUrl }) {

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(camp.form_url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const response = await fetch(`/api/camps/${camp.camp_slug}/download-excel`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${camp.camp_slug}-registrations.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download:', err);
      alert('Failed to download Excel file');
    }
  };

  return (
    <>
      {/* Resources Grid */}
      <div className="camp-details-resources-section">
        <h2 className="camp-details-section-title">Camp Resources</h2>
        <div className="camp-details-resources-grid">

          {/* Registration Form */}
          <div className="camp-details-resource-card">
            <div className="camp-details-resource-icon resource-icon-form">
              <FileText size={32} />
            </div>
            <div className="camp-details-resource-content">
              <h3 className="camp-details-resource-title">Registration Form</h3>
              <p className="camp-details-resource-description">
                Share this link with parents to register their children for the camp
              </p>
              <div className="camp-details-url-container">
                <input 
                  type="text" 
                  value={camp.form_url} 
                  readOnly 
                  className="camp-details-url-input" 
                />
                <button 
                  onClick={handleCopyUrl} 
                  className="camp-details-copy-button" 
                  title="Copy to clipboard"
                >
                  {copiedUrl ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              <a 
                href={camp.form_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="camp-details-resource-link"
              >
                <span>Open Form</span>
                <ExternalLink size={16} />
              </a>
            </div>
          </div>

          {/* Spreadsheet */}
          <div className="camp-details-resource-card">
            <div className="camp-details-resource-icon resource-icon-sheet">
              <Table size={32} />
            </div>
            <div className="camp-details-resource-content">
              <h3 className="camp-details-resource-title">Response Spreadsheet</h3>
              <p className="camp-details-resource-description">
                Access live registration data directly from form submissions. Updates automatically.
              </p>
              <a 
                href={camp.sheet_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="camp-details-resource-link"
              >
                <span>Open Live Spreadsheet</span>
                <ExternalLink size={16} />
              </a>
            </div>
          </div>

          {/* XLSX Download */}
          <div className="camp-details-resource-card">
            <div className="camp-details-resource-icon resource-icon-xlsx">
              <Download size={32} />
            </div>
            <div className="camp-details-resource-content">
              <h3 className="camp-details-resource-title">Excel Export</h3>
              <p className="camp-details-resource-description">
                Download a local copy of the registration data as an Excel file for offline access.
              </p>
              <button 
                onClick={handleDownloadExcel} 
                className="camp-details-download-button"
              >
                <Download size={16} />
                <span>Download Excel File</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <div className="camp-details-divider"></div>

      {/* Technical Details */}
      <div className="camp-details-technical-section">
        <h2 className="camp-details-section-title">Technical Details</h2>
        <div className="camp-details-details-grid">
          <div className="camp-details-detail-item">
            <span className="camp-details-detail-label">Form ID:</span>
            <code className="camp-details-detail-value">{camp.form_id}</code>
          </div>
          <div className="camp-details-detail-item">
            <span className="camp-details-detail-label">Sheet ID:</span>
            <code className="camp-details-detail-value">{camp.sheet_id}</code>
          </div>
          <div className="camp-details-detail-item">
            <span className="camp-details-detail-label">Created:</span>
            <span className="camp-details-detail-value">
              {new Date(camp.created_at).toLocaleString('it-IT')}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
