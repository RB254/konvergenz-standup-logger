import React, { useState, useEffect } from 'react';

// --- TYPESCRIPT INTERFACES (Class 7: Telling our program exactly what shapes our variables have) ---
interface StandupPost {
  _id: string;
  author: string;
  yesterday: string;
  today: string;
  blockers: string;
  has_blocker: boolean;
  timestamp: string;
}

interface StatsData {
  posts_per_day: { [date: string]: number };
  total_blockers: number;
}

function App() {
  // --- STATE ---
  const [posts, setPosts] = useState<StandupPost[]>([]);
  const [stats, setStats] = useState<StatsData>({ posts_per_day: {}, total_blockers: 0 });
  const [weather, setWeather] = useState({ temp: null as number | string | null, condition: "Loading weather..." });
  const [error, setError] = useState<string | null>(null);
  
  // Form input states
  const [author, setAuthor] = useState('');
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [blockers, setBlockers] = useState('');
  const [hasBlocker, setHasBlocker] = useState(false);

  const BACKEND_URL = "http://127.0.0.1:5000";

  // --- API CALL: Fetch Weather from Open-Meteo ---
  const fetchWeather = async () => {
    try {
      const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=-1.2864&longitude=36.8172&current_weather=true");
      if (!res.ok) throw new Error("Weather service unavailable");
      const data = await res.json();
      setWeather({
        temp: data.current_weather.temperature,
        condition: `Windspeed: ${data.current_weather.windspeed} km/h`
      });
    } catch (err) {
      setWeather({ temp: "N/A", condition: "Weather offline (Fallback)" });
    }
  };

  // --- API CALL: Fetch Standups from Flask ---
  const fetchStandups = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/standups`);
      if (!res.ok) throw new Error("Could not load standups");
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      setError("Backend server is not reachable. Is app.py running?");
    }
  };

  // --- API CALL: Fetch Statistics from Flask ---
  const fetchStats = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/stats`); // Tries the short or main route
      const fallbackUrl = `${BACKEND_URL}/standups/stats`;
      const targetUrl = res.ok ? `${BACKEND_URL}/stats` : fallbackUrl;
      
      const realRes = await fetch(targetUrl);
      if (!realRes.ok) throw new Error("Could not load statistics");
      const data = await realRes.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  // --- POLLING SETUP ---
  useEffect(() => {
    fetchWeather();
    fetchStandups();
    fetchStats();

    const interval = setInterval(() => {
      fetchStandups();
      fetchStats();
    }, 10000); // 10000 milliseconds = 10 seconds polling requirement!

    return () => clearInterval(interval);
  }, []);

  // --- FORM SUBMISSION ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!author || !yesterday || !today) {
      setError("Please fill out Name, Yesterday, and Today fields.");
      return;
    }

    const payload = {
      author,
      yesterday,
      today,
      blockers,
      has_blocker: hasBlocker,
      file_attachment: ""
    };

    try {
      const res = await fetch(`${BACKEND_URL}/standups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save post");

      setAuthor('');
      setYesterday('');
      setToday('');
      setBlockers('');
      setHasBlocker(false);

      fetchStandups();
      fetchStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', padding: '20px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      
      {/* HEADER SECTION */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>Konvergenz Standup Logger</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>Asynchronous Team Coordination Dashboard</p>
        </div>
        <div style={{ textAlign: 'right', backgroundColor: '#eef2f7', padding: '10px 15px', borderRadius: '6px' }}>
          <h4 style={{ margin: 0, color: '#0056b3' }}>🌍 Nairobi Weather</h4>
          <p style={{ margin: '5px 0 0 0', fontWeight: 'bold', fontSize: '1.2rem' }}>{weather.temp !== null ? `${weather.temp}°C` : 'Loading...'}</p>
          <small style={{ color: '#555' }}>{weather.condition}</small>
        </div>
      </header>

      {error && (
        <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontWeight: 'bold' }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        
        {/* SUBMISSION FORM */}
        <section style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', height: 'fit-content' }}>
          <h2 style={{ marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Log Your Standup</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <label style={{ fontWeight: 'bold' }}>
              Your Name *
              <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }} placeholder="John Doe" />
            </label>

            <label style={{ fontWeight: 'bold' }}>
              What did you do yesterday? *
              <textarea value={yesterday} onChange={(e) => setYesterday(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', height: '60px' }} placeholder="Worked on database connections..." />
            </label>

            <label style={{ fontWeight: 'bold' }}>
              What are you doing today? *
              <textarea value={today} onChange={(e) => setToday(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', height: '60px' }} placeholder="Testing user interfaces..." />
            </label>

            <label style={{ fontWeight: 'bold' }}>
              Any blockers?
              <textarea value={blockers} onChange={(e) => setBlockers(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', height: '40px' }} placeholder="None!" />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', color: '#c62828' }}>
              <input type="checkbox" checked={hasBlocker} onChange={(e) => setHasBlocker(e.target.checked)} style={{ transform: 'scale(1.2)' }} />
              Flag as active blocker ⚠️
            </label>

            <button type="submit" style={{ backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
              Publish Entry
            </button>
          </form>
        </section>

        {/* FEED & CHART DASHBOARD */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* NATIVE BAR CHART DISPLAY */}
          <section style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginTop: 0 }}>Productivity Dashboard (Last 7 Days)</h2>
            <p style={{ color: '#666' }}>Total active blockers flagged: <strong style={{ color: '#c62828' }}>{stats.total_blockers}</strong></p>
            
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px', height: '150px', borderBottom: '2px solid #ccc', paddingBottom: '10px', paddingTop: '20px' }}>
              {Object.keys(stats.posts_per_day).length === 0 ? (
                <p style={{ color: '#aaa', margin: 'auto' }}>No activity data compiled yet.</p>
              ) : (
                Object.entries(stats.posts_per_day).slice(-7).map(([date, count]) => (
                  <div key={date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>{count}</span>
                    <div style={{ width: '100%', backgroundColor: '#007bff', height: `${Math.min(count * 30, 120)}px`, borderRadius: '4px 4px 0 0' }}></div>
                    <span style={{ fontSize: '10px', color: '#666', marginTop: '6px' }}>{date.slice(5)}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* ACTIVITY FEED */}
          <section style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginTop: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Live Activity Feed
              <span style={{ fontSize: '12px', color: '#28a745', backgroundColor: '#e8f5e9', padding: '4px 8px', borderRadius: '12px' }}>🔄 Auto-polling live</span>
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '500px', overflowY: 'auto' }}>
              {posts.length === 0 ? (
                <p style={{ color: '#aaa', textAlign: 'center', padding: '20px' }}>The feed is empty. Log a standup to see it here!</p>
              ) : (
                posts.map((post) => (
                  <div key={post._id} style={{ border: '1px solid #eee', padding: '15px', borderRadius: '6px', position: 'relative', backgroundColor: post.has_blocker ? '#fff8f8' : '#fff', borderLeft: post.has_blocker ? '5px solid #d32f2f' : '5px solid #2e7d32' }}>
                    
                    {post.has_blocker && (
                      <span style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: '#d32f2f', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px' }}>
                        ⚠️ BLOCKER
                      </span>
                    )}

                    <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>{post.author}</h4>
                    <small style={{ color: '#999' }}>⏱️ {new Date(post.timestamp).toLocaleString()}</small>
                    
                    <div style={{ marginTop: '10px', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <p style={{ margin: 0 }}><strong>Yesterday:</strong> {post.yesterday}</p>
                      <p style={{ margin: 0 }}><strong>Today:</strong> {post.today}</p>
                      {post.blockers && <p style={{ margin: 0, color: post.has_blocker ? '#c62828' : '#333' }}><strong>Blockers:</strong> {post.blockers}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}

export default App;