import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// 셰이더 소스코드 (ReactBits의 Dark Veil 로직)
const CustomShaderMaterial = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec2 u_resolution;
    uniform float u_time;
    varying vec2 vUv;

    void main() {
      vec2 st = gl_FragCoord.xy / u_resolution.xy;
      st.x *= u_resolution.x / u_resolution.y;
      
      // 유동적인 유체 효과를 내는 수학적 노이즈 로직
      float time = u_time * 1.8; // 속도 조절
      vec3 color = vec3(0.0);
      
      float f = 0.0;
      vec2 q = vec2(0.0);
      q.x = sin(st.x + time * 0.3) * 0.85;
      q.y = cos(st.y + time * 0.2) * 0.85;
      
      vec2 r = vec2(0.0);
      r.x = sin(st.x + q.x + time * 0.1);
      r.y = cos(st.y + q.y + time * 0.1);
      
      f = sin(length(st - r) * 3.0);
      
      // Dark Veil 특유의 어둡고 고혹적인 흑백 톤 계산
      color = mix(vec3(0.03, 0.03, 0.05), vec3(0.12, 0.12, 0.15), f);
      
      // 스캔라인 및 노이즈 효과 가미
      float scanline = sin(gl_FragCoord.y * 1.0) * 0.04;
      color -= scanline;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
};

function BackgroundMesh() {
  const meshRef = useRef();
  const { size } = useThree();

  const uniforms = useMemo(() => ({
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(size.width, size.height) }
  }), []);

  // 화면 리사이즈 시 해상도 업데이트
  React.useEffect(() => {
    uniforms.u_resolution.value.set(size.width, size.height);
  }, [size, uniforms]);

  // 매 프레임마다 애니메이션 시간 업데이트 (흘러가게 만듦)
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.u_time.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={CustomShaderMaterial.vertexShader}
        fragmentShader={CustomShaderMaterial.fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

export default function DarkVeil() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: -1, // 화면 맨 뒤로 보내기 위해 -1 세팅
      pointerEvents: 'none',
      backgroundColor: '#050507'
    }}>
      <Canvas camera={{ position: [0, 0, 1] }}>
        <BackgroundMesh />
      </Canvas>
    </div>
  );
}
