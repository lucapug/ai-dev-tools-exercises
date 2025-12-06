import React from 'react';

function OutputPanel({ output }) {
  return (
    <div className="output-section">
      <div className="output-header">Output</div>
      <div className="output-content">
        {output.length === 0 ? (
          <div className="output-empty">
            Click "Run Code" to see the output here
          </div>
        ) : (
          output.map((item, index) => (
            <div 
              key={index} 
              className={`output-${item.type}`}
              style={{ marginBottom: '8px' }}
            >
              {item.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default OutputPanel;