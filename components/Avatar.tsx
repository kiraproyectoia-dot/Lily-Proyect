
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
}

interface MorphTargetInfo {
  mesh: SkinnedMesh;
  index: number;
}

// Maps simple gesture names from the prompt to potential animation clip names in the 3D model.
// This might need adjustment if the model's animation names are different.
const GESTURE_TO_ANIMATION_MAP: Record<string, string[]> = {
    nod: ['nod', 'yes'],
    shake: ['shake', 'no'],
    thoughtful: ['lookaround', 'headtilt'],
    idle_yawn: ['yawn'],
    idle_hair: ['hair'],
};

const LilyModel: React.FC<ModelProps> = ({ modelUrl, isSpeaking, currentGesture }) => {
  const { scene, animations } = useGLTF(modelUrl);
  const mixer = useRef<AnimationMixer | null>(null);

  const [jawMorph, setJawMorph] = useState<MorphTargetInfo | null>(null);
  const [headBone, setHeadBone] = useState<Bone | null>(null);
  const [spineBone, setSpineBone] = useState<Bone | null>(null);
  const [leftEyeBone, setLeftEyeBone] = useState<Bone | null>(null);
  const [rightEyeBone, setRightEyeBone] = useState<Bone | null>(null);
  
  const animationsMap = useRef<Record<string, AnimationAction>>({});
  const idleAnimations = useRef<AnimationAction[]>([]);
  
  const eyeDartState = useRef({ nextTime: 3, target: new Vector2() });
  const idleAnimState = useRef({ nextTime: 15, isPlaying: false, currentAction: null as AnimationAction | null });
  const gestureState = useRef({ isPlaying: false });
  const initialBoneRotations = useRef(new Map<string, Euler>());

  useEffect(() => {
    if (!scene || !animations) return;
    
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
    
    console.log('AVATAR ALIVE: Available animation clips:', Object.keys(animationsMap.current));

    if (idleAnimations.current.length > 0) {
        console.log(`AVATAR ALIVE: Success! Found ${idleAnimations.current.length} idle animations.`);
    } else {
        console.warn("AVATAR ALIVE: Could not find any suitable idle animation clips in the model.");
    }
    
    let jawFound = false, headFound = false, spineFound = false, leftEyeFound = false, rightEyeFound = false;
    const jawMorphNames = ['jawopen', 'mouthopen'];

    scene.traverse((node) => {
       if (node instanceof Bone) {
        if (!initialBoneRotations.current.has(node.uuid)) {
            initialBoneRotations.current.set(node.uuid, node.rotation.clone());
        }
        const nodeName = node.name.toLowerCase();
        if (!headFound && nodeName.includes('head')) { setHeadBone(node); headFound = true; }
        if (!spineFound && nodeName.includes('spine')) { setSpineBone(node); spineFound = true; }
        if (!leftEyeFound && (nodeName.includes('lefteye') || nodeName.includes('eye_l'))) { setLeftEyeBone(node); leftEyeFound = true; }
        if (!rightEyeFound && (nodeName.includes('righteye') || nodeName.includes('eye_r'))) { setRightEyeBone(node); rightEyeFound = true; }
      }
      
      if (node instanceof SkinnedMesh && node.morphTargetDictionary) {
        const dictionary = node.morphTargetDictionary;
        if (!jawFound) {
          const jawKey = Object.keys(dictionary).find(key => jawMorphNames.includes(key.toLowerCase()));
          if (jawKey) { setJawMorph({ mesh: node, index: dictionary[jawKey] }); jawFound = true; }
        }
      }
    });
    
    if (!jawFound) console.error("LIP-SYNC FAILED: Could not find jaw morph target.");
    if (!headFound) console.warn("AVATAR ALIVE: Head bone not found. Idle sway disabled.");
    if (!spineFound) console.warn("AVATAR ALIVE: Spine bone not found. Breathing disabled.");
    if (!leftEyeFound || !rightEyeFound) console.warn("AVATAR ALIVE: Eye bones not found. Eye darting disabled.");

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
        mixer.current?.stopAllAction(); // Stop idle animations to play the gesture
        action.reset().play();
        gestureState.current.isPlaying = true;
        idleAnimState.current.isPlaying = false; // Ensure idle state knows a gesture is playing
      } else {
        console.warn(`Gesture '${currentGesture}' not found in animation map.`);
      }
    }
  }, [currentGesture]);


  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    mixer.current?.update(delta);

    const isPlayingClipAnimation = idleAnimState.current.isPlaying || gestureState.current.isPlaying;

    if (idleAnimations.current.length > 0 && !isSpeaking && !isPlayingClipAnimation && t > idleAnimState.current.nextTime) {
        idleAnimState.current.isPlaying = true;
        let nextAction: AnimationAction = idleAnimations.current[Math.floor(Math.random() * idleAnimations.current.length)];
        idleAnimState.current.currentAction = nextAction;
        nextAction.reset().play();
        const duration = nextAction.getClip().duration;
        idleAnimState.current.nextTime = t + duration + 10 + Math.random() * 10;
    }

    if (jawMorph?.mesh?.morphTargetInfluences) {
        let targetInfluence = isSpeaking ? (0.3 + Math.sin(t * 20) * 0.4) : 0;
        jawMorph.mesh.morphTargetInfluences[jawMorph.index] = MathUtils.lerp(
          jawMorph.mesh.morphTargetInfluences[jawMorph.index],
          targetInfluence,
          delta * 25
        );
    }
    
    const pauseProcedural = isSpeaking || isPlayingClipAnimation;
    
    if (leftEyeBone && rightEyeBone && !pauseProcedural) {
        if (t > eyeDartState.current.nextTime) {
            const x = (Math.random() - 0.5) * 0.25;
            const y = (Math.random() - 0.5) * 0.2;
            eyeDartState.current.target.set(x, y);
            eyeDartState.current.nextTime = t + 1.5 + Math.random() * 4;
        }
        const lerpFactor = delta * 5;
        leftEyeBone.rotation.y = MathUtils.lerp(leftEyeBone.rotation.y, eyeDartState.current.target.x, lerpFactor);
        leftEyeBone.rotation.x = MathUtils.lerp(leftEyeBone.rotation.x, eyeDartState.current.target.y, lerpFactor);
        rightEyeBone.rotation.y = MathUtils.lerp(rightEyeBone.rotation.y, eyeDartState.current.target.x, lerpFactor);
        rightEyeBone.rotation.x = MathUtils.lerp(rightEyeBone.rotation.x, eyeDartState.current.target.y, lerpFactor);
    }

    if (spineBone) {
        const initialRotation = initialBoneRotations.current.get(spineBone.uuid);
        if (initialRotation) {
            const breathFrequency = 0.6;
            const breathAmplitude = 0.015;
            const targetRotationX = pauseProcedural
                ? initialRotation.x
                : initialRotation.x + Math.sin(t * breathFrequency) * breathAmplitude;
            spineBone.rotation.x = MathUtils.lerp(spineBone.rotation.x, targetRotationX, delta * 1.5);
        }
    }

    if (headBone) {
        const initialRotation = initialBoneRotations.current.get(headBone.uuid);
        if (initialRotation) {
            const swayFrequency = 0.4;
            const swayAmplitude = 0.04;
            const targetSwayY = pauseProcedural
                ? initialRotation.y : initialRotation.y + Math.sin(t * swayFrequency) * swayAmplitude;
            const targetSwayX = pauseProcedural
                ? initialRotation.x : initialRotation.x + Math.cos(t * swayFrequency * 0.7) * (swayAmplitude * 0.6);
            headBone.rotation.y = MathUtils.lerp(headBone.rotation.y, targetSwayY, delta * 0.7);
            headBone.rotation.x = MathUtils.lerp(headBone.rotation.x, targetSwayX, delta * 0.7);
        }
    }
  });

  return <primitive object={scene} position={[0, -1.75, 0]} />;
};

export const Avatar: React.FC<ModelProps> = ({ modelUrl, isSpeaking, currentGesture }) => {
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
        <LilyModel modelUrl={modelUrl} isSpeaking={isSpeaking} currentGesture={currentGesture} />
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
