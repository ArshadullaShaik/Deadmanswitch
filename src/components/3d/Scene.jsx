
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { VaultObject } from './VaultObject';
import { HashField } from './HashField';

function Loader() {
    return <Html center><div className="text-emerald-500 font-mono text-sm">Initializing Vault...</div></Html>;
}


export default function Scene({ isActive }) {
    return (
        <div className="fixed inset-0 z-0 bg-gray-950 pointer-events-auto">
            <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                {/* Cyberpunk Lighting */}
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={2} color="#10B981" />
                <pointLight position={[-10, -10, -10]} intensity={2} color="#4F46E5" />

                {/* Interactive Background */}
                <HashField count={60} />

                {/* Central Object */}
                <VaultObject isActive={isActive} />

                {/* Minimal Controls */}
                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.2} />
            </Canvas>
        </div>
    );
}
