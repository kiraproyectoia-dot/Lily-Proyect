

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, ThreeElements } from '@react-three/fiber';
import { AnimationMixer, AnimationAction, LoopOnce, Bone, SkinnedMesh, Vector2, Euler, MathUtils } from 'three';
import { useGLTF, OrbitControls } from '@react-three/drei';

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      header: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      h1: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      main: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      footer: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
      p: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
      span: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
      svg: React.SVGProps<SVGSVGElement>;
      path: React.SVGProps<SVGPathElement>;
      form: React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;
      input: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
      primitive: ThreeElements['primitive'];
      ambientLight: ThreeElements['ambientLight'];
      directionalLight: ThreeElements['directionalLight'];
    }
  }
}

interface ModelProps {
  modelUrl: string;
  isSpeaking: boolean;
  currentGesture: string | null;
  getAudioVolume?: () => number;
}

interface MorphTargetInfo {
  mesh: SkinnedMesh;
  index: number;
}

const GESTURE_TO_ANIMATION_MAP: Record<string, string[]> = {
    nod: ['nod', 'yes'],
    shake: ['shake', 'no'],
    thoughtful: ['lookaround', 'headtilt'],
    idle_yawn: ['yawn'],
    idle_hair: ['hair'],
};

const LilyModel: React.FC<ModelProps> = ({ modelUrl, isSpeaking, currentGesture, getAudioVolume }) => {
  const { scene, animations } = useGLTF(modelUrl);
  const mixer = useRef<AnimationMixer | null>(null);

  const [visemes, setVisemes] = useState<Record<string, MorphTargetInfo>>({});
  const [headBone, setHeadBone] = useState<Bone | null>(null);
  const [spineBone, setSpineBone] = useState<Bone | null>(null);
  const [leftEyeBone, setLeftEyeBone] = useState<Bone | null>(null);
  const [rightEyeBone, setRightEyeBone] = useState<Bone | null>(null);
  
  const animationsMap = useRef<Record<string, AnimationAction>>({});
  const idleAnimations = useRef<AnimationAction[]>([]);
  
  const eyeDartState = useRef({ nextTime: 3, target: new Vector2() });
  const idleAnimState = useRef({ nextTime: 15, isPlaying: false, currentAction: null as AnimationAction | null });
  const gestureState = useRef({ isPlaying: false });
  
  const lipSyncState = useRef({
      lastVisemeChangeTime: 0,
      currentVisemeIndex: -1,
      targetIntensity: 0,
  });

  const initialBoneRotations = useRef(new Map<string, Euler>());

  useEffect(() => {
    if (!scene) return;
    
    // --- ANIMATION SETUP ---
    mixer.current = new AnimationMixer(scene);
    const onAnimationFinished = (event: any) => {
        const finishedAction = event.action;
        if (idleAnimations.current.includes(finishedAction)) {
            idleAnimState.current.isPlaying = false;
        }
        if (Object.values(animationsMap.current).includes(finishedAction)) {
            gestureState.current.isPlaying = false;
        }
    };
    mixer.current.addEventListener('finished', onAnimationFinished);
    
    animationsMap.current = {};
    idleAnimations.current = [];
    if (animations && animations.length > 0) {
        console.log('AVATAR ALIVE: Available animation clips:', animations.map(c => c.name));
        const potentialIdleNames = ['hair', 'yawn', 'look', 'nod', 'shake', 'idle'];
        animations.forEach(clip => {
            const action = mixer.current!.clipAction(clip);
            action.setLoop(LoopOnce, 1);
            action.clampWhenFinished = true;
            animationsMap.current[clip.name] = action;

            if (potentialIdleNames.some(name => clip.name.toLowerCase().includes(name))) {
                idleAnimations.current.push(action);
            }
        });
        if (idleAnimations.current.length > 0) {
            console.log(`AVATAR ALIVE: Success! Found ${idleAnimations.current.length} idle animations.`);
        } else {
            console.warn("AVATAR ALIVE: Could not find any suitable idle animation clips.");
        }
    } else {
        console.warn("AVATAR ALIVE: The loaded model contains NO animation clips. Gestures and idle animations will be disabled.");
    }
    
    // --- ROBUST DISCOVERY (DUCK TYPING) ---
    console.log("AVATAR ALIVE: Starting discovery with duck-typing to bypass library conflicts.");
    let foundSkinnedMesh = false;
    
    let candidates = {
        head: { bone: null as Bone | null, score: 0 },
        spine: { bone: null as Bone | null, score: 0 },
        leftEye: { bone: null as Bone | null, score: 0 },
        rightEye: { bone: null as Bone | null, score: 0 },
    };
    
    const discoveredVisemes: Record<string, MorphTargetInfo> = {};

    const score = (name: string, terms: Record<string, number>) => {
        const lowerName = name.toLowerCase();
        for (const term in terms) {
            if (lowerName.includes(term)) return terms[term];
        }
        return 0;
    };

    scene.traverse(node => {
        if ((node as any).isSkinnedMesh) {
            foundSkinnedMesh = true;
            const mesh = node as SkinnedMesh;
            
            if (mesh.morphTargetDictionary) {
                for (const name in mesh.morphTargetDictionary) {
                    if (name.toLowerCase().startsWith('viseme_')) {
                        discoveredVisemes[name] = { mesh, index: mesh.morphTargetDictionary[name] };
                    }
                }
            }
            
            if (mesh.skeleton) {
                mesh.skeleton.bones.forEach(bone => {
                    if (!initialBoneRotations.current.has(bone.uuid)) {
                        initialBoneRotations.current.set(bone.uuid, bone.rotation.clone());
                    }
                    let s;
                    s = score(bone.name, { 'head': 2, 'neck': 1 });
                    if (s > candidates.head.score) candidates.head = { bone, score: s };

                    s = score(bone.name, { 'spine2': 3, 'spine': 2, 'chest': 1 });
                    if (s > candidates.spine.score) candidates.spine = { bone, score: s };

                    s = score(bone.name, { 'lefteye': 1 });
                    if (s > candidates.leftEye.score) candidates.leftEye = { bone, score: s };

                    s = score(bone.name, { 'righteye': 1 });
                    if (s > candidates.rightEye.score) candidates.rightEye = { bone, score: s };
                });
            }
        }
    });

    if (!foundSkinnedMesh) {
        console.error("AVATAR DISCOVERY FAILED: No SkinnedMesh object could be found in the loaded model. This is the root cause of the animation failure.");
    }
    
    setVisemes(discoveredVisemes);
    if (Object.keys(discoveredVisemes).length > 0) {
        console.log(`LIP-SYNC SUCCESS: Found ${Object.keys(discoveredVisemes).length} viseme morph targets for realistic speech animation.`);
    } else {
        console.error("LIP-SYNC FAILED: Could not find any morph targets with the 'viseme_' prefix. The model may not be configured for viseme-based lip-sync.");
    }

    setHeadBone(candidates.head.bone);
    setSpineBone(candidates.spine.bone);
    setLeftEyeBone(candidates.leftEye.bone);
    setRightEyeBone(candidates.rightEye.bone);
    
    if (candidates.head.bone) console.log(`AVATAR ALIVE: Head bone found ('${candidates.head.bone.name}'). Idle sway enabled.`);
    else console.warn("AVATAR ALIVE: Head/Neck bone not found. Idle sway disabled.");
    
    if (candidates.spine.bone) console.log(`AVATAR ALIVE: Spine bone found ('${candidates.spine.bone.name}'). Breathing enabled.`);
    else console.warn("AVATAR ALIVE: Spine/Chest bone not found. Breathing disabled.");

    if (candidates.leftEye.bone && candidates.rightEye.bone) console.log(`AVATAR ALIVE: Eye bones found ('${candidates.leftEye.bone.name}', '${candidates.rightEye.bone.name}'). Eye darting enabled.`);
    else console.warn("AVATAR ALIVE: One or both eye bones not found. Eye darting disabled.");

    return () => {
        mixer.current?.removeEventListener('finished', onAnimationFinished);
        mixer.current?.stopAllAction();
    }
  }, [scene, animations]);

  useEffect(() => {
    if (currentGesture && !gestureState.current.isPlaying) {
      const possibleClipKeywords = GESTURE_TO_ANIMATION_MAP[currentGesture] || [currentGesture];
      const animationNames = Object.keys(animationsMap.current);
      
      let foundClipName: string | undefined;
      for (const keyword of possibleClipKeywords) {
        foundClipName = animationNames.find(name => name.toLowerCase().includes(keyword));
        if (foundClipName) break;
      }

      if (foundClipName) {
        const action = animationsMap.current[foundClipName];
        console.log(`Playing gesture: ${currentGesture} -> animation: ${foundClipName}`);
        mixer.current?.stopAllAction();
        action.reset().play();
        gestureState.current.isPlaying = true;
        idleAnimState.current.isPlaying = false;
      } else {
        console.warn(`Gesture '${currentGesture}' not found in animation map.`);
      }
    }
  }, [currentGesture]);

  useFrame((state, delta) => {
    const now = state.clock.elapsedTime;
    mixer.current?.update(delta);
    
    // --- LIP-SYNC (REFINED: NATURAL VISEMES & INTENSITY) ---
    // A curated list of visemes that produce a more natural, less exaggerated mouth movement.
    // This avoids visemes that can look like sneers or show too much teeth (e.g., 'viseme_E', 'viseme_I').
    const SAFE_VISEME_NAMES = [
        'viseme_aa', 'viseme_O', 'viseme_U', 'viseme_PP',
        'viseme_RR', 'viseme_nn', 'viseme_CH', 'viseme_DD', 'viseme_kk'
    ];
    
    const visemeKeys = Object.keys(visemes);
    if (visemeKeys.length > 0) {
        let intensity = 0;
        if (isSpeaking && getAudioVolume) {
            const volume = getAudioVolume();
            // Reduced the multiplier and adjusted the power curve for a more subtle animation.
            intensity = Math.pow(volume, 0.8) * 0.9;
        }

        lipSyncState.current.targetIntensity = MathUtils.lerp(
            lipSyncState.current.targetIntensity,
            Math.min(intensity, 1.0), // Clamp intensity
            delta * 15.0 // Reactivity
        );
        
        if (lipSyncState.current.targetIntensity > 0.1) {
            const timeSinceLastVisemeChange = now - lipSyncState.current.lastVisemeChangeTime;
            if (timeSinceLastVisemeChange > 0.09) {
                // Filter to only use the 'safe' visemes for a more natural look.
                const safeVisemeIndices = visemeKeys
                    .map((key, index) => ({ key, index }))
                    .filter(item => SAFE_VISEME_NAMES.includes(item.key))
                    .map(item => item.index);

                if (safeVisemeIndices.length > 0) {
                    let newIndex = lipSyncState.current.currentVisemeIndex;
                    while (newIndex === lipSyncState.current.currentVisemeIndex) {
                        newIndex = safeVisemeIndices[Math.floor(Math.random() * safeVisemeIndices.length)];
                    }
                    lipSyncState.current.currentVisemeIndex = newIndex;
                }
                lipSyncState.current.lastVisemeChangeTime = now;
            }
        } else {
            lipSyncState.current.currentVisemeIndex = -1;
        }

        visemeKeys.forEach((key, index) => {
            const visemeInfo = visemes[key];
            if (visemeInfo.mesh.morphTargetInfluences) {
                const influence = visemeInfo.mesh.morphTargetInfluences[visemeInfo.index];
                const isCurrentViseme = index === lipSyncState.current.currentVisemeIndex;
                
                const target = isCurrentViseme ? lipSyncState.current.targetIntensity : 0;
                
                const newInfluence = MathUtils.lerp(influence, target, delta * 25);
                visemeInfo.mesh.morphTargetInfluences[visemeInfo.index] = newInfluence;
            }
        });
    }


    const isPlayingClipAnimation = idleAnimState.current.isPlaying || gestureState.current.isPlaying;
    const pauseProcedural = isSpeaking || isPlayingClipAnimation;

    if (idleAnimations.current.length > 0 && !isSpeaking && !isPlayingClipAnimation && now > idleAnimState.current.nextTime) {
        idleAnimState.current.isPlaying = true;
        let nextAction: AnimationAction = idleAnimations.current[Math.floor(Math.random() * idleAnimations.current.length)];
        idleAnimState.current.currentAction = nextAction;
        nextAction.reset().play();
        const duration = nextAction.getClip().duration;
        idleAnimState.current.nextTime = now + duration + 10 + Math.random() * 10;
    }
    
    if (leftEyeBone && rightEyeBone) {
        const initialLeft = initialBoneRotations.current.get(leftEyeBone.uuid);
        const initialRight = initialBoneRotations.current.get(rightEyeBone.uuid);
        if (initialLeft && initialRight) {
            const lerpFactor = delta * 5;
            if (pauseProcedural) {
                leftEyeBone.rotation.x = MathUtils.lerp(leftEyeBone.rotation.x, initialLeft.x, lerpFactor);
                leftEyeBone.rotation.y = MathUtils.lerp(leftEyeBone.rotation.y, initialLeft.y, lerpFactor);
                leftEyeBone.rotation.z = MathUtils.lerp(leftEyeBone.rotation.z, initialLeft.z, lerpFactor);
                rightEyeBone.rotation.x = MathUtils.lerp(rightEyeBone.rotation.x, initialRight.x, lerpFactor);
                rightEyeBone.rotation.y = MathUtils.lerp(rightEyeBone.rotation.y, initialRight.y, lerpFactor);
                rightEyeBone.rotation.z = MathUtils.lerp(rightEyeBone.rotation.z, initialRight.z, lerpFactor);
            } else {
                if (now > eyeDartState.current.nextTime) {
                    const x = (Math.random() - 0.5) * 0.25;
                    const y = (Math.random() - 0.5) * 0.2;
                    eyeDartState.current.target.set(x, y);
                    eyeDartState.current.nextTime = now + 1.5 + Math.random() * 4;
                }
                leftEyeBone.rotation.y = MathUtils.lerp(leftEyeBone.rotation.y, eyeDartState.current.target.x, lerpFactor);
                leftEyeBone.rotation.x = MathUtils.lerp(leftEyeBone.rotation.x, eyeDartState.current.target.y, lerpFactor);
                leftEyeBone.rotation.z = MathUtils.lerp(leftEyeBone.rotation.z, initialLeft.z, lerpFactor);
                rightEyeBone.rotation.y = MathUtils.lerp(rightEyeBone.rotation.y, eyeDartState.current.target.x, lerpFactor);
                rightEyeBone.rotation.x = MathUtils.lerp(rightEyeBone.rotation.x, eyeDartState.current.target.y, lerpFactor);
                rightEyeBone.rotation.z = MathUtils.lerp(rightEyeBone.rotation.z, initialRight.z, lerpFactor);
            }
        }
    }

    if (spineBone) {
        const initialRotation = initialBoneRotations.current.get(spineBone.uuid);
        if (initialRotation) {
            const lerpFactor = delta * 1.5;
            if (pauseProcedural) {
                spineBone.rotation.x = MathUtils.lerp(spineBone.rotation.x, initialRotation.x, lerpFactor);
                spineBone.rotation.y = MathUtils.lerp(spineBone.rotation.y, initialRotation.y, lerpFactor);
                spineBone.rotation.z = MathUtils.lerp(spineBone.rotation.z, initialRotation.z, lerpFactor);
            } else {
                const breathFrequency = 0.6;
                const breathAmplitude = 0.015;
                const targetRotationX = initialRotation.x + Math.sin(now * breathFrequency) * breathAmplitude;
                spineBone.rotation.x = MathUtils.lerp(spineBone.rotation.x, targetRotationX, lerpFactor);
                spineBone.rotation.y = MathUtils.lerp(spineBone.rotation.y, initialRotation.y, lerpFactor);
                spineBone.rotation.z = MathUtils.lerp(spineBone.rotation.z, initialRotation.z, lerpFactor);
            }
        }
    }

    if (headBone) {
        const initialRotation = initialBoneRotations.current.get(headBone.uuid);
        if (initialRotation) {
            const lerpFactor = delta * 0.7;
            if (pauseProcedural) {
                headBone.rotation.x = MathUtils.lerp(headBone.rotation.x, initialRotation.x, lerpFactor);
                headBone.rotation.y = MathUtils.lerp(headBone.rotation.y, initialRotation.y, lerpFactor);
                headBone.rotation.z = MathUtils.lerp(headBone.rotation.z, initialRotation.z, lerpFactor);
            } else {
                const swayFrequency = 0.4;
                const swayAmplitude = 0.04;
                const targetSwayY = initialRotation.y + Math.sin(now * swayFrequency) * swayAmplitude;
                const targetSwayX = initialRotation.x + Math.cos(now * swayFrequency * 0.7) * (swayAmplitude * 0.6);
                headBone.rotation.y = MathUtils.lerp(headBone.rotation.y, targetSwayY, lerpFactor);
                headBone.rotation.x = MathUtils.lerp(headBone.rotation.x, targetSwayX, lerpFactor);
                headBone.rotation.z = MathUtils.lerp(headBone.rotation.z, initialRotation.z, lerpFactor);
            }
        }
    }
  });

  return <primitive object={scene} position={[0, -1.75, 0]} />;
};

export const Avatar: React.FC<ModelProps> = ({ modelUrl, isSpeaking, currentGesture, getAudioVolume }) => {
  return (
    <Canvas 
      camera={{ position: [0, 0, 1.2], fov: 50 }}
      shadows
      className="w-full h-full"
    >
      <ambientLight intensity={1.5} />
      <directionalLight 
        position={[3, 5, 5]} 
        intensity={2.0} 
        castShadow={true} 
      />
      <Suspense fallback={null}>
        <LilyModel modelUrl={modelUrl} isSpeaking={isSpeaking} currentGesture={currentGesture} getAudioVolume={getAudioVolume} />
      </Suspense>
      <OrbitControls 
        target={[0, 0.1, 0]} // Target the head area
        enableZoom={false}
        minPolarAngle={Math.PI / 2.5}
        maxPolarAngle={Math.PI / 1.8}
        minAzimuthAngle={-Math.PI / 8}
        maxAzimuthAngle={Math.PI / 8}
      />
    </Canvas>
  );
};
