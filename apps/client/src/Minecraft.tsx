import { Physics } from "@react-three/cannon";
import { PointerLockControls, Sky } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Block, BlockTypes } from "./Components/Block";
import Character from "./Components/Character";
import RaycastSelector from "./Components/RaycastSelector";
import World from "./Components/World";
import { Perf } from "r3f-perf";
import { Fog, Vector3 } from "three";
import OtherPlayer from "./Components/OtherPlayer";

function Minecraft() {
  const MAX_PLACE_DISTANCE = 5; // Maximum distance for block placement
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [otherPlayers, setOtherPlayers] = useState<{ [key: string]: Vector3 }>(
    {}
  );

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:9001");
    ws.onopen = () => {
      console.log("Connected to server");
      setSocket(ws);
    };
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleServerMessage(message);
    };
    return () => {
      ws.close();
    };
  }, []);

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const handleServerMessage = (message: any) => {
    switch (message.type) {
      case "initialState":
        setBlocks(message.blocks);
        setPlayerId(message.playerId);
        break;
      case "blockUpdate":
        break;
      case "playerMove":
        if (message.playerId !== playerId) {
          setOtherPlayers((prev) => ({
            ...prev,
            [message.playerId]: new Vector3(...message.position),
          }));
        }
        break;
      case "playerJoin":
        if (message.playerId !== playerId) {
          setOtherPlayers((prev) => ({
            ...prev,
            [message.playerId]: new Vector3(...message.position),
          }));
        }
        break;
      case "playerLeave":
        if (message.playerId !== playerId) {
          setOtherPlayers((prev) => {
            const newPlayers = { ...prev };
            delete newPlayers[message.playerId];
            return newPlayers;
          });
        }
        break;
    }
  };

  function FogEffect() {
    const { scene } = useThree();
    useEffect(() => {
      scene.fog = new Fog("#87CEEB", 0, 100); // Sky blue fog, starting at 0 units, ending at 100 units
    }, [scene]);
    return null;
  }

  return (
    <Canvas>
      <FogEffect />
      <Perf position="top-left" />
      <Sky />
      <PointerLockControls />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <Physics>
        <World blocks={blocks} />
        {playerId && (
          <Character blocks={blocks} playerId={playerId} socket={socket} />
        )}
        {Object.entries(otherPlayers).map(([id, position]) => (
          <OtherPlayer key={id} position={position} />
        ))}
        <RaycastSelector setSelectedBlock={setSelectedBlock} />
      </Physics>
    </Canvas>
  );
}

export default Minecraft;
