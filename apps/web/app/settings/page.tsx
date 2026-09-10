export default function SettingsPage() {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Settings</h1>
      <p style={{ color: '#64748b' }}>Organization and profile settings — Stage 4 foundation.</p>
      <div style={{ marginTop: 16, background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 13 }}>API docs at <a href="http://localhost:3002/docs" style={{ color: '#2563eb' }}>http://localhost:3002/docs</a></div>
      </div>
    </div>
  );
}
