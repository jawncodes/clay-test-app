// Mock email service for development
// In production, this would send actual emails via Resend, SendGrid, etc.

export async function sendOTP(email: string, code: string): Promise<void> {
  // Mock email service - just log to console
  console.log('='.repeat(50));
  console.log(`📧 Mock Email Service`);
  console.log(`To: ${email}`);
  console.log(`Subject: Your login code`);
  console.log(`\nYour one-time password is: ${code}`);
  console.log(`This code expires in 10 minutes.`);
  console.log('='.repeat(50));
  
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));
}

