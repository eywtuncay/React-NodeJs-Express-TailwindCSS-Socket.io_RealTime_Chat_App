import Room from './components/Room';
import './App.css';
import Chat from './components/Chat';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Socket.IO sunucusuna bağlantı oluştur
const socket = io.connect('http://localhost:5000');

function App() {
  const [username, setUsername] = useState('');          // Kullanıcı adını saklamak için state
  const [room, setRoom] = useState('');                  // Oda adını saklamak için state
  const [chatScreen, setChatScreen] = useState(false);   // Sohbet ekranını gösterip göstermediğini belirten state
  const [isAdmin, setIsAdmin] = useState(false);         // Kullanıcının yönetici olup olmadığını belirleyen state
  const [kicked, setKicked] = useState(false);           // Kullanıcının atılıp atılmadığını kontrol eden state

  // Socket bağlantı durumu kontrolü
  useEffect(() => {
    socket.on('connect_error', () => {
      alert('Connection failed. Please try again later.');
    });

    // Kullanıcı atıldığında tetiklenecek olay
    socket.on('userKicked', () => {
      setKicked(true); // Kullanıcının atıldığını belirt
      alert('You have been kicked from the room.'); // Kullanıcıya atıldığını bildiren mesaj
      setChatScreen(false); // Sohbet ekranını gizle
    });

    return () => {
      socket.off('connect_error');
      socket.off('userKicked'); // Bileşen kaldırıldığında olay dinleyiciyi temizle
    };
  }, []);

  return (
    <div className="App">
      {
        !chatScreen ? // Eğer chatScreen false ise Room bileşenini göster, Aksi takdirde Chat bileşenini göster
        <Room 
          username={username} 
          room={room} 
          setUsername={setUsername} 
          setRoom={setRoom} 
          setChatScreen={setChatScreen} 
          socket={socket}
          setIsAdmin={setIsAdmin}   // Yöneticilik durumu için prop ekledik
        />
        :
        <Chat 
          socket={socket} 
          username={username} 
          room={room} 
          isAdmin={isAdmin}         // Yöneticilik bilgisini Chat bileşenine gönderdik
          kicked={kicked}           // Atılma durumunu Chat bileşenine ilettik
        /> 
      }
    </div>
  );
}

export default App;
