'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import WaitlistForm from './WaitlistForm';

// Hidden challenge functions that will be embedded in the page
declare global {
  interface Window {
    makeInviteCode?: () => void;
    generateChallenge?: () => void;
    fillInviteForm?: (email?: string) => void;
    hackCubesChallenge?: {
      getHint: () => void;
      start: () => void;
      debug?: () => void;
    };
  }
}

export function InviteChallenge() {
  const [showSignup, setShowSignup] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    // Inject hidden challenge functions into the global scope
    const injectChallengeFunctions = () => {
      // Function 1: makeInviteCode - This is the main entry point users should find
      window.makeInviteCode = function() {
        console.log('%c🎯 HackCubes Challenge Activated!', 'color: #00ff00; font-size: 16px; font-weight: bold;');
        console.log('%cYou found the hidden function! Now call hackCubesChallenge.getHint() to proceed.', 'color: #ffff00;');
        
        // Make the challenge object available
        window.hackCubesChallenge = {
          getHint: async function() {
            console.log('%c🔍 Fetching challenge hint...', 'color: #00ffff;');
            
            try {
              const response = await fetch('/api/challenge/generate', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'getClue' })
              });
              
              const result = await response.json();
              
              if (result.success) {
                console.log('%c📋 Encoded Hint:', 'color: #ff00ff; font-weight: bold;');
                console.log('%c' + result.data, 'color: #ffffff; background: #333; padding: 5px; font-family: monospace;');
                console.log('%c💡 ' + result.hint, 'color: #ffff00;');
                console.log('%cDecode this message to find your next step!', 'color: #00ff00;');
              } else {
                console.error('Failed to get hint:', result.error);
              }
            } catch (error) {
              console.error('Error fetching hint:', error);
            }
          },
          
          start: function() {
            console.log('%c🚀 Challenge Started!', 'color: #00ff00; font-size: 14px;');
            console.log('%cInspect the page source and find the hidden functions.', 'color: #ffff00;');
            console.log('%cHint: Look for functions starting with "make" or "generate"', 'color: #ffff00;');
          }
        };
      };

      // Function 2: generateChallenge - Alternative entry point
      window.generateChallenge = function() {
        console.log('%c⚡ Alternative challenge path detected!', 'color: #ff6600; font-size: 14px;');
        if (window.makeInviteCode) {
          window.makeInviteCode();
        }
      };

      // Also add a more discoverable hint in the console
      console.log('%c🎮 HackCubes Invite Challenge', 'color: #00ff00; font-size: 20px; font-weight: bold;');
      console.log('%c═══════════════════════════════════════', 'color: #00ff00;');
      console.log('%cWelcome to the HackCubes invite challenge!', 'color: #ffffff;');
      console.log('%cTo get started, try calling hackCubesChallenge.start()', 'color: #ffff00;');
      console.log('%cOr explore the page source to find hidden functions...', 'color: #ffff00;');
    //   console.log('%cHidden functions available: makeInviteCode(), generateChallenge()', 'color: #00ff88;');
      console.log('%c═══════════════════════════════════════', 'color: #00ff00;');

      // Add helper function to auto-fill form with generated code
      window.fillInviteForm = function(email = 'test@example.com') {
        fetch('/api/challenge/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'generateCode' })
        })
        .then(r => r.json())
        .then(result => {
          const decodedCode = atob(result.data);
          console.log('%c✅ Generated invite code:', 'color: #00ff00;', decodedCode);
          
          // Fill the form
          const emailField = document.getElementById('candidateEmail') as HTMLInputElement;
          const codeField = document.getElementById('inviteCode') as HTMLInputElement;
          
          if (emailField) emailField.value = email;
          if (codeField) codeField.value = decodedCode;
          
          // Trigger React state updates
          if (emailField) emailField.dispatchEvent(new Event('input', { bubbles: true }));
          if (codeField) codeField.dispatchEvent(new Event('input', { bubbles: true }));
          
          console.log('%c📋 Form auto-filled! You can now submit.', 'color: #00ff00;');
        })
        .catch(err => console.error('Error filling form:', err));
      };
    };

    // Inject functions after a short delay to ensure DOM is ready
    setTimeout(injectChallengeFunctions, 1000);

    // Add hackCubesChallenge to window immediately for the start function
    window.hackCubesChallenge = {
      start: function() {
        console.log('%c🚀 Challenge Started!', 'color: #00ff00; font-size: 14px;');
        console.log('%cInspect the page source and find the hidden functions.', 'color: #ffff00;');
        console.log('%cHint: Look for functions starting with "make" or "generate"', 'color: #ffff00;');
        console.log('%cTry: makeInviteCode() or generateChallenge()', 'color: #00ff88;');
      },
      getHint: function() {
        console.log('%c⚠️ Call makeInviteCode() first to activate the challenge!', 'color: #ff0000;');
      },
      debug: function() {
        console.log('%c🔧 Debug: Available functions:', 'color: #ff6600;');
        console.log('makeInviteCode:', typeof window.makeInviteCode);
        console.log('generateChallenge:', typeof window.generateChallenge);
        console.log('hackCubesChallenge:', typeof window.hackCubesChallenge);
      }
    };

    // Cleanup function
    return () => {
      if (typeof window !== 'undefined') {
        delete window.makeInviteCode;
        delete window.generateChallenge;
        delete window.fillInviteForm;
        delete window.hackCubesChallenge;
      }
    };
  }, []);

  const validateInviteCode = async (code: string) => {
    setIsValidating(true);
    setValidationError('');

    try {
      const response = await fetch('/api/challenge/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code })
      });

      const result = await response.json();

      if (result.success) {
        setShowSignup(true);
        setValidationError('');
      } else {
        setValidationError(result.error);
      }
    } catch (error) {
      setValidationError('Failed to validate invite code');
    } finally {
      setIsValidating(false);
    }
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode.trim() && candidateEmail.trim()) {
      validateInviteCode(inviteCode.trim().toUpperCase());
    }
  };

  if (showSignup) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-green-400 mb-2">
              🎉 Challenge Completed!
            </h1>
            <p className="text-gray-300">
              Congratulations! You've successfully solved the invite challenge.
            </p>
          </motion.div>
          <WaitlistForm inviteCode={inviteCode} candidateEmail={candidateEmail} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      {/* Hidden clues in HTML comments for source code inspection */}
      {/* Challenge hint: Try calling makeInviteCode() or generateChallenge() */}
      {/* API endpoints: /api/challenge/generate with actions: getClue, generateCode */}
      
      <div className="max-w-2xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            HackCubes Invite Challenge
          </h1>
          
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-green-400">
              🎯 Your Mission
            </h2>
            <div className="text-left space-y-4 text-gray-300">
              <p>Welcome to the HackCubes invite challenge! To join our exclusive platform, you need to prove your skills.</p>
              
              {/* <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">Steps to Complete:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Open your browser's developer console (F12)</li>
                  <li>Find and execute hidden JavaScript functions on this page</li>
                  <li>Follow the clues to decode encrypted messages</li>
                  <li>Make API requests to generate your invite code</li>
                  <li>Decode the final invite code and enter it below</li>
                </ol>
              </div> */}
              
              <p className="text-yellow-300">
                💡 <strong>Hint:</strong> Start by exploring the browser console or inspecting the page source...
              </p>
            </div>
          </div>

          <form onSubmit={handleInviteSubmit} className="space-y-4 relative z-20" style={{ pointerEvents: 'all' }}>
            <div>
              <label htmlFor="candidateEmail" className="block text-sm font-medium text-gray-300 mb-2">
                Your Email Address
              </label>
              <input
                type="email"
                id="candidateEmail"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 relative z-30"
                placeholder="your.email@example.com"
                required
                style={{ pointerEvents: 'all' }}
              />
            </div>
            
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-300 mb-2">
                Enter Your Invite Code
              </label>
              <input
                type="text"
                id="inviteCode"
                name="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono uppercase relative z-30"
                placeholder="ABCD1234EFGH5678"
                maxLength={16}
                style={{ textTransform: 'uppercase', pointerEvents: 'all' }}
                required
                autoComplete="off"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the decoded invite code from your challenge completion
              </p>
            </div>
            
            {validationError && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-700 rounded-lg p-3">
                {validationError}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isValidating || !inviteCode.trim() || !candidateEmail.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
            >
              {isValidating ? 'Validating...' : 'Submit Invite Code'}
            </button>
          </form>
          
          <div className="mt-8 text-sm text-gray-400">
            <p>
              Need help? Check the browser console for hints and hidden functions.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
