import { KeyboardControls } from '@react-three/drei';
import Minecraft from './Minecraft';

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
        <Minecraft />
      </div>
    </KeyboardControls>
  );
}

export default App;
