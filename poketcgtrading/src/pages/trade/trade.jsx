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
    const fetchTrades = async () => {
      try {
        setLoading(true);
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Check both tradeList and trades fields
          const tradeIds = userData.tradeList || userData.trades || [];
          
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
                  
                  return {
                    id: tradeId,
                    ...tradeData,
                    otherUser: otherUserData
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

  if (loading) return <div className="text-center p-4">Loading trades...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;
  if (trades.length === 0) return <div className="text-center p-4">No trades found</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Your Trades</h1>
      <div className="grid gap-4">
        {trades.map((trade) => (
          <div key={trade.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold">
                  {trade.targetCard.name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {trade.fromUser === auth.currentUser.uid ? 'You offered to' : 'You received an offer to'} trade with{' '}
                  {trade.otherUser?.displayName || trade.otherUser?.email || 'Unknown User'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Status: <span className="capitalize">{trade.status}</span>
                </p>
              </div>
              <div className="flex gap-2">
                {trade.status === 'pending' && trade.fromUser !== auth.currentUser.uid && (
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
                {trade.status === 'pending' && trade.fromUser === auth.currentUser.uid && (
                  <button
                    onClick={() => handleCancel(trade)}
                    className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                  >
                    <FaTrash />
                  </button>
                )}
                {trade.status !== 'pending' && (
                  <button
                    onClick={() => setExpandedChat(trade.id === expandedChat ? null : trade.id)}
                    className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                  >
                    <FaComments />
                  </button>
                )}
              </div>
            </div>
            {expandedChat === trade.id && (
              <div className="mt-4 border-t pt-4">
                <Chat tradeId={trade.id} otherUser={trade.otherUser} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Trade;