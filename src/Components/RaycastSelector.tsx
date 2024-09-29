import { useThree, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Raycaster, Vector3 } from "three";

function RaycastSelector({
  setSelectedBlock,
}: {
  setSelectedBlock: (uuid: string | null) => void;
}) {
  const { camera, scene } = useThree();
  const raycaster = useRef(new Raycaster());

  useFrame(() => {
    raycaster.current.set(
      camera.position,
      camera.getWorldDirection(new Vector3())
    );
    const intersects = raycaster.current.intersectObjects(
      scene.children,
      false
    );
    if (intersects.length > 0) {
      const intersectedBlock = intersects[0].object;
      setSelectedBlock(intersectedBlock.uuid);
    } else {
      setSelectedBlock(null);
    }
  });

  return null;
}

export default RaycastSelector;