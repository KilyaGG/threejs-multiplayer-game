import { connect } from './connect';
import { initScene } from './game';
import { Callbacks } from "@colyseus/sdk";
import { GameManager } from './objects/GameManager';

async function start() {
    const loginUI = document.getElementById('login-ui') as HTMLElement;
    const joinBtn = document.getElementById('join-btn') as HTMLButtonElement;
    const nameInput = document.getElementById('username') as HTMLInputElement;

    // Вспомогательная функция для запуска
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
    // 1. Скрываем интерфейс
    loginUI.style.display = 'none';

    // 2. Инициализируем графику
    const { scene, controls } = initScene();
    const gameManager = new GameManager(scene);

    // 3. Подключаемся к серверу
    const room = await connect({ name: username });

    room.onStateChange.once((state: any) => {
        const callbacks = Callbacks.get(room);
        
        callbacks.onAdd("players", (player: any, sessionId: any) => { 
            if (sessionId === room.sessionId) {
                controls.target.set(player.position.x, player.position.y, player.position.z);
                controls.update();
            }
            gameManager.addPlayer(sessionId, player);
        });

        callbacks.onRemove("players", (_player: any, sessionId: any) => {
            gameManager.removePlayer(sessionId);
        });

        room.onMessage("broadcast", (message: any) => {
            console.log(`Пришло сообщение: ${message.content}`);
        });
    });
}


start();