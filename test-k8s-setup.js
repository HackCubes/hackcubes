#!/usr/bin/env node

// Quick test for Kubernetes API
const testKubernetesAPI = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/k8s-instance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_status',
        question_id: 'test-question',
        candidate_id: 'test-user',
        username: 'testuser'
      })
    });
    
    const result = await response.json();
    console.log('Kubernetes API test result:', result);
  } catch (error) {
    console.error('Kubernetes API test failed:', error.message);
  }
};

if (process.argv[2] === 'test-k8s-api') {
  testKubernetesAPI();
}
