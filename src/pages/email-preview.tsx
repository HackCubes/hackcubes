'use client';

import { useState } from 'react';

export default function EmailPreviewPage() {
  const [previewType, setPreviewType] = useState<'early-joiner' | 'waitlist'>('early-joiner');
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testName, setTestName] = useState('John Hacker');

  const generateEarlyJoinerEmail = (name: string, email: string) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to HackCubes</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; color: #ffffff; }
        .container { max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 8px; overflow: hidden; border: 1px solid #333; }
        .header { background: linear-gradient(135deg, #00FF7F, #3BE8FF); padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 32px; font-weight: bold; color: #0a0a0a; }
        .content { padding: 40px 30px; }
        .content h2 { color: #00FF7F; font-size: 24px; margin-bottom: 20px; }
        .content p { line-height: 1.6; margin-bottom: 20px; color: #cccccc; }
        .highlight { background-color: #2a2a2a; border-left: 4px solid #00FF7F; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .features { list-style: none; padding: 0; }
        .features li { margin: 10px 0; padding-left: 25px; position: relative; }
        .features li:before { content: "⚡"; position: absolute; left: 0; color: #00FF7F; }
        .footer { background-color: #0a0a0a; padding: 30px; text-align: center; border-top: 1px solid #333; }
        .footer p { color: #666; font-size: 14px; margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 HackCubes</h1>
            <p style="color: #0a0a0a; margin: 10px 0 0 0; font-size: 18px;">Welcome to the Future of Cybersecurity Learning</p>
        </div>
        
        <div class="content">
            <h2>Welcome Aboard, ${name}! 🚀</h2>
            
            <p>Thank you for joining the HackCubes early access community! You're now part of an exclusive group of cybersecurity enthusiasts who will be first to experience our revolutionary platform.</p>
            
            <div class="highlight">
                <p><strong>🎉 You're in!</strong> Your email <strong>${email}</strong> has been successfully added to our early access list.</p>
            </div>
            
            <h3 style="color: #3BE8FF;">What happens next?</h3>
            <ul class="features">
                <li>Get exclusive updates on our development progress</li>
                <li>Be the first to access new features and challenges</li>
                <li>Receive early bird pricing and special offers</li>
                <li>Join our private community of security professionals</li>
            </ul>
        </div>
        
        <div class="footer">
            <p><strong>HackCubes</strong> - Revolutionizing Cybersecurity Education</p>
            <p>&copy; 2025 HackCubes. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
  };

  const generateWaitlistEmail = (name: string, email: string) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Challenge Completed</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; color: #ffffff; }
        .container { max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 8px; overflow: hidden; border: 1px solid #333; }
        .header { background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 32px; font-weight: bold; color: #0a0a0a; }
        .content { padding: 40px 30px; }
        .challenge-badge { background: linear-gradient(135deg, #ff6b35, #f7931e); color: #0a0a0a; padding: 20px; text-align: center; border-radius: 10px; margin: 30px 0; font-weight: bold; font-size: 18px; }
        .highlight { background-color: #2a2a2a; border-left: 4px solid #00FF7F; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .skills-learned { background-color: #2a2a2a; padding: 25px; border-radius: 8px; margin: 25px 0; }
        .skills-learned h4 { color: #3BE8FF; margin-bottom: 15px; }
        .skills-learned ul { list-style: none; padding: 0; }
        .skills-learned li { margin: 8px 0; padding-left: 25px; position: relative; color: #cccccc; }
        .skills-learned li:before { content: "✓"; position: absolute; left: 0; color: #00FF7F; font-weight: bold; }
        .footer { background-color: #0a0a0a; padding: 30px; text-align: center; border-top: 1px solid #333; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏆 CHALLENGE COMPLETED!</h1>
            <p style="color: #0a0a0a; margin: 10px 0 0 0; font-size: 18px;">Welcome to the HackCubes Waitlist</p>
        </div>
        
        <div class="content">
            <h2 style="color: #00FF7F;">Impressive work, ${name}! 🎯</h2>
            
            <p style="color: #cccccc;">Congratulations on successfully completing the HackCubes invite challenge! You've demonstrated the curiosity, persistence, and technical skills that define a true cybersecurity professional.</p>
            
            <div class="challenge-badge">
                🧩 HackCubes Challenge Solver 🧩
            </div>
            
            <div class="highlight">
                <p><strong>🎉 Waitlist Confirmed!</strong> Your email <strong>${email}</strong> has been successfully added to our exclusive waitlist.</p>
            </div>
            
            <div class="skills-learned">
                <h4>Skills you demonstrated:</h4>
                <ul>
                    <li>Browser developer tools proficiency</li>
                    <li>JavaScript function discovery</li>
                    <li>Base64 and ROT13 decoding</li>
                    <li>API interaction and HTTP requests</li>
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>HackCubes</strong> - Where Hackers Are Made</p>
            <p>&copy; 2025 HackCubes. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">📧 Email Template Preview</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label htmlFor="email-type" className="block text-sm font-medium text-gray-700 mb-2">
                Email Type
              </label>
              <select
                id="email-type"
                value={previewType}
                onChange={(e) => setPreviewType(e.target.value as 'early-joiner' | 'waitlist')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="early-joiner">Early Joiner Welcome</option>
                <option value="waitlist">Waitlist Confirmation</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="test-name" className="block text-sm font-medium text-gray-700 mb-2">
                Test Name
              </label>
              <input
                id="test-name"
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Hacker"
              />
            </div>
            
            <div>
              <label htmlFor="test-email" className="block text-sm font-medium text-gray-700 mb-2">
                Test Email
              </label>
              <input
                id="test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="test@example.com"
              />
            </div>
          </div>
          
          <div className="flex gap-4 mb-6">
            <div className="text-sm text-gray-600">
              <strong>Preview:</strong> {previewType === 'early-joiner' ? 'Early Joiner Welcome Email' : 'Waitlist Confirmation Email'}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <iframe
              srcDoc={previewType === 'early-joiner' 
                ? generateEarlyJoinerEmail(testName, testEmail)
                : generateWaitlistEmail(testName, testEmail)
              }
              className="w-full h-[800px] border border-gray-300 rounded"
              title="Email Preview"
            />
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Subject:</strong> {previewType === 'early-joiner' 
              ? '🎯 Welcome to HackCubes - Early Access Confirmed!'
              : '🎉 HackCubes Waitlist - Challenge Completed!'
            }</p>
            <p><strong>From:</strong> HackCubes &lt;noreply@hackcubes.com&gt;</p>
            <p><strong>To:</strong> {testEmail}</p>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}
