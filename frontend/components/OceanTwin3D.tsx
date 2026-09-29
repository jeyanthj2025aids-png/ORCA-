'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useRouter } from 'next/navigation';
import { PFZResult } from '@/types/orca';
import { Sparkles, Layers, Compass, ArrowUpRight } from 'lucide-react';

interface OceanTwinProps {
  pfzData?: PFZResult[];
}

export default function OceanTwin3D({ pfzData = [] }: OceanTwinProps) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // HUD telemetry state
  const [depthText, setDepthText] = useState('Depth: — m');
  const [tempText, setTempText] = useState('Temp: — °C');
  const [fishText, setFishText] = useState('Fish density: —');

  // Interactive controls state
  const [activeLayer, setActiveLayer] = useState<'all' | 'temp' | 'curr' | 'fish'>('all');
  const [speedIndex, setSpeedIndex] = useState<number>(2); // 1x by default
  const speeds = [0, 0.5, 1, 2.5];
  const speedLabels = ['Paused', '0.5x', '1x', '2.5x'];

  // Ref to pass layer and speed safely into animation loop
  const runtimeRef = useRef({
    animSpeed: 1,
    activeLayer: 'all' as 'all' | 'temp' | 'curr' | 'fish',
  });

  useEffect(() => {
    runtimeRef.current.activeLayer = activeLayer;
  }, [activeLayer]);

  useEffect(() => {
    runtimeRef.current.animSpeed = speeds[speedIndex];
  }, [speedIndex]);

  useEffect(() => {
    if (!wrapRef.current || !canvasRef.current) return;

    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    let width = wrap.clientWidth;
    let height = wrap.clientHeight || 520;

    canvas.width = width;
    canvas.height = height;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000a1e, 0.012);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 400);
    camera.position.set(0, 28, 52);
    camera.lookAt(0, 0, 0);

    const ambient = new THREE.AmbientLight(0x223366, 1.2);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0x6699cc, 1.8);
    sun.position.set(20, 40, 20);
    scene.add(sun);
    const back = new THREE.DirectionalLight(0x112244, 0.5);
    back.position.set(-10, 10, -20);
    scene.add(back);

    const GSIZE = 80;
    const SEGS = 79;
    const geo = new THREE.PlaneGeometry(GSIZE, GSIZE, SEGS, SEGS);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const N = SEGS + 1;
    const heightMap: number[][] = [];
    const tempMap: number[][] = [];

    function noise(x: number, y: number, scale: number, oct: number) {
      let v = 0;
      let a = 1;
      let f = 1;
      let t = 0;
      for (let i = 0; i < oct; i++) {
        v += Math.sin(x * f * scale + i * 2.3) * Math.cos(y * f * scale + i * 1.7) * a;
        t += a;
        a *= 0.5;
        f *= 2.2;
      }
      return v / t;
    }

    for (let j = 0; j < N; j++) {
      heightMap.push([]);
      tempMap.push([]);
      for (let i = 0; i < N; i++) {
        const nx = (i / (N - 1)) * 2 - 1;
        const ny = (j / (N - 1)) * 2 - 1;
        const h = noise(nx, ny, 1.8, 4) * 8 + noise(nx + 3, ny + 5, 3.5, 3) * 3 - 6;
        heightMap[j].push(h);
        const tVal = 18 + h * 0.8 + (Math.sin(nx * 2.5) * 2 + Math.cos(ny * 2) * 1.5);
        tempMap[j].push(Math.max(2, Math.min(30, tVal)));
      }
    }

    const colors = new Float32Array(N * N * 3);
    function tempToColor(t: number): [number, number, number] {
      const stops: [number, [number, number, number]][] = [
        [2, [0.016, 0.172, 0.325]],
        [10, [0.094, 0.373, 0.647]],
        [18, [0.114, 0.620, 0.459]],
        [24, [0.937, 0.624, 0.153]],
        [30, [0.847, 0.353, 0.188]],
      ];
      for (let k = 1; k < stops.length; k++) {
        if (t <= stops[k][0]) {
          const frac = (t - stops[k - 1][0]) / (stops[k][0] - stops[k - 1][0]);
          return stops[k - 1][1].map((c, idx) => c + (stops[k][1][idx] - c) * frac) as [number, number, number];
        }
      }
      return stops[stops.length - 1][1];
    }

    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const idx = j * N + i;
        pos.setY(idx, heightMap[j][i]);
        const c = tempToColor(tempMap[j][i]);
        colors[idx * 3] = c[0];
        colors[idx * 3 + 1] = c[1];
        colors[idx * 3 + 2] = c[2];
      }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    const mat = new THREE.MeshPhongMaterial({
      vertexColors: true,
      shininess: 40,
      specular: new THREE.Color(0x223366),
    });
    const terrain = new THREE.Mesh(geo, mat);
    scene.add(terrain);

    // Ocean water surface
    const waterGeo = new THREE.PlaneGeometry(GSIZE, GSIZE);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshPhongMaterial({
      color: 0x001a3d,
      transparent: true,
      opacity: 0.35,
      shininess: 120,
      specular: new THREE.Color(0x4488cc),
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.y = 1;
    scene.add(water);

    // Current vector arrows
    const arrowGroup = new THREE.Group();
    scene.add(arrowGroup);
    const ARROW_COUNT = 120;
    const arrowObjs: THREE.Group[] = [];

    function makeArrow() {
      const g = new THREE.Group();
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1, 0, 0),
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x7fffd4, transparent: true, opacity: 0.8 });
      const line = new THREE.Line(lineGeo, lineMat);
      const headGeo = new THREE.ConeGeometry(0.12, 0.3, 5);
      headGeo.rotateZ(-Math.PI / 2);
      const headMat = new THREE.MeshBasicMaterial({ color: 0x7fffd4, transparent: true, opacity: 0.9 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.x = 1.15;
      g.add(line, head);
      return g;
    }

    for (let i = 0; i < ARROW_COUNT; i++) {
      const a = makeArrow();
      const x = (Math.random() - 0.5) * GSIZE * 0.9;
      const z = (Math.random() - 0.5) * GSIZE * 0.9;
      const cx = Math.floor(((x / GSIZE) + 0.5) * (N - 1));
      const cz = Math.floor(((z / GSIZE) + 0.5) * (N - 1));
      const h = heightMap[Math.max(0, Math.min(N - 1, cz))][Math.max(0, Math.min(N - 1, cx))];
      const depth = h + Math.random() * 4 + 1;
      a.position.set(x, depth, z);
      const ang = noise(x * 0.15, z * 0.15, 1, 2) * Math.PI * 2;
      a.rotation.y = ang;
      const spd = 0.5 + Math.random() * 1.5;
      a.userData = { ox: x, oz: z, baseH: depth, ang, spd, phase: Math.random() * Math.PI * 2 };
      const sc = 0.6 + Math.random() * 0.8;
      a.scale.setScalar(sc);
      arrowGroup.add(a);
      arrowObjs.push(a);
    }

    // Fish schools
    const fishGroup = new THREE.Group();
    scene.add(fishGroup);
    const schools: THREE.Group[] = [];
    const SCHOOL_COUNT = 18;

    for (let s = 0; s < SCHOOL_COUNT; s++) {
      const cx = (Math.random() - 0.5) * GSIZE * 0.8;
      const cz = (Math.random() - 0.5) * GSIZE * 0.8;
      const ci = Math.floor(((cx / GSIZE) + 0.5) * (N - 1));
      const cj = Math.floor(((cz / GSIZE) + 0.5) * (N - 1));
      const bh = heightMap[Math.max(0, Math.min(N - 1, cj))][Math.max(0, Math.min(N - 1, ci))];
      const count = 10 + Math.floor(Math.random() * 25);
      const g = new THREE.Group();
      const dotGeo = new THREE.CircleGeometry(0.12, 5);
      dotGeo.rotateX(-Math.PI / 2);
      const dotMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.56, 1, 0.47),
        transparent: true,
        opacity: 0.85,
      });
      for (let d = 0; d < count; d++) {
        const m = new THREE.Mesh(dotGeo, dotMat);
        m.position.set((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 3);
        g.add(m);
      }
      g.position.set(cx, bh + 1.5 + Math.random() * 3, cz);
      g.userData = {
        cx,
        cz,
        bh,
        spd: 0.08 + Math.random() * 0.12,
        ang: Math.random() * Math.PI * 2,
        count,
        phase: Math.random() * Math.PI * 2,
      };
      fishGroup.add(g);
      schools.push(g);
    }

    // Research Vessel / Ship
    const shipGroup = new THREE.Group();
    const hullGeo = new THREE.BoxGeometry(6, 1.2, 2.2);
    const hullMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    const superGeo = new THREE.BoxGeometry(2.5, 1.4, 1.8);
    const superMat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
    const superStr = new THREE.Mesh(superGeo, superMat);
    superStr.position.set(1, 1.3, 0);
    const mastGeo = new THREE.CylinderGeometry(0.07, 0.07, 3, 6);
    const mastMat = new THREE.MeshPhongMaterial({ color: 0x777777 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(0.5, 3, 0);
    shipGroup.add(hull, superStr, mast);
    shipGroup.position.set(0, 3.2, 0);
    scene.add(shipGroup);

    // Multibeam Bathymetry Sonar Beam
    const beamGeo = new THREE.ConeGeometry(0.5, 12, 8, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.04,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, -6, 0);
    beam.rotation.x = Math.PI;
    shipGroup.add(beam);

    // PFZ Volumetric Beacons (ORCA integration)
    const pfzGroup = new THREE.Group();
    const defaultBeacons = [
      { name: 'Rameswaram Outer Shelf', x: 8, z: -12, color: 0x10b981 },
      { name: 'Mandapam Channel', x: -16, z: 14, color: 0x06b6d4 },
      { name: 'Palk Deep Bank', x: 22, z: -20, color: 0x10b981 },
    ];
    defaultBeacons.forEach((b) => {
      const beaconCyl = new THREE.CylinderGeometry(0.18, 0.18, 9, 16);
      const beaconMat = new THREE.MeshBasicMaterial({ color: b.color, transparent: true, opacity: 0.75 });
      const cyl = new THREE.Mesh(beaconCyl, beaconMat);
      cyl.position.set(b.x, 4.5, b.z);
      pfzGroup.add(cyl);

      const beaconCone = new THREE.ConeGeometry(2.4, 3.5, 16);
      const coneMat = new THREE.MeshStandardMaterial({ color: b.color, wireframe: true });
      const cone = new THREE.Mesh(beaconCone, coneMat);
      cone.position.set(b.x, 8.5, b.z);
      cone.rotation.x = Math.PI;
      pfzGroup.add(cone);
    });
    scene.add(pfzGroup);

    // Mouse Interaction and Orbit Controls
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let theta = 0.2;
    let phi = 0.45;
    let radius = 62;
    const target = new THREE.Vector3(0, 0, 0);

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onMouseMoveOrbit = (e: MouseEvent) => {
      if (!isDragging) return;
      theta -= (e.clientX - lastX) * 0.008;
      phi = Math.max(0.15, Math.min(1.4, phi - (e.clientY - lastY) * 0.008));
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onWheel = (e: WheelEvent) => {
      radius = Math.max(20, Math.min(120, radius + e.deltaY * 0.05));
      e.preventDefault();
    };

    wrap.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMoveOrbit);
    wrap.addEventListener('wheel', onWheel, { passive: false });

    // Raycasting for terrain inspection HUD
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMoveHover = (e: MouseEvent) => {
      const rect = wrap.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / wrap.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / wrap.clientHeight) * 2 + 1;
    };
    wrap.addEventListener('mousemove', onMouseMoveHover);

    // Animation loop
    let t = 0;
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const curSpeed = runtimeRef.current.animSpeed;
      const curLayer = runtimeRef.current.activeLayer;

      t += 0.016 * curSpeed;

      // Update layer visibility
      arrowGroup.visible = curLayer === 'all' || curLayer === 'curr';
      fishGroup.visible = curLayer === 'all' || curLayer === 'fish';
      pfzGroup.visible = curLayer === 'all' || curLayer === 'fish';

      terrain.material.vertexColors = curLayer === 'all' || curLayer === 'temp';
      if (curLayer === 'all' || curLayer === 'temp') {
        terrain.material.color.setRGB(1, 1, 1);
      } else {
        terrain.material.color.setRGB(0.25, 0.35, 0.45);
      }
      terrain.material.needsUpdate = true;

      // Camera positioning from spherical orbit
      camera.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = target.y + radius * Math.cos(phi);
      camera.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(target);

      // Arrow currents drift
      arrowObjs.forEach((a) => {
        const u = a.userData;
        const drift = noise(u.ox * 0.08 + t * 0.12, u.oz * 0.08, 1, 1) * 0.4;
        a.rotation.y = u.ang + drift;
      });

      // Fish schools dynamic swimming
      schools.forEach((s) => {
        const u = s.userData;
        u.ang += 0.004 * curSpeed * (0.8 + Math.sin(t * 0.3 + u.phase) * 0.4);
        const nx = u.cx + Math.cos(u.ang) * u.spd * curSpeed;
        const nz = u.cz + Math.sin(u.ang) * u.spd * curSpeed;
        const ci = Math.floor(((nx / GSIZE) + 0.5) * (N - 1));
        const cj = Math.floor(((nz / GSIZE) + 0.5) * (N - 1));
        const bh = heightMap[Math.max(0, Math.min(N - 1, cj))][Math.max(0, Math.min(N - 1, ci))];
        u.cx = Math.max(-GSIZE * 0.45, Math.min(GSIZE * 0.45, nx));
        u.cz = Math.max(-GSIZE * 0.45, Math.min(GSIZE * 0.45, nz));
        s.position.set(u.cx, bh + 1.5 + Math.sin(t * 0.5 + u.phase), u.cz);
        s.children.forEach((d, di) => {
          d.position.y = ((d.position.y + 0.5) % 1.5) - 0.5 + Math.sin(t * 1.2 + di * 0.7) * 0.08;
        });
      });

      // Vessel bobbing
      shipGroup.position.y = 3.2 + Math.sin(t * 0.6) * 0.15;
      water.position.y = 1 + Math.sin(t * 0.4) * 0.05;

      // Raycasting hit test
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(terrain);
      if (hits.length > 0) {
        const p = hits[0].point;
        const ci = Math.floor(((p.x / GSIZE) + 0.5) * (N - 1));
        const cj = Math.floor(((p.z / GSIZE) + 0.5) * (N - 1));
        const h = heightMap[Math.max(0, Math.min(N - 1, cj))][Math.max(0, Math.min(N - 1, ci))];
        const temp = tempMap[Math.max(0, Math.min(N - 1, cj))][Math.max(0, Math.min(N - 1, ci))];
        const nearby = schools
          .filter((s) => {
            const dx = s.position.x - p.x;
            const dz = s.position.z - p.z;
            return Math.sqrt(dx * dx + dz * dz) < 8;
          })
          .reduce((acc, s) => acc + s.userData.count, 0);

        setDepthText(`Depth: ${Math.abs(Math.round(h * 12))} m`);
        setTempText(`Temp: ${temp.toFixed(1)} °C`);
        setFishText(`Fish density: ${nearby > 0 ? nearby + ' nearby' : 'none nearby'}`);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Window resize handler
    const onResize = () => {
      if (!wrap) return;
      const w = wrap.clientWidth;
      const h = wrap.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      wrap.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMoveOrbit);
      wrap.removeEventListener('wheel', onWheel);
      wrap.removeEventListener('mousemove', onMouseMoveHover);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, []);

  const handleConnectData = () => {
    router.push(
      '/copilot?query=' +
        encodeURIComponent(
          'How do I connect live INCOIS/ISRO oceanographic data and hydrodynamic current models to this 3D Digital Ocean Twin?'
        )
    );
  };

  return (
    <div className="flex flex-col w-full rounded-xl overflow-hidden border border-[#D0DFF0] bg-[#000a1e] shadow-xl">
      {/* 3D Visualizer Canvas & Overlays */}
      <div ref={wrapRef} className="relative w-full h-[520px] bg-[#000a1e] overflow-hidden select-none cursor-grab active:cursor-grabbing">
        <canvas ref={canvasRef} className="block w-full h-full" />

        {/* Top-Left Telemetry HUD Pills */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none z-10">
          <div className="bg-[#000a1e]/80 border border-white/15 rounded-full px-3 py-1 text-xs text-[#cce8ff] font-mono shadow-md backdrop-blur-sm">
            {depthText}
          </div>
          <div className="bg-[#000a1e]/80 border border-white/15 rounded-full px-3 py-1 text-xs text-[#cce8ff] font-mono shadow-md backdrop-blur-sm">
            {tempText}
          </div>
          <div className="bg-[#000a1e]/80 border border-white/15 rounded-full px-3 py-1 text-xs text-[#cce8ff] font-mono shadow-md backdrop-blur-sm">
            {fishText}
          </div>
        </div>

        {/* Top-Right Scientific Legend */}
        <div className="absolute top-3 right-3 bg-[#000a1e]/85 border border-white/15 rounded-lg px-3.5 py-2.5 text-[11px] text-[#cce8ff] shadow-xl backdrop-blur-md z-10 space-y-2">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-2 rounded-sm"
              style={{
                background: 'linear-gradient(to right, #042c53, #185fa5, #1d9e75, #ef9f27, #d85a30)',
              }}
            />
            <span>Cold → Warm (SST)</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-2 flex items-center justify-center">
              <svg width="22" height="8">
                <line x1="1" y1="4" x2="16" y2="4" stroke="#7fffd4" strokeWidth="1.5" />
                <polygon points="16,1 22,4 16,7" fill="#7fffd4" />
              </svg>
            </div>
            <span>Current Vector</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#a8ff78] inline-block" />
              <span className="w-2 h-2 rounded-full bg-[#a8ff78] inline-block" />
            </div>
            <span>Fish School</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-2 bg-[#aaa] rounded-sm opacity-80" />
            <span>Research Vessel</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-2 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            </div>
            <span className="text-emerald-300 font-medium">PFZ Beacon Hotspot</span>
          </div>
        </div>

        {/* Bottom Interaction Guide */}
        <div className="absolute bottom-3 left-0 right-0 text-center text-[11px] text-[#b4d2ff]/60 pointer-events-none z-10 font-sans tracking-wide">
          Drag to orbit &nbsp;·&nbsp; Scroll to zoom &nbsp;·&nbsp; Hover terrain for telemetry data
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-2.5 bg-[#0a1628] border-t border-[#1b2f4e] text-xs text-slate-200">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-sky-400" /> Layer:
          </span>
          <button
            onClick={() => setActiveLayer('all')}
            className={`px-3 py-1 rounded text-xs font-medium transition border ${
              activeLayer === 'all'
                ? 'bg-[#185fa5] text-white border-sky-400 shadow-sm'
                : 'bg-[#0f243e] text-slate-300 border-[#223d60] hover:bg-[#153154]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveLayer('temp')}
            className={`px-3 py-1 rounded text-xs font-medium transition border ${
              activeLayer === 'temp'
                ? 'bg-[#185fa5] text-white border-sky-400 shadow-sm'
                : 'bg-[#0f243e] text-slate-300 border-[#223d60] hover:bg-[#153154]'
            }`}
          >
            Temperature
          </button>
          <button
            onClick={() => setActiveLayer('curr')}
            className={`px-3 py-1 rounded text-xs font-medium transition border ${
              activeLayer === 'curr'
                ? 'bg-[#185fa5] text-white border-sky-400 shadow-sm'
                : 'bg-[#0f243e] text-slate-300 border-[#223d60] hover:bg-[#153154]'
            }`}
          >
            Currents
          </button>
          <button
            onClick={() => setActiveLayer('fish')}
            className={`px-3 py-1 rounded text-xs font-medium transition border ${
              activeLayer === 'fish'
                ? 'bg-[#185fa5] text-white border-sky-400 shadow-sm'
                : 'bg-[#0f243e] text-slate-300 border-[#223d60] hover:bg-[#153154]'
            }`}
          >
            Fish
          </button>

          <div className="h-4 w-[1px] bg-[#1b2f4e] mx-1" />

          {/* Speed Control Slider */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">
              Speed: <b className="text-sky-300 font-mono">{speedLabels[speedIndex]}</b>
            </span>
            <input
              type="range"
              min="0"
              max="3"
              step="1"
              value={speedIndex}
              onChange={(e) => setSpeedIndex(parseInt(e.target.value))}
              className="w-20 accent-sky-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>
        </div>

        {/* Ask Copilot / Connect Data Button */}
        <button
          onClick={handleConnectData}
          className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold text-white bg-gradient-to-r from-[#1a7fc1] to-[#0e9e8a] hover:opacity-95 shadow transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Connect real data ↗</span>
        </button>
      </div>
    </div>
  );
}
