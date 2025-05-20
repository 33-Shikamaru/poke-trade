import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, doc, setDoc, onSnapshot, getDoc, where, limit, startAfter, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { FaPaperPlane, FaArrowUp } from 'react-icons/fa';

function Chat({ tradeId, otherUser }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [chatId, setChatId] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const lastMessageRef = useRef(null);
  const MESSAGES_PER_PAGE = 20;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat when component mounts or tradeId changes
  useEffect(() => {
    if (!auth.currentUser || !tradeId) return;

    const setupChat = async () => {
      try {
        setLoading(true);
        
        // Use Firebase SDK to query for existing chat
        const chatsRef = collection(db, 'chats');
        const q = query(chatsRef, where('tradeId', '==', tradeId));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          // Create new chat document using Firebase SDK
          const newChatRef = doc(collection(db, 'chats'));
          const chatData = {
            tradeId: tradeId,
            participants: [auth.currentUser.uid, otherUser.uid],
            createdAt: serverTimestamp(),
            lastMessage: null
          };
          await setDoc(newChatRef, chatData);
          setChatId(newChatRef.id);
        } else {
          const chatDoc = snapshot.docs[0];
          setChatId(chatDoc.id);
        }
      } catch (error) {
        console.error('Error setting up chat:', error);
        setError(`Error setting up chat: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    setupChat();
  }, [tradeId, otherUser]);

  // Listen for messages using Firebase SDK
  useEffect(() => {
    if (!auth.currentUser || !chatId) return;

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    // Use Firebase SDK's onSnapshot for real-time updates
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const messageList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp)
        }));
        setMessages(messageList);
        setLoading(false);
      }, 
      (error) => {
        console.error('Error in message listener:', error);
        setError(`Error in message listener: ${error.message}`);
      }
    );

    return () => unsubscribe();
  }, [chatId]);

  const loadMoreMessages = async () => {
    if (!chatId || loadingMore) return;
    
    try {
      setLoadingMore(true);
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        limit(MESSAGES_PER_PAGE),
        ...(lastMessageRef.current ? [startAfter(lastMessageRef.current)] : [])
      );

      const snapshot = await getDocs(q);
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp)
      }));

      if (newMessages.length > 0) {
        setMessages(prev => [...newMessages.reverse(), ...prev]);
        lastMessageRef.current = snapshot.docs[snapshot.docs.length - 1];
        setHasMore(snapshot.docs.length === MESSAGES_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
      setError(`Error loading more messages: ${error.message}`);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser || !chatId) {
      console.log('Cannot send message:', { hasAuth: !!auth.currentUser, hasChatId: !!chatId });
      return;
    }
    if (!newMessage.trim()) {
      console.log('Message is empty');
      return;
    }

    try {
      const messageData = {
        text: newMessage.trim(),
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || auth.currentUser.email,
        timestamp: serverTimestamp()
      };

      // Use Firebase SDK to add message
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const docRef = await addDoc(messagesRef, messageData);
      
      // Update last message using Firebase SDK
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        lastMessage: messageData
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError(`Error sending message: ${error.message}`);
    }
  };

  if (!auth.currentUser) {
    return <p className="text-red-500">Please log in to use chat</p>;
  }
  if (!tradeId) return <p>No trade selected</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (loading) return <p>Loading chat...</p>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {loadingMore && (
          <div className="text-center">
            <button 
              onClick={loadMoreMessages}
              className="text-blue-500 hover:text-blue-600 flex items-center justify-center gap-2 mx-auto"
            >
              <FaArrowUp /> Load More Messages
            </button>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="text-center text-gray-500">No messages yet</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderId === auth.currentUser.uid ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-3 rounded-lg ${
                msg.senderId === 'system' 
                  ? 'bg-gray-100 text-gray-700 mx-auto' 
                  : msg.senderId === auth.currentUser.uid 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-black'
              }`}>
                <p>{msg.text}</p>
                <p className="text-xs opacity-60">{msg.timestamp?.toLocaleTimeString()}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t bg-white dark:bg-gray-800">
        <form 
          onSubmit={handleSendMessage}
          className="flex gap-2"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border rounded p-2 bg-white dark:bg-gray-700 dark:text-white"
          />
          <button 
            type="submit"
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={!newMessage.trim() || !chatId}
          >
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
