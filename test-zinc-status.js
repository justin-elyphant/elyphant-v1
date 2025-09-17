// Test the enhanced zinc status check for order timeline
const testZincStatusCheck = async () => {
  try {
    const response = await fetch('https://dmkxtkvlispxeqfzlczr.supabase.co/functions/v1/check-zinc-order-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta3h0a3ZsaXNweGVxZnpsY3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODYwNTYsImV4cCI6MjA1OTM2MjA1Nn0.L4maWmbU_MgnjWRuc9hGZweXVY4QCYjrnhFMGbdEebI'
      },
      body: JSON.stringify({
        zincOrderId: '7f5bb4b7601d7c2ef38afb0459946a20'
      })
    });
    
    const result = await response.json();
    console.log('Zinc status check result:', result);
    return result;
  } catch (error) {
    console.error('Error checking Zinc status:', error);
    return null;
  }
};

// Execute the test
testZincStatusCheck();