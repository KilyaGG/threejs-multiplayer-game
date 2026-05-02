import * as THREE from 'three';

export function initScene() {
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
        // --- ВАЖНЫЕ НАСТРОЙКИ ДЛЯ КРАСИВОГО ЦВЕТА ---
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // Делает свет более реалистичным
    renderer.toneMappingExposure = 1.0; 
    renderer.outputColorSpace = THREE.SRGBColorSpace; // Правильная цветопередача текстур
    // --------------------------------------------

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // 1. Полусферический свет (имитирует небо и отражение от земли)
    // Освещает всё равномерно, убирает "черные" провалы в тенях
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 3.0);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);
    
    // 2. Направленный свет (солнце)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5); // Чуть ярче
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    
    // Настройка области теней (убедись, что модель попадает в эти границы)
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.bias = -0.001; // Начни с этого значения
    dirLight.shadow.normalBias = 0.02; 
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    dirLight.shadow.mapSize.set(2048, 2048);
    
    scene.add(dirLight);

    document.body.appendChild(renderer.domElement);
    
    renderer.domElement.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });

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

    return { scene, camera, renderer };
}