import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { io } from 'socket.io-client';

//SOCKET IO

const socket = io('http://localhost:3000');
let mySocketID;

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
        console.log(`Получил данные о мире, длинной ${worldData.length}! Начинаю обработку...`)
        printWorld(worldData);
        initialiseEarth(worldData.length);
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

    function initialiseEarth(size) {
        const geometry = new THREE.BoxGeometry(size, 1, size);
        const material = new THREE.MeshBasicMaterial( { color: 0x50C878 } );
        const earth = new THREE.Mesh( geometry, material );
        scene.add( earth );
    }

    function printWorld(worldData) {
        window.tookPlaces = [];
        worldData.forEach(structure => {
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





    function initialisePlayerControls(moveValue) {
        document.addEventListener('keydown', function(event) {
            const key = event.code;
            let posX;
            let posZ;
            let requiredKeyPressed = false;
            if (key === "KeyA") {
                posX = player.position.x - moveValue;
                posZ = player.position.z;
                requiredKeyPressed = true;
            }
            if (key === "KeyD") {
                posX = player.position.x + moveValue;
                posZ = player.position.z;
                requiredKeyPressed = true;
            }
            if (key === "KeyW") {
                posX = player.position.x;
                posZ = player.position.z - moveValue;
                requiredKeyPressed = true;
            }
            if (key === "KeyS") {
                posX = player.position.x;
                posZ = player.position.z + moveValue;
                requiredKeyPressed = true;
            }

            if (SomethingLikeCollision(posX, posZ) && requiredKeyPressed) {
                player.position.x = posX;
                player.position.z = posZ;
                requiredKeyPressed = false;
                
                const movedata = {
                    id: mySocketID,
                    position: player.position
                }

                socket.emit('playerMove', movedata);
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
        initialisePlayerControls(playerSpeed);
    }

    initialiseGame();


    camera.position.z = 5;

    function animate() {
    renderer.render( scene, camera );
    }
    renderer.setAnimationLoop( animate );
});