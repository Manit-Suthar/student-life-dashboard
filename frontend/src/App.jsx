import { useEffect, useState } from "react";

function App() {
  const [backendStatus, setBackendStatus] = useState("Checking...");

  useEffect(() => {
    fetch("http://localhost:5000/health")
      .then((res) => res.json())
      .then((data) => {
        setBackendStatus(data.status);
      })
      .catch(() => {
        setBackendStatus("Backend not reachable");
      });
  }, []);

  return (
    <div>
      <h1>Student Life Dashboard</h1>
      <p>Backend status: {backendStatus}</p>
    </div>
  );
}

export default App;
