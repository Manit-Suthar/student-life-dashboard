import { useNavigate } from "react-router-dom";
import { BookOpen, BookMarked, Package, Zap, Check, ArrowRight } from "lucide-react";

function WelcomePage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <BookOpen size={32} />,
      title: "Assignments",
      description: "Track and manage all your academic assignments with deadlines, priorities, and reference links.",
      features: ["Smart Dashboard", "Priority Management", "Deadline Tracking", "Reference Links"],
      available: true,
      path: "/assignments"
    },
    {
      icon: <BookMarked size={32} />,
      title: "Study Materials",
      description: "Organize and access your study resources, notes, and learning materials.",
      features: ["Resource Library", "Quick Search", "Category Organization"],
      available: true,
      path: "/study"
    },
    {
      icon: <Package size={32} />,
      title: "Inventory",
      description: "Manage your study equipment, books, and supplies efficiently.",
      features: ["Item Tracking", "Usage Analytics", "Smart Reminders"],
      available: true,
      path: "/inventory"
    },
    {
      icon: <Zap size={32} />,
      title: "Productivity",
      description: "Boost your productivity with time tracking and study session management.",
      features: ["Time Tracking", "Study Sessions", "Performance Analytics"],
      available: true,
      path: "/productivity"
    }
  ];

  return (
    <div className="welcome-page">
      {/* Background Pattern */}
      <div className="welcome-bg-pattern" />

      {/* Hero Section */}
      <div className="welcome-content">
        <div className="welcome-hero">
          <h1 className="welcome-title">
            Welcome to Your Student Life Hub
          </h1>

          <p className="welcome-subtitle">
            Your comprehensive student management platform for assignments, study materials, inventory tracking, and productivity tools.
            Organize your academic life with our modern, intuitive interface.
          </p>

          <button
            className="btn btn-primary btn-lg welcome-cta"
            onClick={() => navigate("/assignments")}
          >
            Get Started <ArrowRight size={18} />
          </button>
        </div>

        {/* Features Grid */}
        <div className="welcome-features-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`welcome-feature-card ${feature.available ? 'clickable' : ''}`}
              onClick={() => feature.available ? navigate(feature.path) : null}
            >
              {/* Status Badge */}
              <div className={`feature-status-badge ${feature.available ? 'available' : 'coming-soon'}`}>
                {feature.available ? "Available" : "Coming Soon"}
              </div>

              <div className="feature-icon-wrapper">
                {feature.icon}
              </div>

              <h3 className="feature-card-title">
                {feature.title}
              </h3>

              <p className="feature-card-description">
                {feature.description}
              </p>

              <div className="feature-list">
                {feature.features.map((feat, featIndex) => (
                  <div key={featIndex} className="feature-list-item">
                    <Check size={14} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {feature.available && (
                <button className="btn btn-primary feature-launch-btn">
                  Launch {feature.title} <ArrowRight size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WelcomePage;