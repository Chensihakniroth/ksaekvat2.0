export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--glass-border)',
      padding: '32px 24px',
      textAlign: 'center',
      color: 'var(--text-muted)',
      fontSize: '13px',
    }}>
      <p>
        ✦ KsaeKvat Bot Dashboard — Built with ❤️ by{' '}
        <span style={{ color: 'var(--accent-purple-light)' }}>@_callme_.mo</span>
      </p>
      <p style={{ marginTop: '6px', fontSize: '11px' }}>
        Data refreshes every 30 seconds. Not official Discord content.
      </p>
    </footer>
  );
}
