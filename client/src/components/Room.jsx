import React, { useState } from 'react';

const Room = ({ username, room, setUsername, setRoom, setChatScreen, socket, setIsAdmin }) => {
    const [isAdminChecked, setIsAdminChecked] = useState(false); // Yönetici seçimini kontrol eden state

    // Odaya giriş fonksiyonu
    const sendRoom = () => {
        // Kullanıcı adının ve odanın boş olmadığını kontrol et
        if (!username || !room) {
            alert("Username and room cannot be empty!"); // Kullanıcıyı bilgilendir
            return;
        }

        // Yönetici durumu
        setIsAdmin(isAdminChecked);

        // Kullanıcıyı odaya katılmasını sağla
        socket.emit('room', { room, username });
        setChatScreen(true);
    };

    return (
        <div className='flex items-center justify-center h-full'>
            <div className='w-1/3 h-[320px] rounded-lg bg-indigo-600 flex flex-col space-y-4 p-3'>
                <h1 className='text-center my-4 font-bold text-2xl'>WELCOME TO CHAT</h1>
                
                {/* Kullanıcı adını girme alanı */}
                <input 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    className='h-12 rounded-xl p-3 outline-none' 
                    type="text" 
                    placeholder='Username' 
                />
                
                {/* Oda ismini girme alanı */}
                <input 
                    value={room} 
                    onChange={(e) => setRoom(e.target.value)} 
                    className='h-12 rounded-xl p-3 outline-none' 
                    type="text" 
                    placeholder='Room' 
                />

                {/* Yönetici girişinin olup olmadığını kontrol eden checkbox */}
                <label className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={isAdminChecked}
                        onChange={(e) => setIsAdminChecked(e.target.checked)}
                    />
                    <span>Login as Admin</span>
                </label>
                
                {/* Chat ekranına geçiş ve odaya giriş */}
                <div 
                    onClick={sendRoom} 
                    className='tracking-wider hover:opacity-70 cursor-pointer text-white bg-indigo-900 h-12 pt-2 text-xl text-center rounded-xl'>
                    JOIN CHAT
                </div>
            </div>
        </div>
    );
}

export default Room;
