import { useThree, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Raycaster, Vector3 } from "three";

function RaycastSelector({
  setSelectedBlock,
  maxDistance = 5,
}: {
  setSelectedBlock: (uuid: string | null) => void;
  maxDistance?: number;
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
      true
    );
    const closestIntersect = intersects.find(intersect => intersect.distance <= maxDistance);
    if (closestIntersect) {
      setSelectedBlock(closestIntersect.object.uuid);
    } else {
      setSelectedBlock(null);
    }
  });

  return null;
}

export default RaycastSelector;
