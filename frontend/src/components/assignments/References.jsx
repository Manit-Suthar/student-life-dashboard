import { useState } from "react";

function References({ references = [], onChange, readOnly = false }) {
  const [newReference, setNewReference] = useState({ label: "", url: "" });
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setNewReference(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddReference = () => {
    const newErrors = {};
    
    if (!newReference.url.trim()) {
      newErrors.url = "URL is required";
    } else if (!validateUrl(newReference.url)) {
      newErrors.url = "Please enter a valid URL";
    }
    
    if (!newReference.label.trim()) {
      newErrors.label = "Label is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const updatedReferences = [
      ...references,
      {
        id: Date.now().toString(),
        label: newReference.label.trim(),
        url: newReference.url.trim()
      }
    ];

    onChange(updatedReferences);
    setNewReference({ label: "", url: "" });
    setErrors({});
  };

  const handleRemoveReference = (id) => {
    const updatedReferences = references.filter(ref => ref.id !== id);
    onChange(updatedReferences);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddReference();
    }
  };

  const getUrlDomain = (url) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  const getUrlFavicon = (url) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      return "🔗";
    }
  };

  if (readOnly) {
    if (references.length === 0) {
      return null;
    }

    return (
      <div className="reference-links">
        {references.map((ref) => (
          <a
            key={ref.id}
            href={ref.url}
            target="_blank"
            rel="noopener noreferrer"
            className="reference-link"
            title={ref.url}
          >
            <img 
              src={getUrlFavicon(ref.url)} 
              alt=""
              style={{ 
                width: "14px", 
                height: "14px",
                marginRight: "var(--spacing-1)",
                borderRadius: "2px"
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            {ref.label}
          </a>
        ))}
      </div>
    );
  }

  return (
    <div style={{ marginTop: "var(--spacing-4)" }}>
      {/* Existing References */}
      {references.length > 0 && (
        <div style={{ marginBottom: "var(--spacing-4)" }}>
          <div style={{ 
            fontSize: "var(--font-size-sm)", 
            fontWeight: "500",
            color: "var(--text-secondary)",
            marginBottom: "var(--spacing-3)"
          }}>
            Current References ({references.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
            {references.map((ref) => (
              <div
                key={ref.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--spacing-2)",
                  padding: "var(--spacing-2) var(--spacing-3)",
                  background: "var(--bg-glass)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-lg)",
                  transition: "all var(--transition-normal)"
                }}
              >
                <img 
                  src={getUrlFavicon(ref.url)} 
                  alt=""
                  style={{ 
                    width: "16px", 
                    height: "16px",
                    borderRadius: "2px",
                    flexShrink: 0
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontSize: "var(--font-size-sm)", 
                    fontWeight: "500",
                    color: "var(--text-primary)",
                    marginBottom: "2px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {ref.label}
                  </div>
                  <div style={{ 
                    fontSize: "var(--font-size-xs)", 
                    color: "var(--text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {getUrlDomain(ref.url)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveReference(ref.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "var(--spacing-1)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "var(--font-size-xs)",
                    transition: "all var(--transition-fast)"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "var(--error-light)";
                    e.target.style.color = "var(--error)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "transparent";
                    e.target.style.color = "var(--text-muted)";
                  }}
                  title="Remove reference"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Reference Form */}
      <div>
        <div style={{ 
          fontSize: "var(--font-size-sm)", 
          fontWeight: "500",
          color: "var(--text-secondary)",
          marginBottom: "var(--spacing-3)"
        }}>
          Add Reference Link
        </div>
        
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: "var(--spacing-3)"
        }}>
          <div>
            <input
              type="text"
              placeholder="e.g., Lecture Slides, YouTube Tutorial"
              value={newReference.label}
              onChange={(e) => handleInputChange("label", e.target.value)}
              onKeyPress={handleKeyPress}
              className={`form-input ${errors.label ? "error" : ""}`}
              style={{ fontSize: "var(--font-size-sm)" }}
            />
            {errors.label && (
              <div style={{ 
                color: "var(--error)", 
                fontSize: "var(--font-size-xs)",
                marginTop: "var(--spacing-1)"
              }}>
                {errors.label}
              </div>
            )}
          </div>

          <div>
            <input
              type="url"
              placeholder="e.g., https://example.com/lecture-slides"
              value={newReference.url}
              onChange={(e) => handleInputChange("url", e.target.value)}
              onKeyPress={handleKeyPress}
              className={`form-input ${errors.url ? "error" : ""}`}
              style={{ fontSize: "var(--font-size-sm)" }}
            />
            {errors.url && (
              <div style={{ 
                color: "var(--error)", 
                fontSize: "var(--font-size-xs)",
                marginTop: "var(--spacing-1)"
              }}>
                {errors.url}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddReference}
            className="btn btn-secondary btn-sm"
            disabled={!newReference.label.trim() || !newReference.url.trim()}
            style={{ fontSize: "var(--font-size-sm)" }}
          >
            <span>+</span>
            <span>Add Reference</span>
          </button>
        </div>
      </div>

      {/* Style for error state */}
      <style jsx>{`
        .form-input.error {
          border-color: var(--error);
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
      `}</style>
    </div>
  );
}

export default References;