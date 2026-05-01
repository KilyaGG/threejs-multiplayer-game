import * as THREE from 'three';

export function initScene() {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020205, 0.01);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    
    // Skybox
    const loader = new THREE.TextureLoader();
    loader.load(
        '/assets/skybox.png',
        (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.background = texture;
        }
    );
    
    // Освещение
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);
    
    // Пол
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);

    // --- ТЕСТОВАЯ КАРТА (на основе test_map.ts) ---
    const mapMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.8 });

    // Стены
    const wallGeometry = new THREE.BoxGeometry(20, 4, 1);
    const wall1 = new THREE.Mesh(wallGeometry, mapMaterial);
    wall1.position.set(0, 2, -10);
    scene.add(wall1);

    const wall2 = new THREE.Mesh(wallGeometry, mapMaterial);
    wall2.position.set(0, 2, 10);
    scene.add(wall2);

    const wallGeometrySide = new THREE.BoxGeometry(1, 4, 20);
    const wall3 = new THREE.Mesh(wallGeometrySide, mapMaterial);
    wall3.position.set(-10, 2, 0);
    scene.add(wall3);

    const wall4 = new THREE.Mesh(wallGeometrySide, mapMaterial);
    wall4.position.set(10, 2, 0);
    scene.add(wall4);

    // Препятствия
    const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7 });

    const obstacle1 = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 2), obstacleMaterial);
    obstacle1.position.set(-3, 0.5, -3);
    scene.add(obstacle1);

    const obstacle2 = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 2), obstacleMaterial);
    obstacle2.position.set(3, 0.5, 3);
    scene.add(obstacle2);

    const obstacle3 = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 3), obstacleMaterial);
    obstacle3.position.set(0, 1, 0);
    scene.add(obstacle3);

    // Маркеры спавна
    const spawnMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const spawnGeometry = new THREE.SphereGeometry(0.3, 8, 8);

    const spawn1 = new THREE.Mesh(spawnGeometry, spawnMaterial);
    spawn1.position.set(-5, 0.5, -5);
    scene.add(spawn1);

    const spawn2 = new THREE.Mesh(spawnGeometry, spawnMaterial);
    spawn2.position.set(5, 0.5, -5);
    scene.add(spawn2);

    const spawn3 = new THREE.Mesh(spawnGeometry, spawnMaterial);
    spawn3.position.set(-5, 0.5, 5);
    scene.add(spawn3);

    const spawn4 = new THREE.Mesh(spawnGeometry, spawnMaterial);
    spawn4.position.set(5, 0.5, 5);
    scene.add(spawn4);

    console.log('Test map loaded');

    document.body.appendChild(renderer.domElement);
    
    // Блокировка курсора для FPS управления
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