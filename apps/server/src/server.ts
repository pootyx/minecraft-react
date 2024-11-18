import { Buffer } from "buffer";
import uWS from "uWebSockets.js";
import { BlockType, BlockTypes } from "./types";
import { createNoise2D, createNoise3D } from "simplex-noise";
import seedrandom from "seedrandom";

const port = 9001;

interface Player {
  id: string;
  position: [number, number, number];
  ws: WebSocket; // or whatever type 'ws' should be
}

const app = uWS.App();

let players: { [key: string]: Player } = {};
let blocks: BlockType[] = [];

const generateWorld = (size: number, maxHeight: number) => {
  function xoshiro128ss(a: number, b: number, c: number, d: number) {
    return function () {
      let t = b << 9,
        r = b * 5;
      r = ((r << 7) | (r >>> 25)) * 9;
      c ^= a;
      d ^= b;
      b ^= c;
      a ^= d;
      c ^= t;
      d = (d << 11) | (d >>> 21);
      return (r >>> 0) / 4294967296;
    };
  }

  const seedgen = 2629793367;
  const getRand = xoshiro128ss(seedgen, seedgen, seedgen, seedgen);

  const noise2D = createNoise2D(() => getRand());
  const blocks: BlockType[] = [];

  const generationParams = {
    scale: 56,
    magnitude: 0.6,
    offset: 0.2,
  };

  for (let x = 0; x < size; x++) {
    for (let z = 0; z < size; z++) {
      const noiseValue = noise2D(
        x / generationParams.scale,
        z / generationParams.scale
      );
      const scaledNoiseValue =
        generationParams.offset + generationParams.magnitude * noiseValue;
      let height = Math.floor(maxHeight * scaledNoiseValue);
      height = Math.max(0, Math.min(height, maxHeight - 1));

      blocks.push({
        key: `${x}-${height}-${z}`,
        position: [x, height, z],
        uuid: Math.random().toString(36).substring(2, 9),
        type: BlockTypes.GRASS,
      });
    }
  }
  return blocks;
};

const initializeWorld = () => {
  blocks = generateWorld(50, 20);
};

initializeWorld();

app.ws("/*", {
  open: (ws) => {
    const playerId = Math.random().toString(36).substring(2, 9);
    players[playerId] = {
      id: playerId,
      position: [0, 1, 0],
      ws: ws as unknown as WebSocket,
    };

    console.log(`Player ${playerId} connected`);

    ws.send(
      JSON.stringify({
        type: "initialState",
        playerId: playerId,
        blocks: blocks,
      })
    );

    app.publish(
      "players",
      JSON.stringify({
        type: "playerJoin",
        playerId: playerId,
        position: players[playerId].position,
      })
    );

    ws.subscribe("players");
    ws.subscribe("blocks");
  },

  message: (ws, message, isBinary) => {
    const msg = JSON.parse(Buffer.from(message).toString());

    switch (msg.type) {
      case "blockUpdate":
        handleBlockUpdate(msg.blockUpdate);
        break;
      case "playerMove":
        handlePlayerMove(msg.playerId, msg.position);
        break;
      default:
        console.log("Unknown message type:", msg.type);
    }
  },

  close: (ws, code, message) => {
    const playerId = Object.keys(players).find(
      (id) => players[id].ws === (ws as any)
    );
    if (playerId) {
      console.log(`Player ${playerId} disconnected`);
      delete players[playerId];
      app.publish(
        "players",
        JSON.stringify({
          type: "playerLeave",
          playerId: playerId,
        })
      );
    }
  },
});

function handleBlockUpdate(blockUpdate: {
  action: "add" | "remove";
  block: BlockType;
}) {
  const { action, block } = blockUpdate;

  if (action === "add") {
    blocks.push(block);
  } else if (action === "remove") {
    blocks = blocks.filter((b) => b.key !== block.key);
  }

  app.publish(
    "blocks",
    JSON.stringify({
      type: "blockUpdate",
      blockUpdate: blockUpdate,
    })
  );
}

function handlePlayerMove(
  playerId: string,
  position: [number, number, number]
) {
  if (players[playerId]) {
    players[playerId].position = position;
    app.publish(
      "players",
      JSON.stringify({
        type: "playerMove",
        playerId: playerId,
        position: position,
      })
    );
  }
}

app.listen(port, (token) => {
  if (token) {
    console.log(`WebSocket server started on ws://localhost:${port}`);
  } else {
    console.log("Failed to start server");
  }
});
