import { useBox } from "@react-three/cannon";
import { useKeyboardControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";

function Character() {
    const [ref, api] = useBox(() => ({
        mass: 1,
        position: [0, 3, 0],
        fixedRotation: true,
        args: [0.75, 1.8, 0.75],
        angularDamping: 1.0,
        material: {
            friction: 0.0,
        },
    }));

    const velocity = useRef([0, 0, 0]);
    useEffect(() => {
        const unsubscribe = api.velocity.subscribe((v) => {
            velocity.current = v;
        });
        return unsubscribe;
    }, [api.velocity]);

    const [sub, get] = useKeyboardControls();
    const { camera } = useThree();

    useFrame(() => {
        const { forward, backward, left, right, jump } = get();
        const direction = new Vector3();

        // Calculate movement direction based on input keys
        const frontVector = new Vector3(0, 0, Number(forward) - Number(backward));
        const sideVector = new Vector3(Number(left) - Number(right), 0, 0);
        direction.addVectors(frontVector, sideVector).normalize();

        // Extract only the camera yaw (horizontal direction) to use for movement
        const cameraDirection = new Vector3();
        camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0; // Keep the movement horizontal
        cameraDirection.normalize();

        // Create the right direction vector based on the camera direction
        const rightDirection = new Vector3();
        rightDirection
            .crossVectors(new Vector3(0, 1, 0), cameraDirection)
            .normalize();

        // Final movement direction calculation
        const finalDirection = new Vector3();
        finalDirection
            .addScaledVector(cameraDirection, frontVector.z) // Move forward/backward in camera direction
            .addScaledVector(rightDirection, sideVector.x) // Move left/right in strafe direction
            .normalize();

        // Get current vertical velocity to maintain jumping or falling motion
        const yVelocity = velocity.current[1];

        // Movement speed
        const speed = 5;

        if (direction.length() > 0) {
            // Set velocity based on the calculated direction and speed, keeping y-axis velocity unchanged
            api.velocity.set(
                finalDirection.x * speed,
                yVelocity,
                finalDirection.z * speed
            );
        } else {
            // If no input, retain the current y velocity while stopping horizontal movement
            api.velocity.set(0, yVelocity, 0);
        }

        // Handle jumping when on the ground
        if (jump && Math.abs(yVelocity) < 0.05) {
            api.velocity.set(velocity.current[0], 5, velocity.current[2]);
        }

        // Update camera position to follow the player
        if (ref.current) {
            const playerPosition = new Vector3();
            ref.current.getWorldPosition(playerPosition);
            camera.position.set(
                playerPosition.x,
                playerPosition.y + 1.0,
                playerPosition.z
            );
        }
    });

    return null;
}

export default Character;