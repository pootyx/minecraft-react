import React from 'react';
import { KeyboardControls } from '@react-three/drei';
import MinecraftClone from './MinecraftClone';

function App() {
  return (
    <KeyboardControls
      map={[
        { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
        { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
        { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
        { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
        { name: 'jump', keys: ['Space'] },
      ]}
    >
      <div style={{ width: '100vw', height: '100vh' }}>
        <MinecraftClone />
      </div>
    </KeyboardControls>
  );
}

export default App;
