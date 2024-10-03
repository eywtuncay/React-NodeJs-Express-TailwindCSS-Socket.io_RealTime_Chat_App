const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const app = express();  // Express uygulamasını oluştur
app.use(cors());        // CORS'u etkinleştir

const server = http.createServer(app); // HTTP sunucusunu oluştur ve Express uygulamasını bağla

// Oda kullanıcılarını tutmak için bir obje
let rooms = {}; 

// Socket.IO sunucusunu oluştur ve CORS ayarlarını yapılandır
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',  // Hangi origin'den gelen isteklerin kabul edileceği
        methods: ['GET', 'POST']          // Kabul edilen HTTP yöntemleri
    }
});

// Socket.IO bağlantı olayını dinle
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);  // Bağlanan istemcinin benzersiz kimliğini görmek için konsola yazdır

    // İstemciden gelen oda bilgisi
    socket.on('room', ({ room, username }) => {
        socket.join(room);  // İstemci belirtilen odaya katılır

        // Kullanıcıyı odaya ekle
        if (!rooms[room]) {
            rooms[room] = [];
        }
        rooms[room].push({ id: socket.id, username });

        // Oda kullanıcı listesini güncelle ve odadaki herkese gönder
        io.to(room).emit('roomUsers', rooms[room]);
    });

    // İstemciden gelen mesajı dinle
    socket.on('message', (data) => {
        const userInRoom = rooms[data.room].find(user => user.id === socket.id); // Kullanıcının odaya katılıp katılmadığını kontrol et
        if (userInRoom) { // Eğer kullanıcı odaya katıldıysa mesajı gönder
            socket.to(data.room).emit('messageReturn', data);  // Mesajı belirtilen odadaki diğer istemcilere gönder
        }
    });

    // Ses dosyası gönderme
    socket.on('audio', (data) => {
        socket.to(data.room).emit('audioReturn', {
            audio: data.audio,
            username: data.username,
            date: new Date().toLocaleTimeString()
        });
    });

    // Görsel dosyası gönderme
    socket.on('image', (data) => {
        socket.to(data.room).emit('imageReturn', {
            image: data.image,
            username: data.username,
            date: new Date().toLocaleTimeString()
        });
    });

    // Yönetici bir kullanıcıyı odadan çıkarmak isterse
    socket.on('kickUser', (room, socketIdToKick) => {
        // Kullanıcıyı odadan çıkar ve diğer kullanıcılara bildir
        const userToKick = rooms[room].find(user => user.id === socketIdToKick);
        if (userToKick) {
            io.to(socketIdToKick).emit('userKicked'); // Kullanıcıya odadan atıldığını bildir
            socket.to(room).emit('messageReturn', {
                username: 'Admin',
                message: `${userToKick.username} has been kicked from the room.`,
                date: new Date().toLocaleTimeString()
            }); // Diğer kullanıcılara kick mesajını gönder
            io.sockets.sockets.get(socketIdToKick)?.leave(room); // Kullanıcıyı odadan çıkar
            rooms[room] = rooms[room].filter(user => user.id !== socketIdToKick); // Kullanıcıyı odadan çıkar
            io.to(room).emit('roomUsers', rooms[room]); // Oda kullanıcı listesini güncelle
        }
    });

    // Kullanıcı bağlantısını kopardığında
    socket.on('disconnect', () => {
        for (const room in rooms) {
            rooms[room] = rooms[room].filter(user => user.id !== socket.id);
            io.to(room).emit('roomUsers', rooms[room]); // Oda kullanıcı listesini güncelle
        }
    });
});

// Sunucunun dinleyeceği port numarası
const PORT = 5000;

// Sunucuyu belirtilen portta dinlemeye başla
server.listen(PORT, () => {
    console.log('server is running on port: 5000');  // Sunucu başarıyla başlatıldığında konsola mesaj yazdır
});
