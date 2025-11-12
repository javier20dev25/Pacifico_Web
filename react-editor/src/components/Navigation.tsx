import React from 'react';
import { Link } from 'react-router-dom';

export default function Navigation(): JSX.Element {
  return (
    <nav style={{ padding: 12, borderBottom: '1px solid #eee' }}>
      <Link to="/" style={{ marginRight: 12 }}>Home</Link>
      <Link to="/editor">Editor</Link>
    </nav>
  );
}
