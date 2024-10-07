import uWS from "uWebSockets.js";
import { BlockType, BlockTypes } from "./types";
import { Buffer } from "buffer";

const port = 9001;

interface Player {
  id: string;
  position: [number, number, number];
  ws: WebSocket; // or whatever type 'ws' should be
}

const app = uWS.App();

let players: { [key: string]: Player } = {};
let blocks: BlockType[] = [];

// Initialize the world with some blocks
const initializeWorld = () => {
  const size = 100;
  const depth = 1;
  for (let x = 0; x < size; x++) {
    for (let z = 0; z < size; z++) {
      for (let y = 0; y < depth; y++) {
        let blockType: BlockTypes;
        if (y === depth - 1) {
          blockType = BlockTypes.GRASS;
        } else if (y > depth - 4) {
          blockType = BlockTypes.DIRT;
        } else {
          blockType = BlockTypes.STONE;
        }
        blocks.push({
          key: `${x}-${y}-${z}`,
          position: [x, y, z],
          uuid: Math.random().toString(36).substr(2, 9),
          type: blockType,
        });
      }
    }
  }
};

initializeWorld();

app.ws("/*", {
  open: (ws) => {
    const playerId = Math.random().toString(36).substr(2, 9);
    players[playerId] = {
      id: playerId,
      position: [0, 1, 0],
      ws: ws as unknown as WebSocket,
    };

    console.log(`Player ${playerId} connected`);

    // Send initial state to the new player
    ws.send(
      JSON.stringify({
        type: "initialState",
        playerId: playerId,
        blocks: blocks,
      })
    );

    // Notify other players about the new player
    app.publish(
      "players",
      JSON.stringify({
        type: "playerJoin",
        playerId: playerId,
        position: players[playerId].position,
      })
    );

    // Subscribe the player to updates
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
