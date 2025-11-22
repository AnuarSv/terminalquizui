import React from 'react';

export default function TerminalUI({ children }) {
  return (
    <div className="terminal-wrapper">
      <div className="crt-screen">
        <div className="scanlines"></div>
        <div className="content-wrapper">
          {children}
        </div>
      </div>
    </div>
  );
}

