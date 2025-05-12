import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IoClose } from "react-icons/io5";

const AlertMenu = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleAlertClick = () => {
    navigate('/notifications');
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-10 dark:bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Alert Menu */}
      <div className="fixed right-4 top-16 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-white">
            Notifications
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-white rounded-lg p-1 hover:bg-red-300 dark:text-gray-400"
          >
            <IoClose className="text-xl" />
          </button>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {/* Sample notifications - replace with actual data */}
          {/* TODO - How do we populate the first 3 notifications? */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <p className="font-medium dark:text-gray-200">New Trade Request</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">John wants to trade with you</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">2 minutes ago</p>
          </div>
          
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <p className="font-medium dark:text-gray-200">Trade Completed</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Your trade with Sarah was successful</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">1 hour ago</p>
          </div>
          
          <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <p className="font-medium dark:text-gray-200">New Message</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Mike sent you a message about your trade offer</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">3 hours ago</p>
          </div>
        </div>
        
        <div className="p-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <button 
            className="w-full text-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            onClick={handleAlertClick}
          >
            View All Notifications
          </button>
        </div>
      </div>
    </>
  );
};

export default AlertMenu; 