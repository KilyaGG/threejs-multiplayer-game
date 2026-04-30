import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function initScene() {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    scene.fog = new THREE.FogExp2(0x020205, 0.01);
    renderer.setPixelRatio(window.devicePixelRatio); 
    renderer.setSize(window.innerWidth, window.innerHeight);


    const controls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(5, 5, 5); // Отойдем подальше, чтобы видеть центр
    controls.update();

    const loader = new THREE.TextureLoader();
        
    loader.load(
        '/assets/skybox.png',
        (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.background = texture;
        }
    );
    


    document.body.appendChild(renderer.domElement);
    camera.position.z = 5;

    window.addEventListener('resize', () => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;

        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(newWidth, newHeight);
    });

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    return { scene, camera, controls };
}
