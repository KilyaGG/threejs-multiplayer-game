import { connect } from './connect';
import { initScene } from './game';
import { PlayerController } from './PlayerController';
import { GameManager } from './objects/GameManager';
import * as THREE from 'three';

async function start() {
    const loginUI = document.getElementById('login-ui') as HTMLElement;
    const joinBtn = document.getElementById('join-btn') as HTMLButtonElement;
    const nameInput = document.getElementById('username') as HTMLInputElement;

    const performLogin = () => {
        const username = nameInput.value.trim() || "Newbie";
        handleJoin(username, loginUI);
    };

    joinBtn.onclick = performLogin;

    window.onkeydown = (e) => {
        if (e.key === 'Enter') performLogin();
    };
}

async function handleJoin(username: string, loginUI: HTMLElement) {
    loginUI.style.display = 'none';
    
    const { scene, camera, renderer } = initScene();
    const gameManager = new GameManager(scene);
    
    const room = await connect({ name: username });
    const playerController = new PlayerController(camera, room);
    
    camera.position.set(0, 1.7, 0);
    
    let lastUpdateTime = performance.now();
    let lastServerUpdate = 0;
    const serverUpdateInterval = 33; // ~30 обновлений в секунду
    
    // Игровой цикл
    function gameLoop() {
        requestAnimationFrame(gameLoop);
        
        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - lastUpdateTime) / 1000, 0.1);
        lastUpdateTime = currentTime;
        
        // Отправляем ввод на сервер
        playerController.update(deltaTime);
        
        // Получаем позицию от сервера и устанавливаем как цель для интерполяции
        if (currentTime - lastServerUpdate > serverUpdateInterval) {
            if (room.state && room.state.players) {
                const myPlayer = room.state.players.get(room.sessionId);
                if (myPlayer && myPlayer.position) {
                    playerController.setServerPosition(
                        myPlayer.position.x,
                        myPlayer.position.y + 0.5,
                        myPlayer.position.z
                    );
                }
            }
            lastServerUpdate = currentTime;
        }
        
        // Интерполируем позицию каждый кадр
        playerController.interpolate(deltaTime);
        
        renderer.render(scene, camera);
    }
    
    setupRoomHandlers(room, gameManager, playerController);
    
    gameLoop();
}

function setupRoomHandlers(room: any, gameManager: GameManager, playerController: PlayerController) {
    room.onStateChange((state: any) => {
        state.players.forEach((player: any, sessionId: string) => {
            if (sessionId === room.sessionId) {
                return;
            }
            
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