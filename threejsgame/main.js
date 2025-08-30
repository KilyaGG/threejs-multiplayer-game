import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { io } from 'socket.io-client';

//SOCKET IO

const socket = io('http://localhost:3000');
let mySocketID;
let loadedChunks = [];
window.tookPlaces = [];
socket.on('connect', () => { 
    mySocketID = socket.id; 
    console.log(`My socket id: ${mySocketID}`);

    // Слушаем сообщения от сервера
    socket.on('playerMove', (data) => {
        UpdatePlayer(data.id, data.position)
    });

    socket.on('playerConnect', (data) => {
        console.log(`Опа а кто это тут у нас? Да это же ${data.id}!`);
        addNewPlayer(data.id, data.position);
    });

    socket.on('worldData-new-user', (worldData) => {
        console.log(`Получил данные о мире, длинной ${worldData.length} чанков! Начинаю обработку...`)
        printWorld(worldData);
    });

    socket.on('players-new-user', (players) => {
        players.forEach(player => {
            addNewPlayer(player.id, player.position);
        });
    });

    socket.on('player-disconnect', (id) => {
        players.forEach(function(player, index) {
            if (player.id === id) {
                RemovePlayer(player, index);
            }
        });
    });


    //CONFIG

    window.players = [];

    class Player {
        constructor(id, object) {
            this.id = id;
            this.object = object;
        }
    }

    const loader = new GLTFLoader();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    const controls = new OrbitControls( camera, renderer.domElement );
    controls.target.set( 0, 0, 0 );

    function initialisePlayer(speed) {
        window.player = createACoolCubeWithEdges(0x000000, 1);
        window.playerSpeed = speed;
        scene.add(player);
        player.position.y += 1;

        const playerInstance = {
            id: mySocketID,
            position: player.position
        };
        const textSprite = createTextSprite('You', {
            color: '#ff0000ff'
        });
        player.add(textSprite);
        textSprite.position.y += 1;
        socket.emit('playerConnect', playerInstance);
            
        }

    function addNewPlayer(id, playerCoords) {
        const newPlayer = createACoolCubeWithEdges(0x000000, 1);
        scene.add(newPlayer);
        const playerClassInstance = new Player();
        playerClassInstance.id = id;
        playerClassInstance.object = newPlayer;

        const textSprite = createTextSprite(id, {
            color: '#ff0000ff'
        });
        newPlayer.add(textSprite);
        textSprite.position.y += 1;

        players.push(playerClassInstance);
        newPlayer.position.x = playerCoords.x;
        newPlayer.position.y = playerCoords.y;
        newPlayer.position.z = playerCoords.z;
    }

    function RemovePlayer(player, index) {
        scene.remove(player.object);
        players.splice(index, 1);
        console.log(`Игрок отключился или был удален: ${player.id}`);
    }

    function createACoolCubeWithEdges(color, size) {
        const basicGeometry = new THREE.BoxGeometry( size, size, size );
        const edges = new THREE.EdgesGeometry(basicGeometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        const edgesGeometry = new THREE.LineSegments(edges, edgesMaterial);

        const cubeMaterial = new THREE.MeshBasicMaterial( { color: color } );
        const cubeGeometry = new THREE.Mesh(basicGeometry, cubeMaterial);

        const cube = new THREE.Group();
        cube.add(edgesGeometry);
        cube.add(cubeGeometry);
        return cube;
    }

    function initialiseEarth(size, position) {
        const geometry = new THREE.BoxGeometry(size, 1, size);
        const material = new THREE.MeshBasicMaterial( { color: 0x50C878 } );
        const earth = new THREE.Mesh( geometry, material );
        scene.add( earth );
        earth.position.x = position.x;
        earth.position.z = position.z;
    }


    function printWorld(worldData) {
        let chunksToWork = [];
        if (loadedChunks.length != 0) {
            worldData.forEach(object => {
                if (object) {
                    let chunkNotLoadedYet = true;
                    loadedChunks.forEach(chunk => {
                        if (chunk.middle.x === object.middle.x && chunk.middle.z === object.middle.z) {
                            chunkNotLoadedYet = false;
                        }
                    });
                    if (chunkNotLoadedYet) {
                        chunksToWork.push(object);
                    }
                }
            });
        } else {
            chunksToWork = worldData;
        }
        chunksToWork.forEach((chunk) => {
            loadedChunks.push(chunk);
            initialiseEarth(chunk.length, chunk.middle);
            chunk.chunkBlockdata.forEach(structure => {
                const coords = {
                    x: structure.x,
                    z: structure.z
                };
                tookPlaces.push(coords);
                const structureColor = structure.color;
                const size = structure.size;
                const height = structure.height;
                for (let i = 1; i <= height; i++) {
                    const structure = createACoolCubeWithEdges(structureColor, size);
                    scene.add(structure);
                    structure.position.x = coords.x;
                    structure.position.y += i;
                    structure.position.z = coords.z;
                }
            });
        });        
    }

    function createTextSprite(text, options = {}) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = 256;
        canvas.height = 64;
        
        context.fillStyle = options.backgroundColor || 'rgba(0, 0, 0, 0)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = '12px Arial';
        context.fillStyle = options.color || '#ffffff';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        
        sprite.scale.set(5, 1, 2);
        return sprite;
    }

    function SomethingLikeCollision(x, z) {
        let isPlaceFree = true;
        const coordsToCheck = {
            x: x,
            z: z
        };
        tookPlaces.forEach(place => {
            if (place.x === coordsToCheck.x && place.z === coordsToCheck.z) {
                isPlaceFree = false;
                console.log(`тут занято ${x}, ${z}`);
            }
        });

        return isPlaceFree;
    }


    function initialisePlayerControls(moveValue, camera) {
        document.addEventListener('keydown', function(event) {
            const key = event.code;
            let moveDirection = new THREE.Vector3();
            let requiredKeyPressed = false;
            
            // Получаем направление камеры
            const cameraDirection = new THREE.Vector3();
            camera.getWorldDirection(cameraDirection);
            cameraDirection.y = 0; // Игнорируем вертикальную составляющую
            cameraDirection.normalize();
            
            // Перпендикулярное направление для движения влево/вправо
            const cameraRight = new THREE.Vector3();
            cameraRight.crossVectors(camera.up, cameraDirection).normalize();
            
            if (key === "KeyA") {
                // Движение влево относительно камеры на 1 единицу
                moveDirection.copy(cameraRight).multiplyScalar(1);
                requiredKeyPressed = true;
            }
            if (key === "KeyD") {
                // Движение вправо относительно камеры на 1 единицу
                moveDirection.copy(cameraRight).multiplyScalar(-1);
                requiredKeyPressed = true;
            }
            if (key === "KeyW") {
                // Движение вперед относительно камеры на 1 единицу
                moveDirection.copy(cameraDirection).multiplyScalar(1);
                requiredKeyPressed = true;
            }
            if (key === "KeyS") {
                // Движение назад относительно камеры на 1 единицу
                moveDirection.copy(cameraDirection).multiplyScalar(-1);
                requiredKeyPressed = true;
            }

            if (key === "KeyP") {
                const pos = player.position;
                controls.target.set(pos.x, pos.y, pos.z);
                camera.position.set(pos.x + 3, pos.y + 3, pos.z + 3);
                controls.update();
            }
            const oldPosition = player.position.clone();
            player.position.add(moveDirection);
            if (SomethingLikeCollision(Math.round(player.position.x), Math.round(player.position.z)) && requiredKeyPressed) {
                
                player.position.x = Math.round(player.position.x);
                player.position.z = Math.round(player.position.z);
                requiredKeyPressed = false;
                
                const pos = player.position;
                controls.target.set(pos.x, pos.y, pos.z);
                camera.position.add(moveDirection);
                controls.update();
                
                const movedata = {
                    id: mySocketID,
                    position: player.position
                }
                
                socket.emit('playerMove', movedata);
            } else {
                player.position.set(oldPosition.x, oldPosition.y, oldPosition.z);
            }

        });
    }

    function UpdatePlayer(id, position) {
        players.forEach(player => {
            if (player.id === id) {
                let playerPos = player.object.position;
                playerPos.x = position.x;
                playerPos.y = position.y;
                playerPos.z = position.z;
            }
        });
    }

    function initialiseGame() {
        initialisePlayer(1);
        initialisePlayerControls(playerSpeed, camera);
    }

    initialiseGame();


    camera.position.z = 5;

    function animate() {
    renderer.render( scene, camera );
    }
    renderer.setAnimationLoop( animate );
});