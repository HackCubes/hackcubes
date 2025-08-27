// Test the invitation API endpoint
const testInvitationAPI = async () => {
  const testData = {
    assessmentId: '550e8400-e29b-41d4-a716-446655440000',
    emails: [
      { email: 'test@example.com', name: 'Test User' },
      { email: 'candidate@example.com', name: 'Test Candidate' }
    ]
  };

  try {
    const response = await fetch('/api/assessments/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('API Response:', result);
    
    if (response.ok) {
      console.log('✅ Invitations sent successfully!');
      if (result.emailResults) {
        console.log(`📧 Emails sent: ${result.emailResults.sent}`);
        console.log(`❌ Emails failed: ${result.emailResults.failed}`);
      }
    } else {
      console.log('❌ API Error:', result.message);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
};

// Add test button to page
const addTestButton = () => {
  const button = document.createElement('button');
  button.textContent = 'Test Invitation API';
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4F46E5;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    z-index: 1000;
    font-weight: bold;
  `;
  button.onclick = testInvitationAPI;
  document.body.appendChild(button);
};

// Auto-add when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addTestButton);
} else {
  addTestButton();
}

console.log('🧪 Test script loaded! Look for the "Test Invitation API" button in the top-right corner.');
