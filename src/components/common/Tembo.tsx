import React from 'react';

const Tembo: React.FC = () => {
  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#060a0e', paddingBottom: 20 }}>
      <iframe
        title="Tembo Elephant"
        src="/elephant.html"
        style={{ width: '100%', height: '100%', minHeight: 'calc(100vh - 80px)', border: 'none', display: 'block' }}
      />
    </div>
  );
};

export default Tembo;
