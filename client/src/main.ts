import { connect } from './connect';
import { initScene } from './game';
import { PlayerController } from './PlayerController';
import { GameManager } from './objects/GameManager';
import { MapLoader } from './objects/MapLoader';    
import { getMapConfig } from './maps/index';
import * as THREE from 'three';

async function start() {
    const loginUI = document.getElementById('login-ui') as HTMLElement;
    const joinBtn = document.getElementById('join-btn') as HTMLButtonElement;
    const nameInput = document.getElementById('username') as HTMLInputElement;
    const mapSelect = document.getElementById('map-select') as HTMLSelectElement;

    const performLogin = () => {
        const username = nameInput.value.trim() || "Newbie";
        const mapName = mapSelect?.value || 'map1';
        handleJoin(username, loginUI, mapName);
    };

    joinBtn.onclick = performLogin;

    window.onkeydown = (e) => {
        if (e.key === 'Enter') performLogin();
    };
}

async function handleJoin(username: string, loginUI: HTMLElement, mapName: string = 'map1') {
    loginUI.style.display = 'none';
    
    const { scene, camera, renderer } = initScene();
    const gameManager = new GameManager(scene);
    const mapLoader = new MapLoader(scene);
    
    // Загружаем карту
    const mapConfig = getMapConfig(mapName);
    if (mapConfig) {
        try {
            await mapLoader.loadMap(mapConfig);
            console.log(`Map ${mapName} loaded`);
            
            // Скрываем маркеры спавна в релизе
            // mapLoader.toggleSpawnMarkers(false);
            
        } catch (error) {
            console.error(`Failed to load map ${mapName}:`, error);
        }
    }
    
    const room = await connect({ name: username, map: mapName });
    const playerController = new PlayerController(camera, room);
    
    let lastUpdateTime = performance.now();
    let lastServerUpdate = 0;
    const serverUpdateInterval = 33;
    
    function gameLoop() {
        requestAnimationFrame(gameLoop);
        
        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - lastUpdateTime) / 1000, 0.1);
        lastUpdateTime = currentTime;
        
        playerController.update(deltaTime);
        
        if (currentTime - lastServerUpdate > serverUpdateInterval) {
            if (room.state && room.state.players) {
                const myPlayer = room.state.players.get(room.sessionId);
                if (myPlayer && myPlayer.position) {
                    playerController.setServerPosition(
                        myPlayer.position.x,
                        myPlayer.position.y,
                        myPlayer.position.z
                    );
                }
            }
            lastServerUpdate = currentTime;
        }
        
        playerController.interpolate(deltaTime);
        renderer.render(scene, camera);
    }
    
    setupRoomHandlers(room, gameManager, playerController);
    gameLoop();
}

function setupRoomHandlers(room: any, gameManager: GameManager, playerController: PlayerController) {
    room.onStateChange((state: any) => {
        state.players.forEach((player: any, sessionId: string) => {
            if (sessionId === room.sessionId) return;
            
            if (!gameManager.players.has(sessionId)) {
                console.log(`New player: ${sessionId}`, player.authData?.name);
                gameManager.addPlayer(sessionId, player);
            } else {
                gameManager.updatePlayerFromServer(sessionId, player.position);
            }
        });
        
        gameManager.players.forEach((player, sessionId) => {
            if (!state.players.has(sessionId)) {
                console.log(`Player left: ${sessionId}`);
                gameManager.removePlayer(sessionId);
            }
        });
    });
    
    room.onMessage("broadcast", (message: any) => {
        console.log(`Chat message: ${message.content} from ${message.sender}`);
    });
    
    room.onMessage("playerJoined", (data: any) => {
        console.log(`${data.name} joined the game`);
    });
    
    room.onMessage("playerLeft", (data: any) => {
        console.log(`${data.name} left the game`);
    });
    
    room.onError((code: number, message: string) => {
        console.error(`Room error: ${code} - ${message}`);
    });
    
    room.onLeave((code: number) => {
        console.log(`Left room with code: ${code}`);
    });
}

start();