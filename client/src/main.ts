import { connect } from './connect';
import { initScene } from './game';
import { PlayerController } from './PlayerController';
import { Callbacks } from "@colyseus/sdk";
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
    const playerController = new PlayerController(camera);
    
    const room = await connect({ name: username });
    let lastUpdateTime = performance.now();
    let updateInterval = 0.1;
    let timeSinceLastUpdate = 0;
    
    // Игровой цикл
    function gameLoop() {
        requestAnimationFrame(gameLoop);
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - lastUpdateTime) / 1000;
        lastUpdateTime = currentTime;
        
        playerController.update(deltaTime);
        
        // Отправка позиции на сервер
        timeSinceLastUpdate += deltaTime;
        if (timeSinceLastUpdate >= updateInterval) {
            const position = playerController.getPosition();
            
            room.send('updatePosition', {
                x: position.x,
                y: position.y,
                z: position.z
            });
            timeSinceLastUpdate = 0;
        }
        
        renderer.render(scene, camera);
    }
    
    // Настройка обработчиков
    setupRoomHandlers(room, gameManager, playerController);
    
    // Запуск игрового цикла
    gameLoop();
}

function setupRoomHandlers(room: any, gameManager: GameManager, playerController: PlayerController) {
    // Используем patch rate для отслеживания изменений
    room.onStateChange((state: any) => {
        // Этот колбек вызывается при каждом изменении состояния
        
        state.players.forEach((player: any, sessionId: string) => {
            // Пропускаем своего игрока - для него не нужен визуальный объект
            if (sessionId === room.sessionId) {
                // Обновляем позицию своей камеры, если нужно
                // (обычно не нужно, так как мы управляем камерой локально)
                return;
            }
            
            if (!gameManager.players.has(sessionId)) {
                // Новый игрок (только другие игроки)
                console.log(`New player: ${sessionId}`, player.authData?.name);
                gameManager.addPlayer(sessionId, player);
            } else {
                // Обновляем позицию существующего игрока
                gameManager.updatePlayerFromServer(sessionId, player.position);
            }
        });
        
        // Проверяем удаленных игроков
        gameManager.players.forEach((player, sessionId) => {
            if (!state.players.has(sessionId)) {
                console.log(`Player left: ${sessionId}`);
                gameManager.removePlayer(sessionId);
            }
        });
    });
    
    // Обработка сообщений
    room.onMessage("broadcast", (message: any) => {
        console.log(`Chat message: ${message.content} from ${message.sender}`);
    });
    
    room.onMessage("playerJoined", (data: any) => {
        console.log(`${data.name} joined the game`);
    });
    
    room.onMessage("playerLeft", (data: any) => {
        console.log(`${data.name} left the game`);
    });
    
    room.onMessage("playerShoot", (data: any) => {
        console.log(`Player ${data.shooterId} shot with ${data.weaponType}`);
    });
    
    room.onMessage("playerDamaged", (data: any) => {
        console.log(`Player ${data.targetId} took ${data.damage} damage`);
    });
    
    room.onError((code: number, message: string) => {
        console.error(`Room error: ${code} - ${message}`);
    });
    
    room.onLeave((code: number) => {
        console.log(`Left room with code: ${code}`);
    });
}

start();