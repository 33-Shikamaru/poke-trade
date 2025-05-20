import { Link } from 'react-router-dom';
import { useState, useEffect } from "react"
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayRemove, setDoc, deleteDoc, getDocs as getFirestoreDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { FaCheck, FaTimes, FaTrash, FaComments } from 'react-icons/fa';
import Chat from '../../components/Chat';

function Trade() {
  const [trades, setTrades] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedChat, setExpandedChat] = useState(null);

  useEffect(() => {
    console.log("hello");
    const fetchTrades = async () => {
      try {
        setLoading(true);
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          // Get trades from user document's tradeList array
          const userData = userDoc.data();
          const tradeIds = userData.tradeList || [];
          console.log("User data:", userData);
          console.log("Trade IDs:", tradeIds);
         
          // When the user has not had any trade
          if (tradeIds.length === 0) {
            setTrades([]);
            setLoading(false);
            return;
          }

          const tradesData = await Promise.all(
            tradeIds.map(async (tradeId) => {
              try {
                const tradeRef = doc(db, 'trades', tradeId);
                const tradeDoc = await getDoc(tradeRef);
                console.log("Trades", tradeDoc)
                
                if (tradeDoc.exists()) {
                  const tradeData = tradeDoc.data();
                  // Get other user's data
                  const otherUserId = tradeData.fromUser === auth.currentUser.uid ? 
                    tradeData.toUser : tradeData.fromUser;
                  const otherUserRef = doc(db, 'users', otherUserId);
                  const otherUserDoc = await getDoc(otherUserRef);
                  const otherUserData = otherUserDoc.exists() ? {
                    ...otherUserDoc.data(),
                    uid: otherUserId
                  } : null;

                  // Determine if current user is sender or receiver
                  const isSender = tradeData.fromUser === auth.currentUser.uid;
                  
                  return {
                    id: tradeId,
                    ...tradeData,
                    otherUser: otherUserData,
                    isSender,
                    sender: isSender ? auth.currentUser : otherUserData,
                    receiver: isSender ? otherUserData : auth.currentUser
                  };
                }
                return null;
              } catch (error) {
                console.error(`Error fetching trade ${tradeId}:`, error);
                return null;
              }
            })
          );
          
          const validTrades = tradesData.filter(trade => trade !== null);
          setTrades(validTrades);
        } else {
          setTrades([]);
        }
      } catch (error) {
        console.error('Error fetching trades:', error);
        setError('Failed to load trades. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (auth.currentUser) {
      fetchTrades();
    }
  }, []);

  const handleAccept = async (trade) => {
    try {
      const tradeRef = doc(db, 'trades', trade.id);
      await updateDoc(tradeRef, {
        status: 'accepted',
        updatedAt: new Date()
      });

      // Create a new chat document
      const chatRef = doc(collection(db, 'chats'));
      const chatData = {
        tradeId: trade.id,
        participants: [trade.fromUser, trade.toUser],
        createdAt: serverTimestamp(),
        lastMessage: null,
        tradeInfo: {
          id: trade.id,
          status: 'accepted'
        }
      };
      await setDoc(chatRef, chatData);

      // Add initial system message
      const messagesRef = collection(db, 'chats', chatRef.id, 'messages');
      await addDoc(messagesRef, {
        text: `Trade offer accepted for ${trade.targetCard.name}`,
        senderId: 'system',
        senderName: 'System',
        timestamp: serverTimestamp()
      });

      // Create notification for the sender
      const notificationRef = doc(collection(db, 'users', trade.fromUser, 'notifications'));
      await setDoc(notificationRef, {
        type: 'trade_request_accepted',
        tradeId: trade.id,
        message: `Your trade offer for ${trade.targetCard.name} was accepted`,
        read: false,
        timestamp: serverTimestamp()
      });

      // Update local state
      setTrades(prev => prev.map(t => 
        t.id === trade.id ? { ...t, status: 'accepted' } : t
      ));
    } catch (error) {
      console.error('Error accepting trade:', error);
      alert('Failed to accept trade. Please try again.');
    }
  };

  const handleDecline = async (trade) => {
    try {
      const tradeRef = doc(db, 'trades', trade.id);
      await updateDoc(tradeRef, {
        status: 'declined',
        updatedAt: new Date()
      });

      // Find existing chat or create new one
      const q = query(collection(db, 'chats'), where('tradeId', '==', trade.id));
      const snapshot = await getDocs(q);
      let chatRef;
      
      if (snapshot.empty) {
        chatRef = doc(collection(db, 'chats'));
        const chatData = {
          tradeId: trade.id,
          participants: [trade.fromUser, trade.toUser],
          createdAt: serverTimestamp(),
          lastMessage: null,
          tradeInfo: {
            id: trade.id,
            status: 'declined'
          }
        };
        await setDoc(chatRef, chatData);
      } else {
        chatRef = doc(db, 'chats', snapshot.docs[0].id);
      }

      // Add system message about decline
      const messagesRef = collection(db, 'chats', chatRef.id, 'messages');
      await addDoc(messagesRef, {
        text: `Trade offer declined for ${trade.targetCard.name}`,
        senderId: 'system',
        senderName: 'System',
        timestamp: serverTimestamp()
      });

      // Create notification for the sender
      const notificationRef = doc(collection(db, 'users', trade.fromUser, 'notifications'));
      await setDoc(notificationRef, {
        type: 'trade_request_declined',
        tradeId: trade.id,
        message: `Your trade offer for ${trade.targetCard.name} was declined`,
        read: false,
        timestamp: serverTimestamp()
      });

      // Update local state
      setTrades(prev => prev.map(t => 
        t.id === trade.id ? { ...t, status: 'declined' } : t
      ));
    } catch (error) {
      console.error('Error declining trade:', error);
      alert('Failed to decline trade. Please try again.');
    }
  };

  const handleCancel = async (trade) => {
    try {
      const tradeRef = doc(db, 'trades', trade.id);
      await updateDoc(tradeRef, {
        status: 'cancelled',
        updatedAt: new Date()
      });

      // Find existing chat or create new one
      const q = query(collection(db, 'chats'), where('tradeId', '==', trade.id));
      const snapshot = await getDocs(q);
      let chatRef;
      
      if (snapshot.empty) {
        chatRef = doc(collection(db, 'chats'));
        const chatData = {
          tradeId: trade.id,
          participants: [trade.fromUser, trade.toUser],
          createdAt: serverTimestamp(),
          lastMessage: null,
          tradeInfo: {
            id: trade.id,
            status: 'cancelled'
          }
        };
        await setDoc(chatRef, chatData);
      } else {
        chatRef = doc(db, 'chats', snapshot.docs[0].id);
      }

      // Add system message about cancellation
      const messagesRef = collection(db, 'chats', chatRef.id, 'messages');
      await addDoc(messagesRef, {
        text: `Trade offer cancelled for ${trade.targetCard.name}`,
        senderId: 'system',
        senderName: 'System',
        timestamp: serverTimestamp()
      });

      // Create notification for the other user
      const otherUserId = trade.fromUser === auth.currentUser.uid ? trade.toUser : trade.fromUser;
      const notificationRef = doc(collection(db, 'users', otherUserId, 'notifications'));
      await setDoc(notificationRef, {
        type: 'trade_request_cancelled',
        tradeId: trade.id,
        message: `Trade offer for ${trade.targetCard.name} was cancelled`,
        read: false,
        timestamp: serverTimestamp()
      });

      // Update local state
      setTrades(prev => prev.map(t => 
        t.id === trade.id ? { ...t, status: 'cancelled' } : t
      ));
    } catch (error) {
      console.error('Error cancelling trade:', error);
      alert('Failed to cancel trade. Please try again.');
    }
  };

  const handleDelete = async (trade) => {
    try {
      setError(null);
      // Delete from user's tradeList
      const userTradeRef = collection(db, 'users', auth.currentUser.uid, 'tradeList');
      const querySnapshot = await getDocs(query(userTradeRef, where('tradeId', '==', trade.id)));
      
      if (!querySnapshot.empty) {
        // Find the specific trade document that matches the trade ID
        const tradeDoc = querySnapshot.docs.find(doc => doc.data().tradeId === trade.id);
        if (tradeDoc) {
          await deleteDoc(tradeDoc.ref);
        }
      }

      // Delete from trades collection
      const tradeRef = doc(db, 'trades', trade.id);
      await deleteDoc(tradeRef);
      // Delete associated chat
      const chatsRef = collection(db, 'chats');
      const chatQuery = query(chatsRef, where('tradeId', '==', trade.id));
      const chatSnapshot = await getDocs(chatQuery);
      
      if (!chatSnapshot.empty) {
        const chatDoc = chatSnapshot.docs[0];
        await deleteDoc(chatDoc.ref);
      }

      // Update local state
      setTrades(prev => prev.filter(t => t.id !== trade.id));

    } catch (error) {
      console.error('Error deleting trade:', error);
      setError('Failed to delete trade. Please try again.');
    }
  }

  if (loading) return <div className="text-center p-4">Loading trades...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;
  if (trades.length === 0) return <div className="text-center p-4">No trades found</div>;

  return (
    <div className="min-h-screen dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Your Trades</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trades.map((trade) => (
            <div key={trade.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow relative group">
              {/* Delete Button - Top Right */}
              <button
                onClick={() => handleDelete(trade)}
                className="absolute top-2 right-2 p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <FaTrash />
              </button>
              <div className="flex flex-col">
                {/* Trade Info List */}
                <div className="mb-4 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Trade ID:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">#{trade.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Date:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{trade.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                    <span className="text-sm font-medium capitalize text-gray-900 dark:text-white">{trade.status}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">From:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{trade.sender?.displayName || trade.sender?.email || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">To:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{trade.receiver?.displayName || trade.receiver?.email || 'Unknown'}</span>
                  </div>
                </div>

                {/* Cards Section */}
                <div className="flex justify-center gap-4 mb-4">
                  {/* Offered Card */}
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-44 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <img 
                        src={trade.offeredCards[0]?.image || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png'} 
                        alt={trade.offeredCards[0]?.name || 'Offered Card'}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {trade.isSender ? 'You send' : 'You receive'}
                    </p>
                  </div>
                  {/* Target Card */}
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-44 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <img 
                        src={trade.targetCard?.image || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png'} 
                        alt={trade.targetCard?.name || 'Target Card'}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {trade.isSender ? 'You receive' : 'You send'}
                    </p>
                  </div>
                </div>

                {/* Trade Info */}
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {trade.isSender 
                      ? `You sent this offer to ${trade.otherUser?.displayName || trade.otherUser?.email || 'Unknown'}`
                      : `You received this offer from ${trade.otherUser?.displayName || trade.otherUser?.email || 'Unknown'}`
                    }
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-2">
                  {trade.status === 'pending' && !trade.isSender && (
                    <>
                      <button
                        onClick={() => handleAccept(trade)}
                        className="p-2 text-green-500 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                      >
                        <FaCheck />
                      </button>
                      <button
                        onClick={() => handleDecline(trade)}
                        className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                      >
                        <FaTimes />
                      </button>
                    </>
                  )}
                  {trade.status === 'pending' && trade.isSender && (
                    <button
                      onClick={() => setExpandedChat(trade.id === expandedChat ? null : trade.id)}
                      className={`p-2 text-blue-500 rounded ${
                        trade.id === expandedChat 
                          ? 'bg-blue-100 dark:bg-blue-900' 
                          : 'hover:bg-blue-100 dark:hover:bg-blue-900'
                      }`}
                    >
                      <FaComments />
                    </button>
                  )}
                  {trade.status !== 'pending' && (
                    <button
                      onClick={() => setExpandedChat(trade.id === expandedChat ? null : trade.id)}
                      className={`p-2 text-blue-500 rounded ${
                        trade.id === expandedChat 
                          ? 'bg-blue-100 dark:bg-blue-900' 
                          : 'hover:bg-blue-100 dark:hover:bg-blue-900'
                      }`}
                    >
                      <FaComments />
                    </button>
                  )}
                </div>

                {/* Chat Section */}
                {expandedChat === trade.id && (
                  <div className="mt-4 border-t pt-4">
                    <div className="h-[400px] overflow-hidden">
                      <Chat tradeId={trade.id} otherUser={trade.otherUser} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Trade;