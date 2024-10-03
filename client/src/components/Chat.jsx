import React, { useEffect, useState } from 'react';

const Chat = ({ socket, username, room, isAdmin }) => {
    const [message, setMessage] = useState('');                                 // Kullanıcının yazdığı mesajı saklar
    const [messageList, setMessageList] = useState([]);                         // Mesaj listesini saklar
    const [users, setUsers] = useState([]);                                     // Oda kullanıcılarını saklar
    const [isUserListVisible, setIsUserListVisible] = useState(false);          // Kullanıcı listesinin görünürlük durumunu yönetir
    const [imageFile, setImageFile] = useState(null);                           // Yüklenen görsel dosyasını saklar
    const [audioBlob, setAudioBlob] = useState(null);                           // Ses kaydını saklar
    const [mediaRecorder, setMediaRecorder] = useState(null);                   // MediaRecorder nesnesini saklar
    const [isRecording, setIsRecording] = useState(false);                      // Ses kaydının durumunu yönetir
    const [mediaStream, setMediaStream] = useState(null);                       // MediaStream nesnesini saklar


    useEffect(() => {
        // Mesaj döndüğünde ve oda kullanıcıları güncellendiğinde dinleyiciler eklenir

        socket.on('messageReturn', (data) => {
            setMessageList((prev) => [...prev, data]);                      // Gelen mesajları listeye ekler
        });

        socket.on('roomUsers', (roomUsers) => {
            setUsers(roomUsers);                                            // Oda kullanıcılarını günceller
        });

        socket.on('kicked', () => {
            alert('You have been kicked from the room.');                   // Kullanıcı odadan atıldığında uyarı verir
        });

        // Temizleme işlemleri
        return () => {
            socket.off('messageReturn');                                    // Dinleyicileri kaldırır
            socket.off('roomUsers');
            socket.off('kicked');
        };
    }, [socket]);


    const sendMessage = async () => {

        // Mesaj, görsel veya ses dosyası yoksa gönderim yapmaz
        if (message.trim() === '' && !imageFile && !audioBlob) return;

        const messageContent = {
            username: username,                                                 // Mesaj gönderen kullanıcı adı
            message: message,                                                   // Mesaj içeriği
            room: room,                                                         // Mesajın ait olduğu oda
            date: `${new Date().getHours()}:${new Date().getMinutes()}`,        // Mesajın gönderildiği tarih ve saat
            image: imageFile ? URL.createObjectURL(imageFile) : null,           // Görsel varsa URL oluştur
            audio: audioBlob ? URL.createObjectURL(audioBlob) : null,           // Ses kaydı varsa URL oluştur
        };

        await socket.emit('message', messageContent);               // Mesajı socket ile gönder
        setMessageList((prev) => [...prev, messageContent]);        // Gönderilen mesajı listeye ekle
        setMessage('');                                             // Mesaj girişini temizle
        setImageFile(null);                                         // Görsel dosyasını sıfırla
        setAudioBlob(null);                                         // Ses kaydını sıfırla
    };



    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });              // Ses akışını al
        const recorder = new MediaRecorder(stream);                                             // MediaRecorder nesnesini oluştur

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                setAudioBlob(event.data);               // Ses kaydı alındığında sakla
            }
        };

        recorder.onstop = () => {
            sendMessage();                              // Kaydı durdurunca mesajı gönder
            stopStream(stream);                         // Stream'i durdur
        };

        recorder.start();                               // Kaydı başlat
        setMediaRecorder(recorder);                     // Recorder'ı sakla
        setIsRecording(true);                           // Kayıt durumunu güncelle
        setMediaStream(stream);                         // Akışı sakla
        document.title = '🔴 Recording...';             // Başlığı güncelle
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();                       // Kayıt durdur
            setIsRecording(false);                      // Kayıt durumunu güncelle
            stopStream(mediaStream);                    // mediaStream'i durdur
        }
    };

    const stopStream = (stream) => {
        const tracks = stream.getTracks();              // Akıştaki tüm track'leri al
        tracks.forEach(track => track.stop());          // Her bir track'i durdur
        document.title = 'Chat App';                    // Başlığı eski haline getir
    };

    const kickUser = (userId) => {
        if (isAdmin) {
            socket.emit('kickUser', room, userId);      // Admin kullanıcı ise seçilen kullanıcıyı at
        }
    };

    return (
        <div className='flex items-center justify-center h-full relative'>
            <div className='w-1/3 h-[600px] bg-white relative'>

                <div className='w-full h-16 bg-gray-700 flex items-center p-3 justify-between'>

                    <div className='flex items-center'>
                        <div className='w-12 h-12 bg-white rounded-full'></div>
                        <div className='ml-4 text-white'>Room: {room}</div>
                    </div>

                    <button
                        onClick={() => setIsUserListVisible(!isUserListVisible)}            // Kullanıcı listesi görünürlüğünü değiştir
                        className='bg-blue-500 text-white px-4 py-2 rounded-md z-10'>
                        {isUserListVisible ? 'Hide Users' : 'Show Users'}                   {/* Kullanıcı listesini göster/gizle */}
                    </button>

                </div>

                <div className='w-full h-[350px] overflow-y-auto'>

                    {messageList.map((msg, i) => (
                        <div className={`flex ${username === msg.username ? 'justify-end' : ''}`} key={i}>
                            <div className={`${username === msg.username ? 'bg-green-600' : 'bg-blue-600'} w-2/3 h-auto p-2 text-white m-2 rounded-xl rounded-br-none`}>
                                <div>{msg.message}</div> {/* Mesaj içeriği */}
                                {msg.image && <img src={msg.image} alt="User Upload" className="max-h-48 mt-2 rounded-md" />} {/* Yüklenen görsel */}
                                {msg.audio && <audio controls className="mt-2"><source src={msg.audio} type="audio/mpeg" /> Your browser does not support the audio element.</audio>} {/* Ses kaydı */}
                                <div className='w-full flex justify-end text-xs'>{msg.username} - {msg.date}</div> {/* Mesaj gönderenin adı ve zamanı */}
                            </div>
                        </div>
                    ))}

                </div>

                {isUserListVisible && (
                    <div className='absolute top-16 right-0 w-1/3 max-h-[350px] bg-gray-200 overflow-y-auto p-2 shadow-lg z-20'>
                        <h3 className='text-center font-bold'>Users in Room</h3> {/* Oda kullanıcıları başlığı */}
                        {users.map((user) => (
                            <div key={user.id} className='flex justify-between items-center p-2'>
                                <span>{user.username}</span> {/* Kullanıcı adı */}
                                {isAdmin && (
                                    <button
                                        onClick={() => kickUser(user.id)} // Kullanıcıyı atma butonu
                                        className='bg-red-500 text-white p-1 rounded hover:bg-red-700'>
                                        Kick
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Mesaj Gönderme Alanı */}
                <div className='absolute bottom-0 left-0 w-full flex items-center p-3 bg-white'>
                    <input
                        value={message} // Mesaj giriş alanı
                        onChange={e => setMessage(e.target.value)}
                        className='flex-1 h-12 border p-3 outline-none' // Genişliği artırmak için flex-1 kullandık
                        type="text"
                        placeholder='Type your message...' // Mesaj yazma alanı
                    />

                    <label className='ml-2 h-10 border p-1 rounded-md text-white bg-indigo-600 cursor-pointer flex items-center justify-center'>
                        Image
                        <input
                            type="file"
                            accept="image/*"
                            onChange={e => {
                                setImageFile(e.target.files[0]); // Yüklenen dosyayı sakla
                                e.target.value = ''; // Dosya seçildikten sonra girdi alanını temizle
                            }}
                            className='hidden' // Görsel inputu gizle
                        />
                    </label>

                    <div className='ml-2 flex items-center'>
                        <button
                            onClick={isRecording ? stopRecording : startRecording} // Kayıt durumu kontrolü
                            className='bg-indigo-600 text-white h-10 w-24 rounded-md hover:opacity-70'
                        >
                            {isRecording ? 'Stop' : 'Record'} {/* Kayıt butonu */}
                        </button>

                        <button
                            onClick={sendMessage} // Mesaj gönderme butonu
                            className='bg-blue-500 text-white h-10 w-24 rounded-md ml-2 hover:opacity-70'
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
