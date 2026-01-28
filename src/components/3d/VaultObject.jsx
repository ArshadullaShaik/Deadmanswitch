
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Decal } from '@react-three/drei';

export function VaultObject({ isActive }) {
    const meshRef = useRef();

    // Rotate the object
    useFrame((state, delta) => {
        if (meshRef.current) {
            // Faster, jagged rotation if inactive/warning
            const speed = isActive ? 0.5 : 2.0;
            meshRef.current.rotation.x += delta * speed * 0.2;
            meshRef.current.rotation.y += delta * speed;
        }
    });

    const color = isActive ? "#10B981" : "#F43F5E"; // Emerald vs Rose

    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <mesh ref={meshRef} scale={2}>
                <icosahedronGeometry args={[1, 1]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={isActive ? 0.5 : 2}
                    wireframe
                    transparent
                    opacity={0.8}
                />

                {/* Inner solid core for readability */}
                <mesh scale={0.9}>
                    <icosahedronGeometry args={[1, 0]} />
                    <meshBasicMaterial color="#000" wireframe={false} transparent opacity={0.9} />
                </mesh>
            </mesh>
        </Float>
    );
}
