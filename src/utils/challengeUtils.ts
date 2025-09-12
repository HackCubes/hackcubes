// Helper function to get the expected port for a challenge
export function getChallengePort(question: any): number {
  let ports = [80]; // default

  // If question has docker_image, use it to determine port
  if (question?.docker_image) {
    const image = question.docker_image;
    
    // Set specific ports based on the challenge docker image
    if (image.includes('achieverewards')) {
      ports = [5000];
    } else if (image.includes('atlas-frontend')) {
      ports = [5173];
    } else if (image.includes('atlas-backend')) {
      ports = [6000];
    } else if (image.includes('portfolio')) {
      ports = [5000];
    } else if (image.includes('integration-frontend')) {
      ports = [80];
    } else if (image.includes('integration-backend')) {
      ports = [6000];
    } else if (image.includes('integration-localapi')) {
      ports = [8080];
    } else if (image.includes('conference')) {
      ports = [3000];
    } else if (image.includes('techcorp')) {
      ports = [8080];
    }
  }
  // Map challenge names to specific configurations
  else if (question?.name) {
    const challengeName = question.name.toLowerCase();
    
    if (challengeName.includes('achieverewards')) {
      ports = [5000];
    } else if (challengeName.includes('atlas')) {
      ports = [5173];
    } else if (challengeName.includes('financial') || challengeName.includes('portfolio')) {
      ports = [5000];
    } else if (challengeName.includes('integration') || challengeName.includes('project')) {
      ports = [80];
    } else if (challengeName.includes('techcon') || challengeName.includes('conference')) {
      ports = [3000];
    } else if (challengeName.includes('techcorp')) {
      ports = [8080];
    }
  }

  return ports[0]; // Return the primary port
}

// Format URL with port for display
export function formatChallengeUrl(ip: string, question: any): string {
  if (!ip || ip === 'N/A' || ip === 'pending') {
    return ip;
  }

  const port = getChallengePort(question);
  
  // If it's already a full URL, return as is
  if (ip.startsWith('http://') || ip.startsWith('https://')) {
    return `${ip}:${port}`;
  }
  
  // Otherwise construct the URL with port
  return `http://${ip}:${port}`;
}
