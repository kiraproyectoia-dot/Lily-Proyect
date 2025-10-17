
import React, { Suspense, useEffect, useRef, useState } from 'react';
// FIX: AnimationMixer and other 3D types are part of the 'three' library, not '@react-three/fiber'.
// This resolves module export errors for AnimationMixer, AnimationAction, Bone, etc., and subsequent type errors.
// FIX: Removed `type` keyword from `ThreeElements` import to ensure it's available for JSX global augmentation.
import { Canvas, useFrame, ThreeElements } from '@react-three/fiber';
import { AnimationMixer, AnimationAction, LoopOnce, Bone, SkinnedMesh, Vector2, Euler, MathUtils } from 'three';
import { useGLTF, OrbitControls } from '@react-three/drei';

// FIX: The project's TypeScript configuration has trouble resolving JSX types correctly.
// To fix this, we'll use declaration merging. First, we extend IntrinsicElements
// with ThreeElements for react-three-fiber components. Then, in a separate declaration,
// we add the standard HTML elements that are missing. This two-step process
// ensures both sets of components are correctly typed.
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // FIX: Manually adding standard HTML and SVG elements because React's global JSX types
      // are not being picked up correctly in this project's configuration. This resolves
      // errors like "Property 'div' does not exist on type 'JSX.IntrinsicElements'".
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
      // FIX: Manually add R3F elements that are not being picked up from ThreeElements to fix JSX errors.
      primitive: ThreeElements['primitive'];
      ambientLight: ThreeElements['ambientLight'];
      directionalLight: ThreeElements['directionalLight'];
    }
  }
}

interface ModelProps {
  modelUrl: string;
  isSpeaking: boolean;
}

// State for an individual morph target to make the system more robust
interface MorphTargetInfo {
  mesh: SkinnedMesh;
  index: number;
}


const LilyModel: React.FC<ModelProps> = ({ modelUrl, isSpeaking }) => {
  const { scene, animations } = useGLTF(modelUrl);
  // FIX: Explicitly initialize useRef with null. While useRef() with no arguments is valid, the project's brittle setup might cause issues with the no-argument overload. This provides an initial value, satisfying the error "Expected 1 arguments, but got 0".
  const mixer = useRef<AnimationMixer | null>(null);

  // State for animations
  const [jawMorph, setJawMorph] = useState<MorphTargetInfo | null>(null);
  const [headBone, setHeadBone] = useState<Bone | null>(null);
  const [spineBone, setSpineBone] = useState<Bone | null>(null);
  const [leftEyeBone, setLeftEyeBone] = useState<Bone | null>(null);
  const [rightEyeBone, setRightEyeBone] = useState<Bone | null>(null);
  const [idleAnimations, setIdleAnimations] = useState<AnimationAction[]>([]);
  
  // Refs for animation state and initial bone positions
  const eyeDartState = useRef({ nextTime: 3, target: new Vector2() });
  const idleAnimState = useRef({ nextTime: 15, isPlaying: false, currentAction: null as AnimationAction | null });
  const initialBoneRotations = useRef(new Map<string, Euler>());

  // One-time setup for animations and scene traversal
  useEffect(() => {
    if (!scene || !animations) return;
    
    // FIX: The AnimationMixer constructor requires the root object of the animation (the scene) as an argument.
    // The constructor for AnimationMixer requires the scene object to animate.
    // FIX: Pass the 'scene' object to the AnimationMixer constructor.
    mixer.current = new AnimationMixer(scene);

    const onAnimationFinished = (event: any) => {
        if (idleAnimations.some(action => action.getClip().uuid === event.action.getClip().uuid)) {
            idleAnimState.current.isPlaying = false;
        }
    };
    mixer.current.addEventListener('finished', onAnimationFinished);
    
    // Find and configure all potential idle animations
    const potentialIdleNames = ['hair', 'yawn', 'look', 'nod', 'shake', 'idle'];
    const foundIdleAnimations = animations
        .filter(clip => potentialIdleNames.some(name => clip.name.toLowerCase().includes(name)))
        .map(clip => {
            const action = mixer.current!.clipAction(clip);
            // FIX: The setLoop method requires a second argument for the number of repetitions.
            // For LoopOnce, this should be 1.
            // FIX: Provide the required second argument (repetitions) to the setLoop method.
            action.setLoop(LoopOnce, 1);
            action.clampWhenFinished = true;
            return action;
        });

    if (foundIdleAnimations.length > 0) {
        setIdleAnimations(foundIdleAnimations);
        console.log(`AVATAR ALIVE: Success! Found ${foundIdleAnimations.length} idle animations.`, foundIdleAnimations.map(a => a.getClip().name));
    } else {
        console.warn("AVATAR ALIVE: Could not find any suitable idle animation clips in the model.");
    }
    
    let jawFound = false;
    let headFound = false;
    let spineFound = false;
    let leftEyeFound = false;
    let rightEyeFound = false;
    // Jaw open is for simple talking animation.
    const jawMorphNames = ['jawopen', 'mouthopen'];

    scene.traverse((node) => {
       // --- Find Bones for Procedural Animation ---
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
      
      // --- Find Morph Targets for Facial Animation ---
      if (node instanceof SkinnedMesh && node.morphTargetDictionary) {
        const dictionary = node.morphTargetDictionary;
        
        // Find Jaw Morph Target (Lip-Sync)
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

  // Animate the avatar every frame.
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    mixer.current?.update(delta);

    const isPlayingClipAnimation = idleAnimState.current.isPlaying;

    // --- Dynamic Idle Animation Player (Non-Repeating) ---
    if (idleAnimations.length > 0 && !isSpeaking && !isPlayingClipAnimation && t > idleAnimState.current.nextTime) {
        idleAnimState.current.isPlaying = true;
        
        let nextAction: AnimationAction;
        const lastAction = idleAnimState.current.currentAction;

        if (idleAnimations.length > 1 && lastAction) {
            // Filter out the last played animation to avoid repetition
            const possibleNextActions = idleAnimations.filter(
                action => action.getClip().uuid !== lastAction.getClip().uuid
            );
            nextAction = possibleNextActions[Math.floor(Math.random() * possibleNextActions.length)];
        } else {
            // If it's the first time or there's only one animation, pick any
            nextAction = idleAnimations[Math.floor(Math.random() * idleAnimations.length)];
        }
        
        idleAnimState.current.currentAction = nextAction;
        nextAction.reset().play();
        
        // Schedule the next possible animation after this one finishes
        const duration = nextAction.getClip().duration;
        idleAnimState.current.nextTime = t + duration + 10 + Math.random() * 10; // 10-20 sec wait
    }

    // --- Lip-Sync Logic ---
    if (jawMorph?.mesh?.morphTargetInfluences) {
        let targetInfluence = isSpeaking ? (0.3 + Math.sin(t * 20) * 0.4) : 0;
        jawMorph.mesh.morphTargetInfluences[jawMorph.index] = MathUtils.lerp(
          jawMorph.mesh.morphTargetInfluences[jawMorph.index],
          targetInfluence,
          delta * 25
        );
    }
    
    // --- Procedural Animations Coordination Flag ---
    const pauseProcedural = isSpeaking || isPlayingClipAnimation;
    
    // --- Eye Darting (Procedural) ---
    if (leftEyeBone && rightEyeBone && !pauseProcedural) {
        if (t > eyeDartState.current.nextTime) {
            const x = (Math.random() - 0.5) * 0.25;
            const y = (Math.random() - 0.5) * 0.2;
            eyeDartState.current.target.set(x, y);
            eyeDartState.current.nextTime = t + 1.5 + Math.random() * 4; // Dart every ~1.5-5.5s
        }
        const lerpFactor = delta * 5;
        leftEyeBone.rotation.y = MathUtils.lerp(leftEyeBone.rotation.y, eyeDartState.current.target.x, lerpFactor);
        leftEyeBone.rotation.x = MathUtils.lerp(leftEyeBone.rotation.x, eyeDartState.current.target.y, lerpFactor);
        rightEyeBone.rotation.y = MathUtils.lerp(rightEyeBone.rotation.y, eyeDartState.current.target.x, lerpFactor);
        rightEyeBone.rotation.x = MathUtils.lerp(rightEyeBone.rotation.x, eyeDartState.current.target.y, lerpFactor);
    }

    // --- Breathing Animation (Procedural) ---
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

    // --- Idle Head Sway (Procedural) ---
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

export const Avatar: React.FC<ModelProps> = ({ modelUrl, isSpeaking }) => {
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
        <LilyModel modelUrl={modelUrl} isSpeaking={isSpeaking} />
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
