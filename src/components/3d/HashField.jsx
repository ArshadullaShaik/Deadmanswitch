
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

function Hash({ position, text, color }) {
    const ref = useRef();
    const initialPos = useRef(new THREE.Vector3(...position));
    const speed = useRef(Math.random() * 2 + 1); // Falling speed

    useFrame((state) => {
        if (!ref.current) return;

        // 1. Fall down
        ref.current.position.y -= speed.current * 0.02;

        // 2. Reset if too low
        if (ref.current.position.y < -15) {
            ref.current.position.y = 15;
            ref.current.position.x = (Math.random() - 0.5) * 30; // Randomize X on reset
        }

        // 3. Mouse Interaction (Repulsion)
        // Project mouse vector to world space approximately (assuming z=0 plane or similar depth)
        const mousePos = new THREE.Vector3(state.pointer.x * 15, state.pointer.y * 10, 0);
        const dist = ref.current.position.distanceTo(mousePos);

        if (dist < 4) { // Interaction radius
            const dir = new THREE.Vector3().subVectors(ref.current.position, mousePos).normalize();
            // Push away
            ref.current.position.addScaledVector(dir, 0.1);
        } else {
            // Gently return to original X/Z columns (optional, or just let them drift)
            // Let's just let them fall naturally after being pushed
        }
    });

    return (
        <Text
            ref={ref}
            position={position}
            fontSize={0.4}
            color={color}
            anchorX="center"
            anchorY="middle"
            fillOpacity={0.8}
        >
            {text}
        </Text>
    );
}

export function HashField({ count = 50 }) {
    const hashes = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            // Random hex string
            const str = "0x" + Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(6, '0');
            // Random start pos
            const x = (Math.random() - 0.5) * 30; // Spread wide
            const y = (Math.random() - 0.5) * 30;
            const z = (Math.random() - 0.5) * 10 - 5; // Background depth
            const color = Math.random() > 0.5 ? "#10B981" : "#059669"; // Different shades of matrix green
            temp.push({ id: i, pos: [x, y, z], text: str, color });
        }
        return temp;
    }, [count]);

    return (
        <group>
            {hashes.map((item) => (
                <Hash key={item.id} position={item.pos} text={item.text} color={item.color} />
            ))}
        </group>
    );
}
