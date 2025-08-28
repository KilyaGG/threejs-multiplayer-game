import { Server } from 'socket.io';


let players = [];

let world = GenerateWorld(50, 50, 1, 100, 4);


// Создаем HTTP сервер 
const io = new Server(3000, {
  cors: {
    origin: "http://localhost:5173", // порт по умолчанию у Vite
    methods: ["GET", "POST"]
  }
});

console.log('Сервер запущен, ожидаю игроков...');

io.on('connection', (socket) => {
    console.log('Пользователь подключился:', socket.id);

    socket.emit('worldData-new-user', world);
    socket.emit('players-new-user', players);

    socket.on('playerConnect', (data) => {
        players.push(data);
        console.log(`Игроков на сервере: ${players.length}`);
        socket.broadcast.emit('playerConnect', data);
    })

    socket.on('playerMove', (data) => {

      console.log('Игрок изменил координаты:', data);
      
      socket.broadcast.emit('playerMove', data);
    });
    
    socket.on('disconnect', () => {

      console.log('Пользователь отключился:', socket.id);
      
    });
});

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function GenerateWorld(earthlimitX, earthlimitZ, maxCubeSize, structureNumber, maxStructureHeight) {
    let worldObjects = [];

    class Structure {
        constructor(height, size, x, z, color) {
            this.height = height;
            this.size = size;
            this.x = x;
            this.z = z;
            this.color = color;
        }
    };
    for (let i = 0; i < structureNumber; i++) {
        let foundAFreePlace = false
        while (foundAFreePlace === false) {
            const coords = {
                x: Math.floor(Math.random() * (2*earthlimitX+1)) - earthlimitX,
                z: Math.floor(Math.random() * (2*earthlimitZ+1)) - earthlimitZ
            };
            let placeAlreadyTook = false;
            worldObjects.forEach(object => {
                if (object.x === coords.x && object.z === coords.z) {
                    placeAlreadyTook = true;
                }
            });
            if (!placeAlreadyTook) {
                const structure = new Structure();
                structure.color = getRandomColor();
                structure.size = Math.floor(Math.random()*maxCubeSize) + 1;
                structure.height = Math.floor(Math.random() * maxStructureHeight) + 1;
                structure.x = coords.x;
                structure.z = coords.z;
                worldObjects.push(structure);
                foundAFreePlace = true;
            }
        }

    }

    console.log(`World generated successfully with number of objects ${worldObjects.length}`);
    return worldObjects;
}