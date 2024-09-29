import { useBox } from "@react-three/cannon";
import { Edges } from "@react-three/drei";
import { ThreeEvent, useLoader } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { BufferGeometry, Material, Mesh, MeshStandardMaterial, TextureLoader } from "three";

export enum BlockTypes {
    DIRT = 0,
    GRASS = 1,
    WOOD = 2,
    STONE = 3,
    SAND = 4,
}

export interface BlockType {
    key: string;
    position: [number, number, number];
    uuid: string;
    type: BlockTypes;
}

interface BlockProps {
    position: [number, number, number];
    onRemove: () => void;
    isSelected: boolean;
    handlePlaceBlock: (
        position: [number, number, number],
        normal: [number, number, number]
    ) => void;
    uuid: string;
    type: BlockTypes;
}

function Block({
    position,
    onRemove,
    handlePlaceBlock,
    isSelected,
    uuid,
    type,
}: BlockProps) {
    const ref = useRef<Mesh<BufferGeometry, Material | Material[]>>(null);
    const [api] = useBox(
        () => ({
            type: 'Static',
            position,
            material: {
                friction: 0.0,
            },
        }),
        ref
    );

    const dirtTexture = useLoader(TextureLoader, '/textures/dirt.png');
    const grassTexture = useLoader(TextureLoader, '/textures/grass.png');
    const stoneTexture = useLoader(TextureLoader, '/textures/stone.png');
    const sandTexture = useLoader(TextureLoader, '/textures/sand.png');
    const woodTexture = useLoader(TextureLoader, '/textures/wood.png');

    const [cracks, setCracks] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isSelected && cracks > 0) {
            interval = setInterval(() => {
                setCracks((prev) => {
                    if (prev >= 3 && interval) {
                        clearInterval(interval);
                        api.current?.remove();
                        onRemove();
                        return 0;
                    }
                    return prev + 1;
                });
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [cracks, isSelected, onRemove, api]);

    const handlePointerDown = (event: ThreeEvent<MouseEvent>) => {
        if (event.nativeEvent.button === 0 && isSelected) {
            setCracks((prev) => prev + 1);
        } else if (event.nativeEvent.button === 2) {
            event.stopPropagation();
            const faceNormal = event.face?.normal;

            if (faceNormal) {
                const normalArray: [number, number, number] = [
                    faceNormal.x,
                    faceNormal.y,
                    faceNormal.z,
                ];
                handlePlaceBlock(position, normalArray);
            }
        }
    };

    const handlePointerUp = () => {
        setCracks(0);
    };

    const getTexture = (blockType: BlockTypes) => {
        switch (blockType) {
            case BlockTypes.DIRT:
                return dirtTexture;
            case BlockTypes.GRASS:
                return grassTexture;
            case BlockTypes.WOOD:
                return woodTexture;
            case BlockTypes.STONE:
                return stoneTexture;
            case BlockTypes.SAND:
                return sandTexture;
            default:
                return dirtTexture;
        }
    };

    const texture = getTexture(type);

    const material = new MeshStandardMaterial({
        map: texture,
        opacity: 1 - cracks * 0.3,
        transparent: true,
    });

    return (
        <mesh
            ref={ref}
            position={position}
            castShadow
            receiveShadow
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerOut={handlePointerUp}
            material={material}
            uuid={uuid}
        >
            <boxGeometry args={[1, 1, 1]} />
            {isSelected && <Edges color="green" />}
        </mesh>
    );
}

export default Block;